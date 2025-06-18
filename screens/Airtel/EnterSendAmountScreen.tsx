import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EnterSendAmountScreen'>;
type RouteParams = {
  beneficiary: {
    name?: string;
    phone: string;
  };
};

const EnterSendAmountScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { beneficiary } = route.params as RouteParams;

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleContinue = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
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
      <View style={styles.header}>
        <Text style={styles.title}>Montant & Motif</Text>
      </View>

      <Text style={styles.label}>Envoyer à :</Text>
      <Text style={styles.beneficiary}>
        {beneficiary?.name || 'Bénéficiaire'} ({beneficiary?.phone})
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Montant à envoyer"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Motif (facultatif)"
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continuer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default EnterSendAmountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E0F2F1',
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#00796B',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  beneficiary: {
    fontSize: 18,
    marginBottom: 20,
    color: '#004D40',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00796B',
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});