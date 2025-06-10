import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setLogLevel } from 'firebase/app';

setLogLevel('debug'); // Active les logs Firebase pour le débogage

/**
 * Upload une image à Firebase Storage pour un utilisateur donné.
 * @param uri URI locale de l'image (file://...)
 * @param uid UID utilisateur Firebase
 * @returns URL publique de l'image stockée
 */
export const uploadProfilePicture = async (uri: string, uid: string): Promise<string> => {
  try {
    if (!uri || !uid) {
      throw new Error("URI ou UID manquant");
    }

    console.log("🔁 Tentative d'upload depuis :", uri);

    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Échec du fetch de l'image : ${response.statusText}`);
    }

    const blob = await response.blob();

    const storageRef = ref(storage, `profilePictures/${uid}.jpg`);
    const metadata = {
      contentType: blob.type || 'image/jpeg', // fallback si type inconnu
    };

    await uploadBytes(storageRef, blob, metadata);

    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Upload terminé. URL :', downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'upload de la photo :', error?.message || error);
    throw error;
  }
};