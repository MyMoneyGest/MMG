import { db } from './firebaseConfig';
import { collection, query, where, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';

interface Transaction {
  reference: string;
  type: string;
  amount: number;
  date: string; // ISO string
  sender: string;
  receiver: string;
  status: string;
  reason?: string;
}

export async function updateBalanceAndAddTransaction(
  phoneNumber: string,
  amount: number,
  transactionDetails: Omit<Transaction, 'date' | 'amount'>
) {
  try {
    console.log(`Recherche destinataire avec phoneNumber: ${phoneNumber}`);

    const q = query(collection(db, "airtel"), where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);

    console.log(`Nombre de documents trouvés: ${querySnapshot.size}`);

    if (querySnapshot.empty) {
      console.log("Aucun destinataire trouvé avec ce numéro.");
      return;
    }

    const docSnap = querySnapshot.docs[0];
    const docRef = docSnap.ref;
    const data = docSnap.data();

    console.log("Données du destinataire:", data);

    const currentBalance = data.airtelBalance ?? 0;
    const newBalance = currentBalance + amount;

    const newTransaction: Transaction = {
      ...transactionDetails,
      amount,
      date: new Date().toISOString(),
    };

    console.log("Mise à jour du solde et ajout de la transaction...");

    const batch = writeBatch(db);
    batch.update(docRef, {
      airtelBalance: newBalance,
      transactions: arrayUnion(newTransaction)
    });

    await batch.commit();

    console.log(`Mise à jour réussie. Nouveau solde: ${newBalance}`);

  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
  }
}