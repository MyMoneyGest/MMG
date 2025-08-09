import { doc, runTransaction, getFirestore } from 'firebase/firestore';

export const generateTransactionRef = async (): Promise<string> => {
  const db = getFirestore();
  const counterRef = doc(db, 'globalCounters', 'transactions');

  const newRef = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const current = snapshot.exists() ? snapshot.data().count || 0 : 0;
    const next = current + 1;
    transaction.set(counterRef, { count: next });
    return next;
  });

  return `TX${String(newRef).padStart(6, '0')}`;
};