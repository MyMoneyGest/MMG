// screens/security/SetPinScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { useNavigation } from '@react-navigation/native';

const SetPinScreen = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSavePin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );

      // Enregistre le hash du PIN
      await setDoc(doc(db, 'users', user.uid, 'security', 'pin'), {
        pin: hashedPin,
        createdAt: serverTimestamp()
      });

        // 🔐 Met à jour le statut de vérification du PIN
      await setDoc(doc(db, 'users', user.uid, 'verifications', 'status'), {
        pinSet: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      Alert.alert('Succès', 'Votre code PIN a été défini.');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur enregistrement PIN :', error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Définir un code PIN</Text>
      <Text style={styles.subtitle}>Ce code servira à sécuriser certaines actions sensibles.</Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        placeholder="••••"
        onChangeText={setPin}
        value={pin}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSavePin}
        disabled={loading}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SetPinScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  button: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});