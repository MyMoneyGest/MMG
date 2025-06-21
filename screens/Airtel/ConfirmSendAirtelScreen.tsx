//ConfirmSendAirtelScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import {
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
//import { transferMoneyToUser } from './SendAmountAirtelScreen';

const ConfirmSendScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ConfirmSendAirtelScreen'>>();
  const { beneficiary, amount, reason = '' } = route.params;

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
   const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSend = async () => {
  const user = auth.currentUser;
  if (!user || !user.email) return;

  if (!password) {
    Alert.alert('Oups !', 'Veuillez saisir votre mot de passe');
    return;
  }

  const senderUid = user.uid;
  const airtelRef = doc(db, 'users', senderUid, 'linkedAccounts', 'airtel');

  try {
    setIsLoading(true);

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    const senderSnap = await getDoc(airtelRef);
    if (!senderSnap.exists()) throw new Error('Compte Airtel introuvable');
    const senderData = senderSnap.data();
    const senderBalance = senderData.airtelBalance || 0;

    if (amount > senderBalance) throw new Error('SOLDE_INSUFFISANT');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const currentUserName = userDoc.exists() ? userDoc.data().name || 'sender.name' : 'Paul';

    const reference = `TX-${Date.now()}`;
    const now = new Date().toISOString();

    if (beneficiary.linkedUid) {
      // ✅ Cas B à un compte MMG
      const receiverRef = doc(db, 'users', beneficiary.linkedUid, 'linkedAccounts', 'airtel');
      
      await runTransaction(db, async (transaction: { get: (arg0: DocumentReference<DocumentData, DocumentData>) => any; update: (arg0: DocumentReference<DocumentData, DocumentData>, arg1: { airtelBalance: any; transactions: any[]; }) => void; }) => {
        const receiverSnap = await transaction.get(receiverRef);
        if (!receiverSnap.exists()) throw new Error("Destinataire introuvable");

        const receiverData = receiverSnap.data();
        const receiverBalance = receiverData.airtelBalance || 0;

        const senderTx = {
          reference,
          type: 'Virement émis',
          amount: -amount,
          date: now,
          sender: 'Vous',
          receiver: beneficiary.name,
          status: 'Réussi',
          reason,
        };

        const receiverTx = {
          reference,
          type: 'Virement reçu',
          amount,
          date: now,
          sender: currentUserName,
          receiver: 'Vous',
          status: 'Réussi',
          reason,
        };

        transaction.update(airtelRef, {
          airtelBalance: senderBalance - amount,
          transactions: [...(senderData.transactions || []), senderTx],
        });

        transaction.update(receiverRef, {
          airtelBalance: receiverBalance + amount,
          transactions: [...(receiverData.transactions || []), receiverTx],
        });
      });

    } else {
      // ❌ Cas B n’a pas de compte MMG
      await runTransaction(db, async (transaction: { update: (arg0: DocumentReference<DocumentData, DocumentData>, arg1: { airtelBalance: number; transactions: any[]; }) => void; }) => {
        const tx = {
          reference,
          type: 'Virement émis',
          amount: -amount,
          date: now,
          sender: 'Vous',
          receiver: `${beneficiary.name} - (${beneficiary.phone})`,
          status: 'Réussi',
          reason,
        };

        transaction.update(airtelRef, {
          airtelBalance: senderBalance - amount,
          transactions: [...(senderData.transactions || []), tx],
        });
      });
    }

    Alert.alert('Succès', 'Virement effectué avec succès.');
    navigation.navigate('AirtelMoney');
      } catch (error: any) {
            if (__DEV__) {
              console.error('Erreur lors de la transaction :', error);
            }
  
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
  
        const isWrongPassword =
          error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password';
  
        if (nextAttempts >= 5) {
          Alert.alert(
            'Trop de tentatives',
            'Vous allez être redirigé vers la réinitialisation du mot de passe.',
            [{ text: 'OK', onPress: () => navigation.navigate('ForgotPassword') }]
          );
          return;
        }
  
        if (isWrongPassword) {
          Alert.alert('Mot de passe incorrect', `Tentative ${nextAttempts} sur 5`);
          return;
        }
        if (error.message === 'SOLDE_INSUFFISANT') {
              Alert.alert('Erreur', 'Votre solde principal est insuffisant pour cette opération.');
              return;
            }

            if (error.message === 'COFFRE_INSUFFISANT') {
              Alert.alert('Erreur', 'Le montant dépasse le solde disponible dans ce coffre.');
              return;
            }

            if (error.message?.startsWith('BLOQUÉ_JUSQUAU_')) {
              const date = error.message.replace('BLOQUÉ_JUSQUAU_', '');
              Alert.alert('Coffre bloqué', `Retrait possible à partir du ${date}.`);
              return;
            }

            Alert.alert('Erreur', 'Une erreur inattendue est survenue. Veuillez réessayer.');
          }
        };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmer l'envoi</Text>

      <Text style={styles.label}>Bénéficiaire :</Text>
      <Text style={styles.value}>
        {beneficiary?.name ?? 'Nom inconnu'} - {beneficiary?.phone ?? 'Téléphone inconnu'}
      </Text>

      <Text style={styles.label}>Montant :</Text>
      <Text style={styles.value}>
        {`${Number(amount).toLocaleString()} FCFA`}
      </Text>

      <Text style={styles.label}>Mot de passe :</Text>
      <TextInput
        style={styles.input}
        placeholder="Votre mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSend}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Envoi en cours...' : 'Envoyer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmSendScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

function setFailedAttempts(nextAttempts: any) {
  throw new Error('Function not implemented.');
}
