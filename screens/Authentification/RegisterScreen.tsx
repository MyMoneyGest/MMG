import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

type RegisterScreenProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenProp>();

  // Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const next = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  // Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phoneRaw, setPhoneRaw]   = useState(''); // chiffres sans indicatif
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');

  // UX
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNews, setAcceptNews]   = useState(false);
  const [loading, setLoading]         = useState(false);

  // Errors
  const [errors, setErrors] = useState<{[k:string]: string}>({});

  // Derived phone formats (+241 par défaut)
  const phonePretty = useMemo(() => {
    const d = phoneRaw.replace(/\D/g, '');
    return d ? `+241 ${d.replace(/(\d{2})(?=\d)/g, '$1 ')}`.trim() : '+241 ';
  }, [phoneRaw]);

  const phoneE164 = useMemo(() => {
    const d = phoneRaw.replace(/\D/g, '');
    return d ? `+241${d}` : '';
  }, [phoneRaw]);

  // Validators
  const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
  const pwdStrength = (pwd: string) =>
    (pwd.length >= 6 ? 1 : 0) +
    (/[A-Z]/.test(pwd) ? 1 : 0) +
    (/[a-z]/.test(pwd) ? 1 : 0) +
    (/[0-9]/.test(pwd) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pwd) ? 1 : 0);

  const validateStep = (s: 1 | 2 | 3) => {
    const e: {[k:string]: string} = {};
    if (s === 1) {
      if (!firstName) e.firstName = 'Prénom requis.';
      if (!lastName)  e.lastName  = 'Nom requis.';
      if (!phoneRaw)  e.phone     = 'Numéro requis.';
      if (phoneE164 && !/^\+[1-9]\d{6,14}$/.test(phoneE164)) e.phone = 'Numéro invalide (format international).';
    }
    if (s === 2) {
      if (!email) e.email = 'Email requis.';
      else if (!isEmail(email)) e.email = "Format d'email invalide.";
      if (!password) e.password = 'Mot de passe requis.';
      else if (password.length < 6) e.password = 'Minimum 6 caractères.';
      if (!confirm) e.confirm = 'Confirmation requise.';
      else if (password !== confirm) e.confirm = 'Les mots de passe ne correspondent pas.';
    }
    if (s === 3) {
      if (!acceptTerms) e.terms = 'Vous devez accepter les conditions.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) next();
  };

  const handleRegister = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: `${firstName.trim()} ${lastName.trim()}` });

      const userDoc = {
        uid: cred.user.uid,
        type: 'personal',
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phoneE164,
        newsletter: acceptNews,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), userDoc);
      await setDoc(doc(db, 'phoneDirectory', cred.user.uid), {
        uid: cred.user.uid,
        phone: phoneE164,
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        createdAt: new Date(),
      });

      navigation.navigate('Login');
    } catch (err: any) {
      const map: {[k: string]: string} = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/invalid-email': "Adresse email invalide.",
        'auth/weak-password': 'Mot de passe trop faible.',
      };
      setErrors({ general: map[err?.code] || 'Une erreur est survenue. Réessayez.' });
    } finally {
      setLoading(false);
    }
  };

  // ————— UI —————
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={styles.logoWrap}>
            <Icon name="cellphone" size={28} color="#fff" />
          </View>
          <Text style={styles.appName}>MyMoneyGest</Text>
          <Text style={styles.subtitle}>Créez votre compte</Text>

          {/* Steps progress */}
          <View style={styles.steps}>
            {[1,2,3].map((i) => (
              <View key={i} style={[styles.stepBar, i <= step ? styles.stepBarActive : null]} />
            ))}
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Header row (Back + Title) */}
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={step === 1 ? () => navigation.goBack() : prev} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#0B1024" />
            </TouchableOpacity>
            <Text style={styles.cardTitle}>
              {step === 1 ? 'Informations personnelles' : step === 2 ? 'Sécurité du compte' : 'Finalisation'}
            </Text>
          </View>

          {/* Icon + Step title */}
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
            <View style={styles.stepIcon}>
              <Icon
                name={step === 1 ? 'account-outline' : step === 2 ? 'lock-outline' : 'check'}
                size={24}
                color="#fff"
              />
            </View>
            <Text style={styles.sectionTitle}>
              {step === 1 ? 'Informations personnelles' : step === 2 ? 'Sécurité du compte' : 'Finalisation'}
            </Text>
            <Text style={styles.sectionSub}>Étape {step}/3</Text>
          </View>

          {/* Step 1 */}
          {step === 1 && (
            <View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    placeholder="Votre prénom"
                    placeholderTextColor="#9aa0a6"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  {!!errors.firstName && <Text style={styles.err}>{errors.firstName}</Text>}
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    placeholder="Votre nom"
                    placeholderTextColor="#9aa0a6"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                  {!!errors.lastName && <Text style={styles.err}>{errors.lastName}</Text>}
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Numéro de téléphone</Text>
                <View style={[styles.phoneWrap, errors.phone && styles.inputError]}>
                  <Text style={styles.prefix}>+241</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="XX XX XX XX"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="phone-pad"
                    value={phoneRaw}
                    onChangeText={(t) => setPhoneRaw(t.replace(/[^0-9]/g, ''))}
                    maxLength={9}
                  />
                </View>
                {!!errors.phone && <Text style={styles.err}>{errors.phone}</Text>}
                <Text style={styles.hint}>Ce numéro sera utilisé pour vos comptes mobile money</Text>
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={handleNext}>
                <Text style={styles.primaryTxt}>Continuer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <View>
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Adresse email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="votre@email.com"
                  placeholderTextColor="#9aa0a6"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                {!!errors.email && <Text style={styles.err}>{errors.email}</Text>}
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={[styles.passwordWrap, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Au moins 6 caractères"
                    placeholderTextColor="#9aa0a6"
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPwd((x) => !x)}>
                    <Icon name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color="#0B1024" />
                  </TouchableOpacity>
                </View>
                {!!errors.password && <Text style={styles.err}>{errors.password}</Text>}

                {!!password && (
                  <View style={styles.strengthRow}>
                    {[1,2,3,4,5].map((lvl) => (
                      <View key={lvl} style={[styles.strengthBar, pwdStrength(password) >= lvl && styles.strengthOn]} />
                    ))}
                    <Text style={styles.strengthLabel}>
                      {pwdStrength(password) <= 1 ? 'Faible' :
                       pwdStrength(password) === 2 ? 'Moyen' :
                       pwdStrength(password) === 3 ? 'Bon'   : 'Très bon'}
                    </Text>
                  </View>
                )}
              </View>

              <View>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={[styles.passwordWrap, errors.confirm && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Répétez votre mot de passe"
                    placeholderTextColor="#9aa0a6"
                    secureTextEntry={!showConfirm}
                    value={confirm}
                    onChangeText={setConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm((x) => !x)}>
                    <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#0B1024" />
                  </TouchableOpacity>
                </View>
                {!!errors.confirm && <Text style={styles.err}>{errors.confirm}</Text>}
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={[styles.outlineBtn, { flex: 1, marginRight: 6 }]} onPress={prev}>
                  <Text style={styles.outlineTxt}>Retour</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginLeft: 6 }]} onPress={handleNext}>
                  <Text style={styles.primaryTxt}>Continuer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <View>
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Récapitulatif de votre compte</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Nom : </Text>{firstName} {lastName}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Téléphone : </Text>{phonePretty}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Email : </Text>{email}</Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <TouchableOpacity onPress={() => setAcceptTerms((v) => !v)} style={styles.checkRow}>
                  <Icon name={acceptTerms ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color="#0B1024" />
                  <Text style={styles.checkText}>
                    J'accepte les{' '}
                    <Text style={styles.link} onPress={() => navigation.navigate('MentionsLegales')}>conditions d'utilisation</Text>
                    {' '}et la{' '}
                    <Text style={styles.link} onPress={() => navigation.navigate('MentionsLegales')}>politique de confidentialité</Text>
                  </Text>
                </TouchableOpacity>
                {!!errors.terms && <Text style={styles.err}>{errors.terms}</Text>}

                <TouchableOpacity onPress={() => setAcceptNews((v) => !v)} style={styles.checkRow}>
                  <Icon name={acceptNews ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color="#0B1024" />
                  <Text style={styles.checkText}>Je souhaite recevoir les actualités et offres promotionnelles (optionnel)</Text>
                </TouchableOpacity>
              </View>

              {!!errors.general && <Text style={[styles.err, { textAlign: 'center' }]}>{errors.general}</Text>}

              {loading ? (
                <ActivityIndicator size="large" color="#0B1024" style={{ marginTop: 14 }} />
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.outlineBtn, { flex: 1, marginRight: 6 }]} onPress={prev}>
                    <Text style={styles.outlineTxt}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 6, opacity: acceptTerms ? 1 : 0.7 }]}
                    onPress={handleRegister}
                    disabled={!acceptTerms}
                  >
                    <Text style={styles.primaryTxt}>Créer mon compte</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Back to login (comme Figma, en bas) */}
        {step === 1 && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={[styles.link, { fontWeight: '700' }]}>Se connecter</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,     // espaces haut/bas pour ne pas coller le header/footer
    paddingBottom: 40,
    backgroundColor: '#F4F5F7',
  },

  // Header
  logoWrap: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#0B1024',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  appName: { fontSize: 22, fontWeight: '700', color: '#0B1024' },
  subtitle: { color: '#6b7280', marginTop: 2 },

  steps: { flexDirection: 'row', gap: 6, marginTop: 10 },
  stepBar: { width: 28, height: 4, borderRadius: 4, backgroundColor: '#E5E7EB' },
  stepBarActive: { backgroundColor: '#0B1024' },

  // Card
  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { padding: 4, marginRight: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0B1024' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0B1024', marginTop: 6 },
  sectionSub: { color: '#6b7280' },
  stepIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#0B1024', alignItems: 'center', justifyContent: 'center',
  },

  // Inputs
  label: { fontSize: 14, fontWeight: '600', color: '#0B1024', marginBottom: 6 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    fontSize: 16, color: '#0B1024',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#D32F2F' },
  err: { color: '#D32F2F', fontSize: 13, marginTop: 6, marginLeft: 2, fontWeight: '500' },

  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },

  phoneWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  prefix: { color: '#0B1024', fontWeight: '700', marginRight: 8 },
  phoneInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0B1024' },

  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#0B1024' },

  primaryBtn: {
    backgroundColor: '#0B1024', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },

  outlineBtn: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  outlineTxt: { color: '#0B1024', fontWeight: '700' },

  // Summary
  summary: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#EAECEF',
    padding: 12, marginBottom: 10,
  },
  summaryTitle: { fontWeight: '700', color: '#0B1024', marginBottom: 6 },
  summaryText: { color: '#374151', marginBottom: 2 },
  bold: { fontWeight: '700', color: '#0B1024' },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  checkText: { color: '#0B1024', flex: 1 },
  link: { color: '#0B1024', textDecorationLine: 'underline' },

    hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    width: 20,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#E5E7EB', // barre inactive
    marginRight: 4,
  },
  strengthOn: {
    backgroundColor: '#10B981', // barre active (vert)
  },
  strengthLabel: {
    marginLeft: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
});