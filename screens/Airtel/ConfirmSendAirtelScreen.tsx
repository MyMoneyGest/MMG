// ConfirmSendAirtelScreen.tsx

import React, { useState } from 'react';
import {
View,
Text,
StyleSheet,
TextInput,
TouchableOpacity,
Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { transferMoneyToUser } from './SendAmountAirtelScreen';

const ConfirmSendScreen = () => {
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
const route = useRoute<RouteProp<RootStackParamList, 'ConfirmSendAirtelScreen'>>();
const { beneficiary, amount, reason = '' } = route.params;

const [password, setPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);

const handleSend = async () => {
const user = auth.currentUser;
if (!user || !user.email) return;

if (!password) {
  Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
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
  const currentUserName = userDoc.exists() ? userDoc.data().fullName || 'Expéditeur' : 'Expéditeur';

  // Cas 1 : le bénéficiaire a un compte MMG (donc un UID est présent)
  const phoneToCheck = beneficiary.phone;

const querySnap = await getDocs(query(collection(db, 'users'), where('phone', '==', phoneToCheck)));

if (!querySnap.empty) {
  // utilisateur trouvé via son numéro => il a MMG
  const matchedUser = querySnap.docs[0];
  const receiverUid = matchedUser.id;
  const receiverName = matchedUser.data().fullName || beneficiary.name;

  // transfert avec crédit + historique chez B
  await transferMoneyToUser({
    senderUid: user.uid,
    receiverUid,
    amount,
    senderName: currentUserName,
    receiverName,
    generateReference: async () => `TX-${Date.now()}`,
    reason,
  });

  Alert.alert('Succès', 'Argent envoyé avec succès.');
  navigation.navigate('AirtelMoney');
  return;
}


  // Cas 2 : le bénéficiaire n’a pas de compte MMG, mais a probablement Airtel
  await runTransaction(db, async (transaction) => {
    const now = new Date().toISOString();
    const reference = `TX-${Date.now()}`;
    const transactionData = {
      reference,
      type: 'Virement émis',
      amount: -amount,
      date: now,
      sender: 'Vous',
      receiver: `${beneficiary.name} (${beneficiary.phone})`,
      status: 'Réussi',
      reason,
    };

    const updatedBalance = senderBalance - amount;
    if (updatedBalance < 0) throw new Error('SOLDE_INSUFFISANT');

    transaction.update(airtelRef, {
      airtelBalance: updatedBalance,
      transactions: [...(senderData.transactions || []), transactionData],
    });
  });

  Alert.alert(
    'Envoyé via Airtel',
    `Votre virement à ${beneficiary.name} a été pris en compte. Il sera traité par Airtel.`
  );
  navigation.navigate('AirtelMoney');
} catch (error: any) {
  console.error(error);
  if (error.code === 'auth/wrong-password') {
    Alert.alert('Erreur', 'Mot de passe incorrect');
  } else if (error.message === 'SOLDE_INSUFFISANT') {
    Alert.alert('Solde insuffisant', "Vous n'avez pas assez d'argent pour cette opération.");
  } else {
    Alert.alert('Erreur', 'Une erreur est survenue.');
  }
} finally {
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