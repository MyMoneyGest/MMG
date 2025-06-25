import { db } from './firebaseConfig';
import {
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface CollaboratorData {
  nom: string;
  prenom: string;
  email: string;
  fonction: string;
  telephone?: string;
}

interface CollaboratorUser {
  uid: string;
  email: string;
  type: 'collaborator';
  createdAt: any; // serverTimestamp()
  displayName: string;
  enterpriseId: string; // UID de l’entreprise (dirigeant)
  collaboratorInfo: CollaboratorData;
}

/**
 * Crée un utilisateur collaborateur lié à une entreprise existante
 *
 * @param user - objet user { uid, email, displayName }
 * @param collaboratorData - données du collaborateur (nom, fonction, etc.)
 * @param enterpriseId - uid de l’entreprise à laquelle le collaborateur est rattaché
 */
export async function createCollaboratorUser(
  user: { uid: string; email: string; displayName?: string },
  collaboratorData: CollaboratorData,
  enterpriseId: string
) {
  try {
    const collaboratorUserDoc: CollaboratorUser = {
      uid: user.uid,
      email: user.email,
      type: 'collaborator',
      createdAt: serverTimestamp(),
      displayName: user.displayName || `${collaboratorData.prenom} ${collaboratorData.nom}`,
      enterpriseId,
      collaboratorInfo: collaboratorData,
    };

    // Crée le document dans la collection users
    await setDoc(doc(db, 'users', user.uid), collaboratorUserDoc);

    console.log('Collaborateur créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création du collaborateur:', error);
    throw error;
  }
}