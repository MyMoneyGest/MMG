import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

type SendCodeResult = {
  success: boolean;
  message: string;
};

export const sendConfirmationCode = async (email: string): Promise<SendCodeResult> => {
  const callable = httpsCallable(functions, 'sendConfirmationCode');
  const result = await callable({ email });
  return result.data as SendCodeResult;
};