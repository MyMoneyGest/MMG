// src/services/vaultCommands.ts
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export async function depositToVault(vaultId: string, amount: number, note = '') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Utilisateur non connecté');
  const cmdRef = await addDoc(collection(db, 'users', uid, 'vaultCommands'), {
    type: 'deposit',
    vaultId,
    amount: Math.trunc(amount),
    note,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return waitCommand(cmdRef);
}

export async function withdrawFromVault(vaultId: string, amount: number, note = '') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Utilisateur non connecté');
  const cmdRef = await addDoc(collection(db, 'users', uid, 'vaultCommands'), {
    type: 'withdrawal',
    vaultId,
    amount: Math.trunc(amount),
    note,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return waitCommand(cmdRef);
}

function waitCommand(cmdRef: any) {
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(cmdRef, (s: any) => {
      const d = s.data();
      if (!d) return;
      if (d.status === 'success') { unsub(); resolve(d); }
      if (d.status === 'failed')  { unsub(); reject(new Error(d.error || 'Échec de l’opération')); }
    });
    setTimeout(() => { unsub(); reject(new Error('Timeout')); }, 30000);
  });
}