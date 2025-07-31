// services/vaultCommands.ts
import { auth, db } from '@/services/firebaseConfig';
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';

/**
 * Crée un ordre "deposit" (dépôt vers un coffre) et attend son exécution par la Cloud Function.
 */
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

/**
 * Crée un ordre "withdrawal" (retrait depuis un coffre) et attend son exécution par la Cloud Function.
 */
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

/**
 * Écoute le document de commande jusqu’à status "success" / "failed" (timeout 30s).
 */
function waitCommand(cmdRef: DocumentReference<DocumentData>) {
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(
      cmdRef,
      (s) => {
        const d = s.data();
        if (!d) return;
        if (d.status === 'success') { unsub(); resolve(d); }
        else if (d.status === 'failed') { unsub(); reject(new Error(d.error || 'Échec de l’opération')); }
      },
      (err) => { unsub(); reject(err); }
    );

    setTimeout(() => { unsub(); reject(new Error('Timeout')); }, 30000);
  });
}