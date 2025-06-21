import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendAmountAirtelScreen'>;

const SendAmountAirtelScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const auth = getAuth();
  const [airtelBalance, setAirtelBalance] = useState<number | null>(null);

  const { beneficiary } = route.params as any;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const airtelRef = doc(db, 'users', user.uid, 'linkedAccounts', 'airtel');
      const snapshot = await getDoc(airtelRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAirtelBalance(data.airtelBalance);
      }
    };

    fetchBalance();
  }, []);

  const handleContinue = async () => {
    const amountValue = parseInt(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    if (airtelBalance !== null && amountValue > airtelBalance) {
      Alert.alert('Erreur', 'Solde insuffisant.');
      return;
    }

    navigation.navigate('ConfirmSendAirtelScreen', {
      beneficiary,
      amount: amountValue,
      reason,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        {airtelBalance !== null && (
          <Text style={styles.balanceSmall}>
            💰 {airtelBalance.toLocaleString()} FCFA
          </Text>
        )}
      </View>

      <Text style={styles.title}>
        {`Envoyer à ${beneficiary.name ?? 'Nom inconnu'}`}
      </Text>

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