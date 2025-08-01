// screens/Airtel/AirtelWithdrawScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const AirtelWithdrawScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    if (password.trim() === '') {
      Alert.alert('Erreur', 'Mot de passe requis.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non authentifié");

      await addDoc(collection(db, 'transactions'), {
        senderUid: user.uid,
        receiverUid: null,
        amount: Number(amount),
        note: location ? `Retrait à ${location}` : 'Retrait vers point physique',
        type: 'withdrawal',
        status: 'pending',
        createdAt: serverTimestamp(),
        airtel: true,
      });

      Alert.alert('Demande envoyée', 'Un agent validera le retrait prochainement.');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Demander un retrait</Text>

        <TextInput
          style={styles.input}
          placeholder="Montant à retirer"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TextInput
          style={styles.input}
          placeholder="Point de retrait (optionnel)"
          value={location}
          onChangeText={setLocation}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleWithdraw}>
          <Ionicons name="cash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Confirmer la demande</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AirtelWithdrawScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});