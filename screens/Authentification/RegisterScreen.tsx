import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
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
  const [accountType, setAccountType] = useState<'personal' | null>(null);

  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  // Personnel uniquement
  const [name, setName] = useState('');

  // Champs communs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateEmail = (email: string) => {
    const commonDomains = [
      'gmail.com',
      'hotmail.com',
      'outlook.com',
      'yahoo.com',
      'icloud.com',
      'protonmail.com',
    ];
    const genericTLD = /\.(com|fr|org|net|ga|io)$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) return false;
    const domain = email.split('@')[1].toLowerCase();
    return commonDomains.includes(domain) || genericTLD.test(domain);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs obligatoires doivent être remplis.');
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
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      const userData = {
        uid: user.uid,
        email,
        type: 'personal',
        createdAt: new Date(),
        name,
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      Alert.alert('Succès', 'Compte créé avec succès.');
      navigation.navigate('Login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erreur', 'Cet email est déjà utilisé.');
      } else {
        Alert.alert('Erreur', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!accountType ? (
        <>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Choisissez le type de compte</Text>
          <View style={styles.accountTypeContainer}>
            <TouchableOpacity
              style={styles.accountTypeButton}
              onPress={() => setAccountType('personal')}
              activeOpacity={0.8}
            >
              <Text style={styles.accountTypeText}>Compte Personnel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accountTypeButton, styles.enterpriseButton]}
              onPress={() => navigation.navigate('RegisterCompteProScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.accountTypeText}>Compte Entreprise</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Compte Personnel</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
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
            placeholder="Confirmer mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secure}
          />

          <TouchableOpacity onPress={() => setSecure(!secure)} style={{ alignSelf: 'flex-end', marginBottom: 15 }}>
            <Text style={styles.toggle}>{secure ? '👁️‍🗨️' : '🙈'}</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#00796B" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleRegister} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Créer un compte</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setAccountType(null)} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Retour au choix</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#004D40',
  },
  accountTypeContainer: {
    alignItems: 'center',
  },
  accountTypeButton: {
    backgroundColor: '#00796B',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 220,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#004D40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  enterpriseButton: {
    backgroundColor: '#004D40',
  },
  accountTypeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00796B',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#004D40',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  toggle: {
    fontSize: 22,
  },
  backButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#00796B',
    fontWeight: '600',
    fontSize: 16,
  },
});