// ConfirmSendAirtelScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, runTransaction } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const ConfirmSendScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  //const route = useRoute();
  const route = useRoute<RouteProp<RootStackParamList, 'ConfirmSendAirtelScreen'>>();
  const { beneficiary, amount } = route.params as { beneficiary: any; amount: number };

  //const { beneficiary, amount } = route.params;


  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!password) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      const airtelRef = doc(db, 'users', user.uid, 'linkedAccounts', 'airtel');

      await runTransaction(db, async (transaction) => {
        const airtelSnap = await transaction.get(airtelRef);
        if (!airtelSnap.exists()) throw new Error('Compte Airtel introuvable');

        const data = airtelSnap.data();
        const currentBalance = data.airtelBalance || 0;

        if (amount > currentBalance) throw new Error('SOLDE_INSUFFISANT');

        const newBalance = currentBalance - amount;
        transaction.update(airtelRef, { airtelBalance: newBalance });

        const transactionData = {
          reference: `TX-${Date.now()}`,
          type: 'Envoi vers bénéficiaire',
          amount: -amount,
          date: new Date().toISOString(),
          sender: 'Vous',
          receiver: `${beneficiary.name} (${beneficiary.phone})`,
          status: 'Réussi',
        };

        const newTxs = [...(data.transactions || []), transactionData];
        transaction.update(airtelRef, { transactions: newTxs });
      });

      Alert.alert('Succès', 'Argent envoyé avec succès.');
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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmer l'envoi</Text>
      <Text style={styles.label}>Bénéficiaire :</Text>
      <Text style={styles.value}>{beneficiary.name} - {beneficiary.phone}</Text>

      <Text style={styles.label}>Montant :</Text>
      <Text style={styles.value}>{amount.toLocaleString()} FCFA</Text>

      <Text style={styles.label}>Mot de passe :</Text>
      <TextInput
        style={styles.input}
        placeholder="Votre mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSend} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Envoi en cours...' : 'Envoyer'}</Text>
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