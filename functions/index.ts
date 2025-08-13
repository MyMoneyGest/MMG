import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/** ---------- Helpers ---------- */
function pad(n: number, len: number) { return String(n).padStart(len, '0'); }
function formatRef(counterNext: number, d: Date = new Date()) {
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1, 2);
  const day = pad(d.getUTCDate(), 2);
  return `TX-${y}${m}${day}-${pad(counterNext, 6)}`;
}

/** =========================================================
 *  1) Virements Airtel -> historique + activityFeed + notifications
 *  + réglage de demande de paiement si paymentRequestId présent
 *  =======================================================*/
export const processTransaction = onDocumentCreated('transactions/{transactionId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const txId = snap.id;
  const txData = snap.data() as {
    senderUid: string;
    receiverUid: string;
    amount: number;
    status?: string;
    note?: string;
    paymentRequestId?: string;
  };

  const transactionRef = snap.ref;
  const senderUid = txData?.senderUid;
  const receiverUid = txData?.receiverUid;
  const amount = Number(txData?.amount);

  if (!senderUid || !receiverUid || !amount || !Number.isFinite(amount) || amount <= 0 || senderUid === receiverUid) {
    await transactionRef.update({ status: 'failed', error: 'Paramètres invalides' }).catch(() => {});
    return;
  }

  const senderAirtelRef   = db.doc(`users/${senderUid}/linkedAccounts/airtel`);
  const receiverAirtelRef = db.doc(`users/${receiverUid}/linkedAccounts/airtel`);

  const senderTxRef   = db.doc(`users/${senderUid}/linkedAccounts/airtel/transactions/${txId}`);
  const receiverTxRef = db.doc(`users/${receiverUid}/linkedAccounts/airtel/transactions/${txId}`);
  const senderFeedRef   = db.doc(`users/${senderUid}/activityFeed/${txId}`);
  const receiverFeedRef = db.doc(`users/${receiverUid}/activityFeed/${txId}`);
  const senderDirRef   = db.doc(`phoneDirectory/${senderUid}`);
  const receiverDirRef = db.doc(`phoneDirectory/${receiverUid}`);

  const receiverNotifRef = db.doc(`users/${receiverUid}/notifications/tx_${txId}`);
  const senderNotifRef   = db.doc(`users/${senderUid}/notifications/tx_${txId}_sender`);

  const counterRef = db.doc('globalCounters/transactions');

  let reference: string | null = null;

  try {
    await db.runTransaction(async (t) => {
      // Idempotence
      const freshTx = await t.get(transactionRef);
      const status = freshTx.get('status');
      if (status && status !== 'pending') {
        console.log(`[processTransaction] ${txId} déjà traité (status=${status}).`);
        return;
      }

      const [
        senderSnap, receiverSnap, counterSnap,
        senderDirSnap, receiverDirSnap,
        senderFeedSnap, receiverFeedSnap,
      ] = await Promise.all([
        t.get(senderAirtelRef),
        t.get(receiverAirtelRef),
        t.get(counterRef),
        t.get(senderDirRef),
        t.get(receiverDirRef),
        t.get(senderFeedRef),
        t.get(receiverFeedRef),
      ]);

      if (!senderSnap.exists) {
        t.update(transactionRef, { status: 'failed', error: 'Compte expéditeur introuvable' });
        return;
      }

      const senderBalance = Number(senderSnap.get('airtelBalance') ?? 0);
      if (senderBalance < amount) {
        t.update(transactionRef, { status: 'failed', error: 'Solde insuffisant' });
        return;
      }

      // Init receiver si besoin
      if (!receiverSnap.exists) {
        t.set(receiverAirtelRef, {
          airtelBalance: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      // Débit/Crédit
      t.update(senderAirtelRef, { airtelBalance: admin.firestore.FieldValue.increment(-amount) });
      t.update(receiverAirtelRef,{ airtelBalance: admin.firestore.FieldValue.increment(+amount) });

      // Compteur + référence
      let nextVal: number;
      if (!counterSnap.exists) {
        nextVal = 1;
        t.set(counterRef, { value: nextVal, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        const current = Number(counterSnap.get('value') ?? 0);
        nextVal = current + 1;
        t.update(counterRef, { value: admin.firestore.FieldValue.increment(1), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      reference = formatRef(nextVal);

      // Noms lisibles
      const senderName =
        (senderDirSnap.exists && (senderDirSnap.get('name') || senderDirSnap.get('displayName') || senderDirSnap.get('phone'))) || 'Utilisateur';
      const receiverName =
        (receiverDirSnap.exists && (receiverDirSnap.get('name') || receiverDirSnap.get('displayName') || receiverDirSnap.get('phone'))) || 'Utilisateur';

      // Historique Airtel
      t.set(senderTxRef, {
        mainTransactionId: txId,
        reference,
        direction: 'debit',
        type: 'virement_émis',
        to: receiverUid,
        toName: receiverName,
        amount,
        note: txData?.note ?? '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      t.set(receiverTxRef, {
        mainTransactionId: txId,
        reference,
        direction: 'credit',
        type: 'virement_reçu',
        from: senderUid,
        fromName: senderName,
        amount,
        note: txData?.note ?? '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Activity feed
      if (!senderFeedSnap.exists) {
        t.set(senderFeedRef, {
          source: 'airtel',
          kind: 'transfer_out',
          direction: 'debit',
          amount,
          note: txData?.note ?? '',
          reference,
          mainTransactionId: txId,
          counterpartyUid: receiverUid,
          counterpartyName: receiverName,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      if (!receiverFeedSnap.exists) {
        t.set(receiverFeedRef, {
          source: 'airtel',
          kind: 'transfer_in',
          direction: 'credit',
          amount,
          note: txData?.note ?? '',
          reference,
          mainTransactionId: txId,
          counterpartyUid: senderUid,
          counterpartyName: senderName,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Notifs virement
      t.set(receiverNotifRef, {
        title: 'Virement reçu',
        message: `${senderName} vous a envoyé ${amount.toLocaleString()} FCFA. Réf: ${reference}`,
        kind: 'transfer_in',
        txId,
        reference,
        amount,
        counterpartyUid: senderUid,
        counterpartyName: senderName,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      });
      t.set(senderNotifRef, {
        title: 'Virement envoyé',
        message: `Vous avez envoyé ${amount.toLocaleString()} FCFA à ${receiverName}. Réf: ${reference}`,
        kind: 'transfer_out',
        txId,
        reference,
        amount,
        counterpartyUid: receiverUid,
        counterpartyName: receiverName,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      });

      // Finalisation de la transaction globale
      t.update(transactionRef, {
        status: 'success',
        reference,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

  } catch (err: any) {
    console.error('Erreur runTransaction processTransaction:', err);
    try {
      await transactionRef.update({ status: 'failed', error: String(err?.message || 'Erreur serveur') });
    } catch {}
    return;
  }

  // ==== ⬇️⬇️ NOUVEAU : lier la demande de paiement APRÈS réussite du virement ⬇️⬇️ ====
  try {
    const reqId = txData.paymentRequestId;
    if (!reqId) {
      console.log(`[processTransaction] ${txId}: pas de paymentRequestId, rien à lier.`);
      return;
    }

    console.log(`[processTransaction] ${txId}: liaison avec paymentRequests/${reqId} …`);

    const reqRef  = db.doc(`paymentRequests/${reqId}`);
    const reqSnap = await reqRef.get();

    if (!reqSnap.exists) {
      console.warn(`[processTransaction] Demande ${reqId} introuvable.`);
      return;
    }

    const r = reqSnap.data() as any;
    // Sécurité : la partie payeuse est la target, le receveur est le requester
    if (r.status !== 'pending') {
      console.log(`[processTransaction] Demande ${reqId} déjà ${r.status}.`);
      return;
    }
    if (r.targetUid !== senderUid || r.requesterUid !== receiverUid) {
      console.warn(`[processTransaction] Incohérence R2P : target=${r.targetUid} vs sender=${senderUid} ; requester=${r.requesterUid} vs receiver=${receiverUid}`);
      return;
    }

    await reqRef.update({
      status: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paidByTx: txId,
      reference: reference ?? null,
    });

    const acceptedDecRef = db.doc(`paymentRequests/${reqId}/decisions/accepted_${txId}`);
    await acceptedDecRef.set({
      actorUid: senderUid, // la personne qui a payé (cible de la demande)
      decision: 'accepted',
      byTx: txId,
      reference: reference ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const amountStr = Number(r.amount || amount).toLocaleString();

    // Notifs de confirmation
    const notifTarget    = db.doc(`users/${senderUid}/notifications/req_${reqId}_paid_out`);
    const notifRequester = db.doc(`users/${receiverUid}/notifications/req_${reqId}_paid_in`);

    await Promise.all([
      notifTarget.set({
        title: 'Demande payée',
        message: `Vous avez payé ${amountStr} FCFA.`,
        kind: 'request_paid_out',
        paymentRequestId: reqId,
        reference: reference ?? null,
        amount: r.amount ?? amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      }),
      notifRequester.set({
        title: 'Demande réglée',
        message: `Votre demande de ${amountStr} FCFA a été réglée.`,
        kind: 'request_paid_in',
        paymentRequestId: reqId,
        reference: reference ?? null,
        amount: r.amount ?? amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      }),
    ]);

    console.log(`[processTransaction] Demande ${reqId} marquée paid.`);

  } catch (e) {
    console.error(`[processTransaction] Erreur liaison R2P:`, e);
  }
});

/** ==================================================================
 *  2) Ordres de coffre (deposit/withdrawal) -> exécution + activityFeed + notification
 *  =================================================================*/
export const processVaultCommand = onDocumentCreated(
  'users/{userId}/vaultCommands/{cmdId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { userId, cmdId } = event.params as { userId: string; cmdId: string };
    const data = snap.data() as {
      type: 'deposit' | 'withdrawal';
      vaultId: string;
      amount: number;
      note?: string;
      status?: 'pending';
    };

    const amount = Number(data?.amount ?? 0);
    if (!data?.vaultId || (data.type !== 'deposit' && data.type !== 'withdrawal') || !Number.isFinite(amount) || amount <= 0) {
      await snap.ref.update({ status: 'failed', error: 'Paramètres invalides' }).catch(()=>{});
      return;
    }

    const airtelRef = db.doc(`users/${userId}/linkedAccounts/airtel`);
    const vaultRef  = db.doc(`users/${userId}/vaults/${data.vaultId}`);
    const vaultTxRef = db.doc(`users/${userId}/vaults/${data.vaultId}/transactions/${cmdId}`);
    const feedRef   = db.doc(`users/${userId}/activityFeed/${cmdId}`);
    const notifRef  = db.doc(`users/${userId}/notifications/vault_${cmdId}`);
    const counterRef = db.doc('globalCounters/transactions');

    await db.runTransaction(async (t) => {
      // Idempotence
      const fresh = await t.get(snap.ref);
      if ((fresh.get('status') || '') !== 'pending') return;

      const [airtelSnap, vaultSnap, counterSnap, feedSnap, vaultTxSnap] = await Promise.all([
        t.get(airtelRef), t.get(vaultRef), t.get(counterRef),
        t.get(feedRef), t.get(vaultTxRef)
      ]);

      if (!airtelSnap.exists) { t.update(snap.ref, { status: 'failed', error: 'Compte Airtel introuvable' }); return; }
      if (!vaultSnap.exists)  { t.update(snap.ref, { status: 'failed', error: 'Coffre introuvable' }); return; }

      const airtelBalance = Number(airtelSnap.get('airtelBalance') ?? 0);
      const vaultBalance  = Number(vaultSnap.get('balance') ?? 0);

      const isDeposit = data.type === 'deposit';
      // Dépôt => débit Airtel, crédit Coffre
      // Retrait => crédit Airtel, débit Coffre
      if (isDeposit) {
        if (airtelBalance < amount) {
          t.update(snap.ref, { status: 'failed', error: 'Solde Airtel insuffisant' }); return;
        }
        t.update(airtelRef, { airtelBalance: admin.firestore.FieldValue.increment(-amount) });
        t.update(vaultRef,  { balance:      admin.firestore.FieldValue.increment(+amount) });
      } else {
        if (vaultBalance < amount) {
          t.update(snap.ref, { status: 'failed', error: 'Solde du coffre insuffisant' }); return;
        }
        t.update(airtelRef, { airtelBalance: admin.firestore.FieldValue.increment(+amount) });
        t.update(vaultRef,  { balance:      admin.firestore.FieldValue.increment(-amount) });
      }

      // Compteur + référence
      let nextVal: number;
      if (!counterSnap.exists) {
        nextVal = 1;
        t.set(counterRef, { value: nextVal, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        const current = Number(counterSnap.get('value') ?? 0);
        nextVal = current + 1;
        t.update(counterRef, { value: admin.firestore.FieldValue.increment(1), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      const reference = formatRef(nextVal);

      // Écriture transaction du coffre
      if (!vaultTxSnap.exists) {
        t.set(vaultTxRef, {
          type: isDeposit ? 'vault_deposit' : 'vault_withdrawal',
          amount,
          note: data?.note ?? '',
          reference,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Activity feed unifié
      if (!feedSnap.exists) {
        t.set(feedRef, {
          source: 'vault',
          kind: isDeposit ? 'vault_deposit' : 'vault_withdrawal',
          direction: isDeposit ? 'debit' : 'credit', // du point de vue Airtel de l'utilisateur
          amount,
          note: data?.note ?? '',
          reference,
          mainTransactionId: cmdId,
          vaultId: data.vaultId,
          vaultName: vaultSnap.get('name') || 'Coffre',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 🔔 Notification pour l'utilisateur
      const vaultName = vaultSnap.get('name') || 'Coffre';
      const notifTitle = isDeposit ? 'Dépôt confirmé' : 'Retrait confirmé';
      const notifMsg = isDeposit
        ? `Dépôt de ${amount.toLocaleString()} FCFA dans le coffre "${vaultName}". Réf: ${reference}`
        : `Retrait de ${amount.toLocaleString()} FCFA depuis le coffre "${vaultName}". Réf: ${reference}`;

      t.set(notifRef, {
        title: notifTitle,
        message: notifMsg,
        kind: isDeposit ? 'vault_deposit' : 'vault_withdrawal',
        cmdId,
        vaultId: data.vaultId,
        vaultName,
        reference,
        amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      });

      // Terminer l’ordre
      t.update(snap.ref, { status: 'success', reference, processedAt: admin.firestore.FieldValue.serverTimestamp() });
    }).catch(async (e) => {
      console.error('processVaultCommand error:', e);
      await snap.ref.update({ status: 'failed', error: String(e?.message || 'Erreur serveur') }).catch(()=>{});
    });
  }
);

/** =========================================================================================
 *  3) Mirroring de transactions de coffre -> activityFeed (si créées autrement que la Function)
 *     - Safe: ne crée rien si l'event existe déjà dans activityFeed.
 *  =======================================================================================*/
export const mirrorVaultTxToFeed = onDocumentCreated(
  'users/{userId}/vaults/{vaultId}/transactions/{vaultTxId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { userId, vaultId, vaultTxId } = event.params as {
      userId: string; vaultId: string; vaultTxId: string;
    };

    const data = snap.data() as {
      type: 'vault_deposit' | 'vault_withdrawal' | string;
      amount: number;
      note?: string;
      reference?: string | null;
      timestamp?: FirebaseFirestore.Timestamp;
    };

    const feedRef = db.doc(`users/${userId}/activityFeed/${vaultTxId}`);
    const vaultRef = db.doc(`users/${userId}/vaults/${vaultId}`);

    await db.runTransaction(async (t) => {
      const [feedSnap, vaultSnap] = await Promise.all([t.get(feedRef), t.get(vaultRef)]);
      if (feedSnap.exists) return; // déjà créé (ex: par processVaultCommand)

      const vaultName = vaultSnap.exists ? (vaultSnap.get('name') || 'Coffre') : 'Coffre';
      const amount = Number(data?.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return;

      const isDeposit = data.type === 'vault_deposit';
      const direction = isDeposit ? 'debit' : 'credit';
      const kind = isDeposit ? 'vault_deposit' : 'vault_withdrawal';

      t.set(feedRef, {
        source: 'vault',
        kind,
        direction,
        amount,
        note: data?.note ?? '',
        reference: data?.reference ?? null,
        vaultId,
        vaultName,
        mainTransactionId: vaultTxId,
        timestamp: data?.timestamp || admin.firestore.FieldValue.serverTimestamp(),
      });
    }).catch((e) => console.error('mirrorVaultTxToFeed error:', e));
  }
);

/** =========================================================
 *  4) Demandes de paiement — création -> notifications
 *  =======================================================*/
export const onPaymentRequestCreated = onDocumentCreated('paymentRequests/{reqId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const req = snap.data() as {
    requesterUid: string;
    targetUid: string;
    amount: number;
    note?: string;
    status: 'pending';
    requesterName?: string;
  };

  // Notifications (destinataire + accusé émetteur)
  const targetNotifRef    = db.doc(`users/${req.targetUid}/notifications/${snap.id}`);
  const requesterNotifRef = db.doc(`users/${req.requesterUid}/notifications/req_${snap.id}`);

  const requesterDisplay = req.requesterName || 'Un utilisateur';
  const msgTarget = `${requesterDisplay} vous demande ${Number(req.amount).toLocaleString()} FCFA${req.note ? ` – ${req.note}` : ''}.`;

  await targetNotifRef.set({
    title: 'Demande de paiement reçue',
    message: msgTarget,
    kind: 'request_in',
    paymentRequestId: snap.id,
    amount: req.amount,
    note: req.note || '',
    date: admin.firestore.FieldValue.serverTimestamp(),
    opened: false,
    read: false,
  });

  await requesterNotifRef.set({
    title: 'Demande envoyée',
    message: `Votre demande de ${Number(req.amount).toLocaleString()} FCFA est en attente.`,
    kind: 'request_out',
    paymentRequestId: snap.id,
    amount: req.amount,
    note: req.note || '',
    date: admin.firestore.FieldValue.serverTimestamp(),
    opened: false,
    read: false,
  });
  });
 
/**
 * 5) Demandes de paiement — décision (refus) -> status: 'declined' + notifications
 *    - Ne traite que 'declined' (l'acceptation passe par la création d'une transaction).
 */
export const onPaymentDecisionCreated = onDocumentCreated(
  'paymentRequests/{reqId}/decisions/{decisionId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { reqId } = event.params as { reqId: string };
    const dec = snap.data() as { actorUid: string; decision: string };

    if (dec.decision !== 'declined') return; // on ne gère ici que le refus

    await db.runTransaction(async (t) => {
      const reqRef = db.doc(`paymentRequests/${reqId}`);
      const reqSnap = await t.get(reqRef);
      if (!reqSnap.exists) return;

      const r = reqSnap.data() as any;
      if (r.status !== 'pending') return; // idempotent

      // Sécurité : seul la cible (targetUid) peut refuser
      if (dec.actorUid !== r.targetUid) return;

      // Marque la demande refusée
      t.update(reqRef, {
        status: 'declined',
        decidedAt: admin.firestore.FieldValue.serverTimestamp(),
        decidedBy: dec.actorUid,
      });

      // Notifications aux deux parties
      const notifTarget = db.doc(`users/${r.targetUid}/notifications/req_${reqId}_declined_out`);
      const notifRequester = db.doc(`users/${r.requesterUid}/notifications/req_${reqId}_declined_in`);

      const amount = Number(r.amount) || 0;
      const requesterName = r.requesterName || 'Utilisateur';

      t.set(notifTarget, {
        title: 'Demande refusée',
        message: `Vous avez refusé la demande de ${amount.toLocaleString()} FCFA (de ${requesterName}).`,
        kind: 'request_declined_out',
        paymentRequestId: reqId,
        amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      });

      t.set(notifRequester, {
        title: 'Demande refusée',
        message: `Votre demande de ${amount.toLocaleString()} FCFA a été refusée.`,
        kind: 'request_declined_in',
        paymentRequestId: reqId,
        amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        read: false,
      });
    });
  }
);