import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    return String(email)
      .trim()
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) !== null;
  };


const handleReset = async () => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    Alert.alert('Erreur', 'Veuillez entrer votre adresse email.');
    return;
  }

  if (!isValidEmail(trimmedEmail)) {
  console.log('Rejeté avant Firebase :', trimmedEmail);
    Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
    return;
  }

  setLoading(true);

  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
    Alert.alert('Email envoyé', 'Vérifiez votre boîte mail.');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      Alert.alert('Utilisateur introuvable', 'Aucun compte associé à cette adresse.');
    } else {
      Alert.alert('Erreur', error.message);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>

      <TextInput
        style={styles.input}
        placeholder="Adresse email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Réinitialiser</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#00796B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});