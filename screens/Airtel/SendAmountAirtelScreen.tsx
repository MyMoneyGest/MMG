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

type SendAmountAirtelScreenRouteProp = RouteProp<RootStackParamList, 'SendAmountAirtelScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendAmountAirtelScreen'>;

const SendAmountAirtelScreen = () => {
  const route = useRoute<SendAmountAirtelScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [airtelBalance, setAirtelBalance] = useState<number | null>(null);

  const { beneficiary } = route.params;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleContinue = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    navigation.navigate('ConfirmSendAirtelScreen', {
      beneficiary,
      amount: parseInt(amount),
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

      <Text style={styles.title}>Envoyer à {beneficiary.name}</Text>

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