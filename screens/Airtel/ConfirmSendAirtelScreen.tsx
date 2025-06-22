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
import { collection, addDoc } from 'firebase/firestore'; // en haut si ce n'est pas encore importé
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

const ConfirmSendScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ConfirmSendAirtelScreen'>>();
  const { beneficiary, amount, reason = '' } = route.params;

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [passwordError, setPasswordError] = useState(''); // <- pour afficher le message d'erreur sous le champ

  const handleSend = async () => {
    setPasswordError('');  // reset erreur à chaque tentative

    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!password) {
      setPasswordError('Veuillez saisir votre mot de passe');
      return;
    }

    try {
      setIsLoading(true);

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Reset tentative d’erreur mot de passe après succès
      setFailedAttempts(0);

      const senderUid = user.uid;
      const airtelRef = doc(db, 'users', senderUid, 'linkedAccounts', 'airtel');

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
        const receiverRef = doc(db, 'users', beneficiary.linkedUid, 'linkedAccounts', 'airtel');

        await runTransaction(db, async (transaction: {
          get: (arg0: DocumentReference<DocumentData, DocumentData>) => any;
          update: (arg0: DocumentReference<DocumentData, DocumentData>, arg1: any) => void;
        }) => {
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
          const notifRef = collection(db, 'users', beneficiary.linkedUid, 'notifications');
          await addDoc(notifRef, {
            title: 'Virement reçu',
            message: `Vous avez reçu ${amount.toLocaleString()} FCFA de ${currentUserName}.`,
            date: new Date().toISOString(),
            read: false,
          });
        });

      } else {
        await runTransaction(db, async (transaction: { update: (arg0: DocumentReference<DocumentData, DocumentData>, arg1: any) => void; }) => {
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
      setTimeout(() => {
        navigation.replace('TransactionDetail', {
          transaction: {
            reference,
            type: 'Virement émis',
            amount: -amount,
            date: new Date().toISOString(),
            sender: 'Vous',
            receiver: beneficiary.name,
            status: 'Réussi',
            reason,
            id: ''
          },
        });
      }, 200);


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
        setIsLoading(false);
        return;
      }

      if (isWrongPassword) {
        setPasswordError(`Mot de passe incorrect (tentative ${nextAttempts} sur 5)`);
        setIsLoading(false);
        return;
      }

      if (error.message === 'SOLDE_INSUFFISANT') {
        Alert.alert('Erreur', 'Votre solde principal est insuffisant pour cette opération.');
        setIsLoading(false);
        return;
      }

      if (error.message === 'COFFRE_INSUFFISANT') {
        Alert.alert('Erreur', 'Le montant dépasse le solde disponible dans ce coffre.');
        setIsLoading(false);
        return;
      }

      if (error.message?.startsWith('BLOQUÉ_JUSQUAU_')) {
        const date = error.message.replace('BLOQUÉ_JUSQUAU_', '');
        Alert.alert('Coffre bloqué', `Retrait possible à partir du ${date}.`);
        setIsLoading(false);
        return;
      }

      Alert.alert('Erreur', 'Une erreur inattendue est survenue. Veuillez réessayer.');
      setIsLoading(false);
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
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Votre mot de passe"
        secureTextEntry
        value={password}
        onChangeText={text => {
          setPassword(text);
          if (passwordError) setPasswordError('');
        }}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
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
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#004D40',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
}
)
;