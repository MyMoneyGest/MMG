import { db } from './firebaseConfig';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Génère un code entreprise unique et l'enregistre dans Firestore.
 * @param entrepriseId ID de l'entreprise (lié au document "entreprises")
 * @param expiresInMinutes Durée de validité du code en minutes
 * @returns Code généré
 */
export const generateEnterpriseCode = async (
  entrepriseId: string,
  expiresInMinutes: number = 60
): Promise<string> => {
  const rawCode = uuidv4().slice(0, 8).toUpperCase(); // Exemple: 4A8F2B9C
  const code = rawCode.replace(/[^A-Z0-9]/g, '');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  const codeRef = doc(collection(db, 'enterpriseCodes'), code);

  await setDoc(codeRef, {
    code,
    entrepriseId,
    used: false,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  console.log(`✅ Code généré : ${code} (exp. dans ${expiresInMinutes} min)`);
  return code;
};