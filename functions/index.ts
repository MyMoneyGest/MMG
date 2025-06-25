import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();

const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SendConfirmationCodeData {
  email: string;
}

export const sendConfirmationCode = functions.https.onCall(
  async (request: functions.https.CallableRequest) => {
    const data = request.data as SendConfirmationCodeData;

    if (!data || typeof data.email !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email est requis et doit être une chaîne de caractères'
      );
    }

    const email = data.email.trim().toLowerCase();

    if (!emailRegex.test(email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Format email invalide');
    }

    const codesRef = admin.firestore().collection('SendconfirmationCodes').doc(email);
    const doc = await codesRef.get();

    if (doc.exists) {
      const existingData = doc.data();
      const createdAt = existingData?.createdAt?.toDate?.();
      if (createdAt && Date.now() - createdAt.getTime() < 5 * 60 * 1000) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Un code a déjà été envoyé récemment. Veuillez patienter.'
        );
      }
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await codesRef.set({
      code: confirmationCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const msg = {
      to: email,
      from: 'mymoneygest@gmail.com',
      subject: 'Votre code de confirmation pour MyMoneyGest',
      text: `Voici votre code de confirmation : ${confirmationCode}`,
      html: `<p>Voici votre code de confirmation : <strong>${confirmationCode}</strong></p>`,
    };

    try {
      await sgMail.send(msg);
      console.log(`Code envoyé à ${email} à ${new Date().toISOString()}`);
      return { success: true, message: 'Code envoyé avec succès' };
    } catch (error) {
      console.error('Erreur envoi email', error);
      throw new functions.https.HttpsError('internal', 'Erreur lors de l\'envoi de l\'email');
    }
  }
);