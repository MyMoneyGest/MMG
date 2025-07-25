import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const processTransaction = onDocumentCreated('transactions/{transactionId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const data = snap.data() as {
    senderUid: string;
    receiverUid: string;
    amount: number;
  };

  if (!data?.senderUid || !data?.receiverUid || !data?.amount) {
    console.error('Transaction invalide : données manquantes', data);
    return;
  }

  const { senderUid, receiverUid, amount } = data;
  const transactionRef = snap.ref;

  const senderRef = db.doc(`users/${senderUid}/linkedAccounts/airtel`);
  const receiverRef = db.doc(`users/${receiverUid}/linkedAccounts/airtel`);

  await db.runTransaction(async (t) => {
    const senderSnap = await t.get(senderRef);
    const receiverSnap = await t.get(receiverRef);

    const senderBalance = senderSnap.data()?.airtelBalance || 0;
    const receiverBalance = receiverSnap.data()?.airtelBalance || 0;

    if (senderBalance < amount) {
      await t.update(transactionRef, {
        status: 'failed',
        error: 'Solde insuffisant',
      });
      return;
    }

    t.update(senderRef, {
      airtelBalance: senderBalance - amount,
      transactions: admin.firestore.FieldValue.arrayUnion({
        type: 'virement_émis',
        to: receiverUid,
        amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    t.update(receiverRef, {
      airtelBalance: receiverBalance + amount,
      transactions: admin.firestore.FieldValue.arrayUnion({
        type: 'virement_reçu',
        from: senderUid,
        amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    t.update(transactionRef, { status: 'success' });
  });
});