import { db } from './firebaseConfig';
import {
  collection,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface EnterpriseData {
  nom: string;
  rccm: string;
  nif: string;
  formeJuridique: string;
  secteur: string;
  adresse: string;
  telephone: string;
}

interface ManagerData {
  nom: string;
  fonction: string;
  email: string;
}

interface User {
  uid: string;
  email: string;
  type: 'enterprise' | 'collaborator';
  createdAt: any;
  displayName: string;
  enterpriseId: string;
}

interface Enterprise {
  uid: string;
  nom: string;
  rccm: string;
  nif: string;
  formeJuridique: string;
  secteur: string;
  adresse: string;
  telephone: string;
  dirigeant: ManagerData;
  createdAt: any;
  createdBy: string;
}

/**
 * Crée simultanément un utilisateur dirigeant et son entreprise dans Firestore.
 *
 * @param user - Objet utilisateur (Firebase Auth)
 * @param enterpriseData - Données de l'entreprise
 * @param managerData - Données du dirigeant
 */
export async function createEnterpriseUser(
  user: { uid: string; email: string; displayName?: string },
  enterpriseData: EnterpriseData,
  managerData: ManagerData
) {
  try {
    // 🔹 Crée un nouvel ID pour l'entreprise
    const newEnterpriseRef = doc(collection(db, 'enterprises'));
    const enterpriseId = newEnterpriseRef.id;

    // 🔹 Document entreprise
    const entrepriseDoc: Enterprise = {
      uid: enterpriseId,
      ...enterpriseData,
      dirigeant: managerData,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    };

    // 🔹 Document utilisateur
    const userDoc: User = {
      uid: user.uid,
      email: user.email,
      type: 'enterprise',
      createdAt: serverTimestamp(),
      displayName: user.displayName || managerData.nom,
      enterpriseId, // 🔑 clé indispensable pour retrouver l'entreprise
    };

    // 🔹 Enregistrement simultané
    await Promise.all([
      setDoc(doc(db, 'users', user.uid), userDoc),
      setDoc(newEnterpriseRef, entrepriseDoc),
    ]);

    console.log('✅ Utilisateur entreprise et entreprise créés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création utilisateur + entreprise:', error);
    throw error;
  }
}