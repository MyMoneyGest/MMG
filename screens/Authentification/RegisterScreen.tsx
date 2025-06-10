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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

type RegisterScreenProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer un email valide.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      // Créer l’utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mettre à jour le nom d’affichage dans Firebase Auth
      await updateProfile(user, {
        displayName: name,
      });

      // Enregistrer dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        createdAt: new Date(),
      });

      Alert.alert('Compte créé', 'Votre compte a été créé avec succès.');

      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erreur', 'Cet email est déjà utilisé.');
      } else {
        Alert.alert('Erreur Firebase', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom complet"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Adresse email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={secure}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={secure}
      />
      <TouchableOpacity onPress={() => setSecure(!secure)}>
        <Text style={styles.toggle}>{secure ? '👁️‍🗨️' : '🙈'}</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Créer un compte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#00796B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toggle: {
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 10,
    marginRight: 10,
  },
});