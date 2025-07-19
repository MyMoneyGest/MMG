import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../services/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer un email valide.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Récupérer le doc utilisateur dans Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (userData?.entreprise) {
        // Compte entreprise : rediriger vers GestionEntrepriseScreen
        navigation.replace('GestionEntrepriseScreen');
      } else {
        // Compte personnel : rediriger vers HomeScreen
        navigation.replace('HomeScreen');
      }
    } catch (error: any) {
      Alert.alert('Erreur de connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email envoyé', 'Consultez votre boîte mail pour réinitialiser votre mot de passe.');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <LinearGradient colors={['#A7FFEB', '#00BFA5']} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.innerContainer}
        >
          <Image
            source={require('../../assets/logo_mymoneygest.jpg')}
            style={styles.logo}
          />

          <Text style={styles.title}>Bienvenue sur MyMoneyGest</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse email</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: utilisateur@email.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              accessible
              accessibilityLabel="Adresse email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                secureTextEntry={secure}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                accessible
                accessibilityLabel="Mot de passe"
              />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Icon
                  name={secure ? 'eye-outline' : 'eye-off-outline'}
                  size={24}
                  color="#00796B"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleForgotPassword} accessibilityRole="button">
            <Text style={styles.forgot}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#004D40" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} accessibilityRole="button">
              <Text style={styles.buttonText}>Se connecter</Text>
            </TouchableOpacity>
          )}

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} accessibilityRole="button">
              <Text style={styles.signupLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.legalContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('MentionsLegales')} accessibilityRole="link">
              <Text style={styles.legalText}>Mentions légales</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    
    color: '#004D40',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004D40',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F8F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#004D40',
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B2DFDB',
    paddingHorizontal: 18,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#004D40',
  },
  toggle: {
    fontSize: 22,
    color: '#00796B',
    paddingHorizontal: 8,
  },
  forgot: {
    textAlign: 'right',
    color: '#00796B',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 24,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#26A69A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#00796B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: {
    color: '#004D40',
    fontSize: 16,
  },
  signupLink: {
    color: '#00796B',
    fontWeight: '700',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: '500',
  },

  legalContainer: {
  alignItems: 'center',
  marginTop: 24,
  },
  legalText: {
    fontSize: 14,
    color: '#004D40',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});