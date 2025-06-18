import React, { useState } from 'react';
import {
View,
Text,
TextInput,
TouchableOpacity,
StyleSheet,
Alert,
SafeAreaView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

// Types

type SendAmountAirtelScreenRouteProp = RouteProp<RootStackParamList, 'SendAmountAirtelScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendAmountAirtelScreen'>;


const SendAmountAirtelScreen = () => {
const route = useRoute<SendAmountAirtelScreenRouteProp>();
const navigation = useNavigation<NavigationProp>();
const auth = getAuth();
const [airtelBalance, setAirtelBalance] = useState<number | null>(null);

const { beneficiary } = route.params;
const [amount, setAmount] = useState('');
const [reason, setReason] = useState('');

const handleContinue = async () => {
if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
return;
}

// Naviguer vers confirmation avec données nécessaires
navigation.navigate('ConfirmSendAirtelScreen', {
  beneficiary,
  amount: parseInt(amount),
  reason,
});

};

return ( <SafeAreaView style={styles.container}>

  <View style={styles.headerRow}>
      {airtelBalance !== null && (
        <Text style={styles.balanceSmall}>
          💰 {airtelBalance.toLocaleString()} FCFA
        </Text>
      )}
  </View>

  <Text style={styles.title}>{`Envoyer à ${beneficiary.name ?? 'Nom inconnu'}`}</Text>

  <TextInput
    placeholder="Montant"
    keyboardType="numeric"
    value={amount}
    onChangeText={setAmount}
    style={styles.input}
  />

  <TextInput
    placeholder="Motif (facultatif)"
    value={reason}
    onChangeText={setReason}
    style={styles.input}
  />

  <TouchableOpacity
    style={[styles.button, !amount && styles.disabledButton]}
    onPress={handleContinue}
    disabled={!amount}
  >
    <Text style={styles.buttonText}>Continuer</Text>
  </TouchableOpacity>
</SafeAreaView>

);
};

export default SendAmountAirtelScreen;

// Fonction exportée pour traitement réel du transfert
export const transferMoneyToUser = async ({
senderUid,
receiverUid,
amount,
senderName,
receiverName,
generateReference,
reason = '',
}: {
senderUid: string;
receiverUid: string;
amount: number;
senderName: string;
receiverName: string;
generateReference: () => Promise<string>;
reason?: string;
}) => {
const senderRef = doc(db, 'users', senderUid, 'linkedAccounts', 'airtel');
const receiverRef = doc(db, 'users', receiverUid, 'linkedAccounts', 'airtel');

await runTransaction(db, async (transaction) => {
const senderSnap = await transaction.get(senderRef);
const receiverSnap = await transaction.get(receiverRef);

if (!senderSnap.exists()) throw new Error("Le compte de l'expéditeur est introuvable.");
if (!receiverSnap.exists()) throw new Error("Le compte du destinataire est introuvable.");

const senderData = senderSnap.data();
const receiverData = receiverSnap.data();

const senderBalance = senderData.airtelBalance || 0;
const receiverBalance = receiverData.airtelBalance || 0;

if (amount > senderBalance) throw new Error('SOLDE_INSUFFISANT');

const reference = await generateReference();
const now = Timestamp.now().toDate().toISOString();

const senderTx = {
  reference,
  type: 'Virement émis',
  amount: -amount,
  date: now,
  sender: 'Vous',
  receiver: receiverName,
  status: 'Réussi',
  reason,
};

const receiverTx = {
  reference,
  type: 'Virement reçu',
  amount: amount,
  date: now,
  sender: senderName,
  receiver: 'Vous',
  status: 'Réussi',
  reason,
};

transaction.update(senderRef, {
  airtelBalance: senderBalance - amount,
  transactions: [...(senderData.transactions || []), senderTx],
});

transaction.update(receiverRef, {
  airtelBalance: receiverBalance + amount,
  transactions: [...(receiverData.transactions || []), receiverTx],
});

});
};

const styles = StyleSheet.create({
container: { flex: 1, padding: 20, backgroundColor: '#fff' },
headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
input: {
borderBottomWidth: 1,
borderColor: '#ccc',
paddingVertical: 10,
marginBottom: 20,
},
button: {
backgroundColor: '#00796B',
padding: 15,
borderRadius: 8,
alignItems: 'center',
},
disabledButton: {
backgroundColor: '#ccc',
},
buttonText: {
color: '#fff',
fontWeight: 'bold',
},
balanceSmall: {
fontSize: 14,
color: '#00796B',
fontWeight: '600',
},
});