"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorVaultTxToFeed = exports.processVaultCommand = exports.processTransaction = void 0;
// functions/src/index.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
/** ---------- Helpers ---------- */
function pad(n, len) { return String(n).padStart(len, '0'); }
function formatRef(counterNext, d = new Date()) {
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1, 2);
    const day = pad(d.getUTCDate(), 2);
    return `TX-${y}${m}${day}-${pad(counterNext, 6)}`;
}
/** =========================================================
 *  1) Virements Airtel -> historique + activityFeed + notifications
 *  =======================================================*/
exports.processTransaction = (0, firestore_1.onDocumentCreated)('transactions/{transactionId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const txData = snap.data();
    const transactionRef = snap.ref;
    const senderUid = txData?.senderUid;
    const receiverUid = txData?.receiverUid;
    const amount = Number(txData?.amount);
    if (!senderUid || !receiverUid || !amount || !Number.isFinite(amount) || amount <= 0 || senderUid === receiverUid) {
        await transactionRef.update({ status: 'failed', error: 'Paramètres invalides' }).catch(() => { });
        return;
    }
    const senderAirtelRef = db.doc(`users/${senderUid}/linkedAccounts/airtel`);
    const receiverAirtelRef = db.doc(`users/${receiverUid}/linkedAccounts/airtel`);
    // Historique Airtel + ActivityFeed
    const txId = snap.id;
    const senderTxRef = db.doc(`users/${senderUid}/linkedAccounts/airtel/transactions/${txId}`);
    const receiverTxRef = db.doc(`users/${receiverUid}/linkedAccounts/airtel/transactions/${txId}`);
    // Activity feed
    const senderFeedRef = db.doc(`users/${senderUid}/activityFeed/${txId}`);
    const receiverFeedRef = db.doc(`users/${receiverUid}/activityFeed/${txId}`);
    // Phone directory (pour noms)
    const senderDirRef = db.doc(`phoneDirectory/${senderUid}`);
    const receiverDirRef = db.doc(`phoneDirectory/${receiverUid}`);
    // Notifications (ids stables pour éviter les doublons)
    const receiverNotifRef = db.doc(`users/${receiverUid}/notifications/tx_${txId}`);
    const senderNotifRef = db.doc(`users/${senderUid}/notifications/tx_${txId}_sender`);
    const counterRef = db.doc('globalCounters/transactions');
    await db.runTransaction(async (t) => {
        // Idempotence
        const freshTx = await t.get(transactionRef);
        const status = freshTx.get('status');
        if (status && status !== 'pending')
            return;
        const [senderSnap, receiverSnap, counterSnap, senderDirSnap, receiverDirSnap, senderFeedSnap, receiverFeedSnap,] = await Promise.all([
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
        // (Init receiver s'il n'existe pas)
        if (!receiverSnap.exists) {
            t.set(receiverAirtelRef, {
                airtelBalance: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        // Débit / Crédit
        t.update(senderAirtelRef, { airtelBalance: admin.firestore.FieldValue.increment(-amount) });
        t.update(receiverAirtelRef, { airtelBalance: admin.firestore.FieldValue.increment(+amount) });
        // Compteur + référence
        let nextVal;
        if (!counterSnap.exists) {
            nextVal = 1;
            t.set(counterRef, { value: nextVal, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        else {
            const current = Number(counterSnap.get('value') ?? 0);
            nextVal = current + 1;
            t.update(counterRef, { value: admin.firestore.FieldValue.increment(1), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        const reference = formatRef(nextVal);
        // Noms pour feed/historique
        const senderName = (senderDirSnap.exists && (senderDirSnap.get('name') || senderDirSnap.get('displayName') || senderDirSnap.get('phone'))) || 'Utilisateur';
        const receiverName = (receiverDirSnap.exists && (receiverDirSnap.get('name') || receiverDirSnap.get('displayName') || receiverDirSnap.get('phone'))) || 'Utilisateur';
        // Historique Airtel (sous-collections)
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
        // ActivityFeed — UNIFIÉ
        if (!senderFeedSnap.exists) {
            t.set(senderFeedRef, {
                source: 'airtel',
                kind: 'transfer_out',
                direction: 'debit', // point de vue sender
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
                direction: 'credit', // point de vue receiver
                amount,
                note: txData?.note ?? '',
                reference,
                mainTransactionId: txId,
                counterpartyUid: senderUid,
                counterpartyName: senderName,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // 🔔 Notifications
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
        });
        // (Optionnel) notif expéditeur
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
        });
        // Finalisation globale
        t.update(transactionRef, {
            status: 'success',
            reference,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }).catch(async (err) => {
        console.error('Erreur runTransaction processTransaction:', err);
        try {
            await transactionRef.update({ status: 'failed', error: String(err?.message || 'Erreur serveur') });
        }
        catch { }
    });
});
/** ==================================================================
 *  2) Ordres de coffre (deposit/withdrawal) -> exécution + activityFeed + notification
 *  =================================================================*/
exports.processVaultCommand = (0, firestore_1.onDocumentCreated)('users/{userId}/vaultCommands/{cmdId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const { userId, cmdId } = event.params;
    const data = snap.data();
    const amount = Number(data?.amount ?? 0);
    if (!data?.vaultId || (data.type !== 'deposit' && data.type !== 'withdrawal') || !Number.isFinite(amount) || amount <= 0) {
        await snap.ref.update({ status: 'failed', error: 'Paramètres invalides' }).catch(() => { });
        return;
    }
    const airtelRef = db.doc(`users/${userId}/linkedAccounts/airtel`);
    const vaultRef = db.doc(`users/${userId}/vaults/${data.vaultId}`);
    const vaultTxRef = db.doc(`users/${userId}/vaults/${data.vaultId}/transactions/${cmdId}`);
    const feedRef = db.doc(`users/${userId}/activityFeed/${cmdId}`);
    const notifRef = db.doc(`users/${userId}/notifications/vault_${cmdId}`);
    const counterRef = db.doc('globalCounters/transactions');
    await db.runTransaction(async (t) => {
        // Idempotence
        const fresh = await t.get(snap.ref);
        if ((fresh.get('status') || '') !== 'pending')
            return;
        const [airtelSnap, vaultSnap, counterSnap, feedSnap, vaultTxSnap] = await Promise.all([
            t.get(airtelRef), t.get(vaultRef), t.get(counterRef),
            t.get(feedRef), t.get(vaultTxRef)
        ]);
        if (!airtelSnap.exists) {
            t.update(snap.ref, { status: 'failed', error: 'Compte Airtel introuvable' });
            return;
        }
        if (!vaultSnap.exists) {
            t.update(snap.ref, { status: 'failed', error: 'Coffre introuvable' });
            return;
        }
        const airtelBalance = Number(airtelSnap.get('airtelBalance') ?? 0);
        const vaultBalance = Number(vaultSnap.get('balance') ?? 0);
        const isDeposit = data.type === 'deposit';
        // Dépôt => débit Airtel, crédit Coffre
        // Retrait => crédit Airtel, débit Coffre
        if (isDeposit) {
            if (airtelBalance < amount) {
                t.update(snap.ref, { status: 'failed', error: 'Solde Airtel insuffisant' });
                return;
            }
            t.update(airtelRef, { airtelBalance: admin.firestore.FieldValue.increment(-amount) });
            t.update(vaultRef, { balance: admin.firestore.FieldValue.increment(+amount) });
        }
        else {
            if (vaultBalance < amount) {
                t.update(snap.ref, { status: 'failed', error: 'Solde du coffre insuffisant' });
                return;
            }
            t.update(airtelRef, { airtelBalance: admin.firestore.FieldValue.increment(+amount) });
            t.update(vaultRef, { balance: admin.firestore.FieldValue.increment(-amount) });
        }
        // Compteur + référence
        let nextVal;
        if (!counterSnap.exists) {
            nextVal = 1;
            t.set(counterRef, { value: nextVal, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
        else {
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
        });
        // Terminer l’ordre
        t.update(snap.ref, { status: 'success', reference, processedAt: admin.firestore.FieldValue.serverTimestamp() });
    }).catch(async (e) => {
        console.error('processVaultCommand error:', e);
        await snap.ref.update({ status: 'failed', error: String(e?.message || 'Erreur serveur') }).catch(() => { });
    });
});
/** =========================================================================================
 *  3) Mirroring de transactions de coffre -> activityFeed (si créées autrement que la Function)
 *     - Safe: ne crée rien si l'event existe déjà dans activityFeed.
 *  =======================================================================================*/
exports.mirrorVaultTxToFeed = (0, firestore_1.onDocumentCreated)('users/{userId}/vaults/{vaultId}/transactions/{vaultTxId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const { userId, vaultId, vaultTxId } = event.params;
    const data = snap.data();
    const feedRef = db.doc(`users/${userId}/activityFeed/${vaultTxId}`);
    const vaultRef = db.doc(`users/${userId}/vaults/${vaultId}`);
    await db.runTransaction(async (t) => {
        const [feedSnap, vaultSnap] = await Promise.all([t.get(feedRef), t.get(vaultRef)]);
        if (feedSnap.exists)
            return; // déjà créé (ex: par processVaultCommand)
        const vaultName = vaultSnap.exists ? (vaultSnap.get('name') || 'Coffre') : 'Coffre';
        const amount = Number(data?.amount ?? 0);
        if (!Number.isFinite(amount) || amount <= 0)
            return;
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
});
