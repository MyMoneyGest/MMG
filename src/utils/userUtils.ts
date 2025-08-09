import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { hashString } from './hash';

export const getUserMainBalanceRef = (uid: string) => {
  return doc(db, 'users', uid, 'airtel', 'balance');
};

export const checkPassword = async (uid: string, inputPassword: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const data = snap.data();
    const hashed = await hashString(inputPassword);

    return hashed === data.password;
  } catch (e) {
    console.error('Erreur de vérification de mot de passe', e);
    return false;
  }
};