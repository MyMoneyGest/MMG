import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // erreurs
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validateEmail = (email: string) => {
    const commonDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
      'icloud.com', 'protonmail.com',
    ];
    const genericTLD = /\.(com|fr|org|net|ga|io)$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) return false;
    const domain = email.split('@')[1].toLowerCase();
    return commonDomains.includes(domain) || genericTLD.test(domain);
  };

  const resetErrors = () => {
    setNameError('');
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setGeneralError('');
  };

  const handleRegister = async () => {
    resetErrors();

    let hasError = false;

    if (!name) {
      setNameError('Le nom est requis.');
      hasError = true;
    }

    if (!phone) {
      setPhoneError('Le numéro de téléphone est requis.');
      hasError = true;
    }

    if (!email) {
      setEmailError("L'adresse email est requise.");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Format d'email invalide.");
      hasError = true;
    }

    if (!password) {
      setPasswordError('Le mot de passe est requis.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Minimum 6 caractères.');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmError('Veuillez confirmer votre mot de passe.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmError('Les mots de passe ne correspondent pas.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      const formattedPhone = '+241' + phone.replace(/^0/, '');

      const userData = {
        uid: user.uid,
        email,
        type: 'personal',
        createdAt: new Date(),
        name,
        phone: formattedPhone, // ✅ idem ici
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      await setDoc(doc(db, 'phoneDirectory', user.uid), {
        uid: user.uid,
        phone: formattedPhone, // ✅ avec indicatif +241
        email,
        name,
        createdAt: new Date(),
      });
      
      

      navigation.navigate('Login');
    } catch (error: any) {
      console.warn('Erreur Firebase Register:', error.code);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setEmailError('Cet email est déjà utilisé.');
          break;
        case 'auth/invalid-email':
          setEmailError("L'adresse email est invalide.");
          break;
        case 'auth/weak-password':
          setPasswordError('Mot de passe trop faible (minimum 6 caractères).');
          break;
        default:
          setGeneralError('Une erreur est survenue. Veuillez réessayer.');
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
            >
              <Text style={styles.accountTypeText}>Compte Personnel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accountTypeButton, styles.entrepriseButton]}
              onPress={() => navigation.navigate('RegisterCompteProScreen')}
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
            placeholderTextColor="#666"   // ajouté
            value={name}
            onChangeText={setName}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <View style={styles.phoneContainer}>
  <Text style={styles.prefix}>+241</Text>
  <TextInput
  style={styles.phoneInput}
  placeholder="ex: 060000000"
  placeholderTextColor="#666"   // ajouté
  keyboardType="phone-pad"
  value={phone}
  onChangeText={(text) => {
    const cleaned = text.replace(/[^\d]/g, '');
    setPhone(cleaned);
  }}
  maxLength={9}
/>
</View>
{phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry={secure} />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <TextInput style={styles.input} placeholder="Confirmer mot de passe" placeholderTextColor="#666" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={secure} />
          {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

          <TouchableOpacity onPress={() => setSecure(!secure)} style={{ alignSelf: 'flex-end', marginBottom: 15 }}>
            <Text style={styles.toggle}>{secure ? '👁️‍🗨️' : '🙈'}</Text>
          </TouchableOpacity>

          {generalError ? <Text style={styles.errorText}>{generalError}</Text> : null}

          {loading ? (
            <ActivityIndicator size="large" color="#00796B" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Créer un compte</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setAccountType(null)} style={styles.backButton}>
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
    errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 8,
    marginLeft: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 16,
  },
    phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  prefix: {
    fontSize: 16,
    color: '#00796B',
    fontWeight: '600',
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: '#333',
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
  entrepriseButton: {
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