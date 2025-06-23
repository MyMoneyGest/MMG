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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

type RegisterScreenProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenProp>();
  const [accountType, setAccountType] = useState<'personal' | 'enterprise' | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  const [enterpriseSiret, setEnterpriseSiret] = useState('');

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
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
      Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (accountType === 'personal') {
      if (!name.trim()) {
        Alert.alert('Erreur', 'Le nom complet est requis.');
        return;
      }
    } else if (accountType === 'enterprise') {
      if (!enterpriseName.trim()) {
        Alert.alert('Erreur', "Le nom de l'entreprise est requis.");
        return;
      }
      if (!enterpriseSiret.trim()) {
        Alert.alert('Erreur', 'Le numéro SIRET est requis.');
        return;
      }
    } else {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de compte.');
      return;
    }

    setLoading(true);

    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (accountType === 'personal') {
        await updateProfile(user, { displayName: name });
      } else if (accountType === 'enterprise') {
        await updateProfile(user, { displayName: enterpriseName });
      }

      const userData = {
        uid: user.uid,

        email,
        createdAt: new Date(),
        accountType,
        ...(accountType === 'personal'
          ? { name }
          : { enterpriseName, enterpriseSiret }),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#00bcd4', '#00838f']}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {!accountType ? (
            <>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>Choisissez le type de compte</Text>
             <View style={styles.accountTypeContainer}>
                <TouchableOpacity
                  style={[styles.accountTypeButton, styles.personalBtn]}
                  onPress={() => setAccountType('personal')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.accountTypeText}>Compte Personnel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountTypeButton, styles.enterpriseBtn]}
                  onPress={() => setAccountType('enterprise')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.accountTypeText}>Compte Entreprise</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {accountType === 'personal' ? 'Compte Personnel' : 'Compte Entreprise'}
              </Text>

              {accountType === 'personal' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  placeholderTextColor="#d0f0e8"
                  value={name}
                  onChangeText={setName}
                />
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom de l'entreprise"
                    placeholderTextColor="#d0f0e8"
                    value={enterpriseName}
                    onChangeText={setEnterpriseName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Numéro SIRET"
                    placeholderTextColor="#d0f0e8"
                    value={enterpriseSiret}
                    onChangeText={setEnterpriseSiret}
                    keyboardType="number-pad"
                  />
                </>
              )}

            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor="#d0f0e8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Wrapper pour mot de passe + œil */}
            <View style={{ width: '100%', position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#d0f0e8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
              />
              <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeToggle}>
                <Text style={{ color: '#b2dfdb', fontSize: 18 }}>
                  {secure ? '👁️‍🗨️' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Même chose pour confirmation du mot de passe */}
            <View style={{ width: '100%', position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#d0f0e8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secure}
              />
              <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeToggle}>
                <Text style={{ color: '#b2dfdb', fontSize: 18 }}>
                  {secure ? '👁️‍🗨️' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>

              {loading ? (
                <ActivityIndicator size="large" color="#e0f2f1" style={{ marginTop: 20 }} />
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRegister}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#00796B', '#004D40']}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Créer un compte</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setAccountType(null)}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Retour au choix</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 20,
    color: '#e0f2f1',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  accountTypeContainer: {
    flexDirection: 'column', // passe en colonne
    alignItems: 'center', // centre horizontalement les boutons
    gap: 12, // espace entre les boutons (fonctionne sur React Native 0.71+)
  },
  accountTypeButton: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  personalBtn: {
    backgroundColor: '#00796B',
  },
  enterpriseBtn: {
    backgroundColor: '#004D40',
  },
  accountTypeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#e0f2f1',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  eyeToggle: {
    position: 'absolute',
    right: 20,
    top: 18, // ajuste selon la hauteur de ton input
    zIndex: 10,
  },

  button: {
    marginTop: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#00796B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',

  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    marginTop: 28,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#b2dfdb',
    fontWeight: '600',
    fontSize: 16,
  },
});