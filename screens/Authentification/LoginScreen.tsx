import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../services/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const E164 = /^\+[1-9]\d{1,14}$/;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenProp>();

  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [phoneRaw, setPhoneRaw] = useState(''); // sans préfixe
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const phone = useMemo(() => {
    // adapte ici : +241 (Gabon) par défaut
    const digits = phoneRaw.replace(/\D/g, '');
    return digits ? `+241 ${digits.replace(/(\d{2})(?=\d)/g, '$1 ')}`.trim() : '+241 ';
  }, [phoneRaw]);

  const phoneE164 = useMemo(() => {
    const digits = phoneRaw.replace(/\D/g, '');
    return digits ? `+241${digits}` : '';
  }, [phoneRaw]);

  const validateEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

  const resetErrors = () => {
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setGeneralError('');
  };

  const handleLogin = async () => {
    resetErrors();

    // Validation basique selon méthode
    if (loginMethod === 'email') {
      if (!email) setEmailError("L'adresse email est requise.");
      if (!password) setPasswordError('Le mot de passe est requis.');
      if (!email || !password) return;

      if (!validateEmail(email)) {
        setEmailError("Format d'email invalide.");
        return;
      }
    } else {
      if (!phoneRaw) setPhoneError('Le numéro de téléphone est requis.');
      if (!password) setPasswordError('Le mot de passe est requis.');
      if (!phoneRaw || !password) return;

      if (!E164.test(phoneE164)) {
        setPhoneError('Numéro invalide. Utilisez le format international.');
        return;
      }
      // ⚠️ Si tu utilises un login par téléphone/OTP,
      // redirige ici vers ton écran OTP plutôt que signInWithEmailAndPassword
      // navigation.navigate('PhoneOtpScreen', { phone: phoneE164 });
      // return;
    }

    setLoading(true);
    try {
      // —— Auth email (par défaut). Pour téléphone, branche ton flux OTP comme indiqué ci‑dessus.
      const emailToUse = loginMethod === 'email' ? email : `${phoneE164}@mmg.local`; 
      // ↑ Option temporaire: si tu as mappé des comptes "téléphone→email alias".
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (userData?.entreprise) {
        navigation.replace('GestionEntrepriseScreen');
      } else {
        navigation.replace('HomeScreen');
      }
    } catch (error: any) {
      console.warn('Erreur Firebase:', error.code);
      switch (error.code) {
        case 'auth/invalid-email':
          loginMethod === 'email' ? setEmailError("L'adresse email est invalide.") : setGeneralError("Identifiant invalide.");
          break;
        case 'auth/user-not-found':
          loginMethod === 'email' ? setEmailError("Aucun compte n'est associé à cette adresse.") : setPhoneError("Aucun compte associé à ce numéro.");
          break;
        case 'auth/wrong-password':
          setPasswordError('Mot de passe incorrect.');
          break;
        case 'auth/invalid-credential':
          setGeneralError('Identifiants incorrects.');
          break;
        case 'auth/too-many-requests':
          setGeneralError('Trop de tentatives. Réessayez plus tard.');
          break;
        default:
          setGeneralError('Une erreur est survenue. Code : ' + error.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Si tu veux gérer reset par téléphone, crée un écran dédié
    if (loginMethod === 'email') {
      if (!email) {
        setEmailError("Veuillez entrer votre adresse email.");
        return;
      }
     // navigation.navigate('ForgotPasswordScreen', { email });
    } else {
     // navigation.navigate('ForgotPasswordScreen'); // adapter pour téléphone si besoin
    }
  };

  const handleBiometric = async () => {
    // Stub: à brancher avec expo-local-authentication
    // const ok = await LocalAuthentication.authenticateAsync({ promptMessage: 'Connexion biométrique' });
    // if (ok.success) { ... }
    setGeneralError('Biométrie à activer (voir expo-local-authentication).');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 40,     // espace haut
          paddingBottom: 40, }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={styles.logoWrap}>
              <Icon name="cellphone" size={28} color="#fff" />
            </View>
            <Text style={styles.appName}>MyMoneyGest</Text>
            <Text style={styles.subtitle}>Gérez vos comptes en toute sécurité</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>

            {/* Toggle Phone / Email */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setLoginMethod('phone')}
                style={[styles.toggleBtn, loginMethod === 'phone' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleTxt, loginMethod === 'phone' && styles.toggleTxtActive]}>Téléphone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLoginMethod('email')}
                style={[styles.toggleBtn, loginMethod === 'email' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleTxt, loginMethod === 'email' && styles.toggleTxtActive]}>Email</Text>
              </TouchableOpacity>
            </View>

            {/* Identifier */}
            {loginMethod === 'phone' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro de téléphone</Text>
                <TextInput
                  style={[styles.input, phoneError && styles.inputError]}
                  placeholder="+241 XX XX XX XX"
                  placeholderTextColor="#9aa0a6"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => setPhoneRaw(t.replace(/[^0-9]/g, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="telephoneNumber"
                />
                {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse email</Text>
                <TextInput
                  style={[styles.input, emailError && styles.inputError]}
                  placeholder="ex: utilisateur@email.com"
                  placeholderTextColor="#9aa0a6"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>
            )}

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.passwordContainer, passwordError && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Votre mot de passe"
                  placeholderTextColor="#9aa0a6"
                  secureTextEntry={secure}
                  value={password}
                  onChangeText={setPassword}
                  textContentType="password"
                />
                <TouchableOpacity
                  accessibilityLabel={secure ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
                  onPress={() => setSecure((s) => !s)}
                >
                  <Icon name={secure ? 'eye-outline' : 'eye-off-outline'} size={22} color="#0B1024" />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            </View>

            {/* Submit */}
            {generalError ? <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 8 }]}>{generalError}</Text> : null}
            {loading ? (
              <ActivityIndicator size="large" color="#0B1024" style={{ marginVertical: 14 }} />
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                <Text style={styles.primaryTxt}>Se connecter</Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Biometric */}
            <TouchableOpacity style={styles.outlineBtn} onPress={handleBiometric} disabled={loading}>
              <Icon name="fingerprint" size={18} color="#0B1024" style={{ marginRight: 8 }} />
              <Text style={styles.outlineTxt}>Connexion biométrique</Text>
            </TouchableOpacity>

            {/* Forgot */}
            <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={styles.link}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* Create account */}
          <View style={styles.cardMuted}>
            <Text style={styles.muted}>Vous n'avez pas encore de compte ?</Text>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.ghostTxt}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Footer links */}
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.footer}>En vous connectant, vous acceptez nos</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              <TouchableOpacity onPress={() => navigation.navigate('MentionsLegales')}>
                <Text style={styles.linkXs}>Conditions d'utilisation</Text>
              </TouchableOpacity>
              <Text style={styles.footer}>et</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MentionsLegales')}>
                <Text style={styles.linkXs}>Politique de confidentialité</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F7', // fond clair comme Figma
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0B1024', // primary sombre
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: { fontSize: 22, fontWeight: '700', color: '#0B1024' },
  subtitle: { color: '#6b7280', marginTop: 2 },

  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0B1024' },

  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleBtnActive: {
    backgroundColor: '#0B1024',
    borderColor: '#0B1024',
  },
  toggleTxt: { color: '#0B1024', fontWeight: '600' },
  toggleTxtActive: { color: '#fff', fontWeight: '700' },

  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#0B1024', marginBottom: 6 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0B1024',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#D32F2F' },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0B1024' },

  primaryBtn: {
    backgroundColor: '#0B1024',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  outlineTxt: { color: '#0B1024', fontWeight: '600' },

  link: { color: '#0B1024', fontWeight: '700', textDecorationLine: 'underline' },

  cardMuted: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F2F4',
  },
  muted: { color: '#6b7280', marginBottom: 10 },

  ghostBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ghostTxt: { color: '#0B1024', fontWeight: '700' },

  footer: { color: '#6b7280', fontSize: 12 },
  linkXs: { color: '#0B1024', fontSize: 12, textDecorationLine: 'underline', fontWeight: '700' },

  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 2,
    fontWeight: '500',
  },
});