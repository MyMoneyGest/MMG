// services/enterpriseService.ts

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
  createdAt: any; // serveurTimestamp()
  displayName: string;
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
}

/**
 * Crée simultanément un utilisateur dirigeant et son entreprise dans Firestore.
 *
 * @param user - Objet user avec uid, email, displayName optionnel
 * @param enterpriseData - Données de l'entreprise
 * @param managerData - Données du dirigeant (manager)
 */
export async function createEnterpriseUser(
  user: { uid: string; email: string; displayName?: string },
  enterpriseData: EnterpriseData,
  managerData: ManagerData
) {
  try {
    // Document user minimal (dirigeant)
    const userDoc: User = {
      uid: user.uid,
      email: user.email,
      type: 'enterprise',
      createdAt: serverTimestamp(),
      displayName: user.displayName || managerData.nom,
    };

    // Document entreprise complet
    const entrepriseDoc: Enterprise = {
      uid: user.uid,
      ...enterpriseData,
      dirigeant: managerData,
      createdAt: serverTimestamp(),
    };

    // Enregistre les 2 documents en parallèle
    await Promise.all([
      setDoc(doc(db, 'users', user.uid), userDoc),
      setDoc(doc(db, 'entreprises', user.uid), entrepriseDoc),
    ]);

    console.log('Utilisateur entreprise et entreprise créés avec succès');
  } catch (error) {
    console.error('Erreur lors de la création utilisateur + entreprise:', error);
    throw error;
  }
}