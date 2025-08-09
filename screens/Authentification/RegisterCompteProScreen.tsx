// EntrepriseRegisterScreen.tsx
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
import PhoneInput from '../../constants/PhoneInput';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
  setDoc,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

type RegisterScreenProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const EntrepriseRegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenProp>();

  // Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const next = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  // Company fields
  const [entrepriseName, setEntrepriseName] = useState('');
  const [rccm, setRccm] = useState('');
  const [nif, setNif] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [sector, setSector] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(''); // attendu sans indicatif par PhoneInput -> on ajoutera +241

  // Manager fields
  const [managerName, setManagerName] = useState('');
  const [managerRole, setManagerRole] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UX
  const [securePwd, setSecurePwd] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNews, setAcceptNews] = useState(false);
  const [loading, setLoading] = useState(false);

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Derived
  const phoneE164 = useMemo(() => (phone ? `+241${phone.replace(/[^0-9]/g, '')}` : ''), [phone]);
  const validateEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
  const pwdStrength = (pwd: string) =>
    (pwd.length >= 6 ? 1 : 0) +
    (/[A-Z]/.test(pwd) ? 1 : 0) +
    (/[a-z]/.test(pwd) ? 1 : 0) +
    (/[0-9]/.test(pwd) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pwd) ? 1 : 0);

  const resetErrors = () => setErrors({});

  // ===== Firestore helpers (inchangés dans l’esprit, adaptés au wizard) =====
  const createEntrepriseUser = async (user: any, entrepriseData: any, managerData: any) => {
    const userDocData = {
      uid: user.uid,
      type: 'entreprise',
      entrepriseId: user.uid,
      createdAt: serverTimestamp(),
      entreprise: entrepriseData,
      dirigeant: managerData,
    };
    await setDoc(doc(db, 'users', user.uid), userDocData);
    await setDoc(doc(db, 'entreprises', user.uid), {
      ...entrepriseData,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });
    await setDoc(doc(db, 'entreprises', user.uid, 'managers', user.uid), {
      ...managerData,
      createdAt: serverTimestamp(),
      uid: user.uid,
    });
  };

  const updateBalanceAndAddTransaction = async (
    phoneNumber: string,
    amount: number,
    transactionDetails: any
  ) => {
    const balanceRef = doc(db, 'airtelBalance', phoneNumber);
    const balanceSnap = await getDoc(balanceRef);
    const currentBalance = balanceSnap.exists() ? balanceSnap.data().balance : 0;

    if (balanceSnap.exists()) {
      await updateDoc(balanceRef, {
        balance: currentBalance + amount,
        lastUpdated: serverTimestamp(),
      });
    } else {
      await setDoc(balanceRef, {
        balance: amount,
        lastUpdated: serverTimestamp(),
      });
    }

    const transactionsRef = collection(db, 'transactions', phoneNumber, 'history');
    await addDoc(transactionsRef, {
      ...transactionDetails,
      amount,
      createdAt: serverTimestamp(),
      phoneNumber,
    });
  };

  // ===== Validation par étape =====
  const validateStep = (s: 1 | 2 | 3) => {
    const e: { [key: string]: string } = {};
    if (s === 1) {
      if (!entrepriseName) e.entrepriseName = 'Champ requis.';
      if (!rccm) e.rccm = 'Champ requis.';
      else if (!/^\d{14,}$/.test(rccm)) e.rccm = 'Doit contenir au moins 14 chiffres.';
      if (!nif) e.nif = 'Champ requis.';
      if (!legalForm) e.legalForm = 'Champ requis.';
      if (!sector) e.sector = 'Champ requis.';
      if (!address) e.address = 'Champ requis.';
      if (!phone) e.phone = 'Champ requis.';
    }
    if (s === 2) {
      if (!managerName) e.managerName = 'Champ requis.';
      if (!managerRole) e.managerRole = 'Champ requis.';
      if (!managerEmail) e.managerEmail = 'Champ requis.';
      else if (!validateEmail(managerEmail)) e.managerEmail = 'Email invalide.';
      if (!password) e.password = 'Champ requis.';
      else if (password.length < 6) e.password = 'Minimum 6 caractères.';
      if (!confirmPassword) e.confirmPassword = 'Champ requis.';
      else if (password !== confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas.';
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

  // ===== Submit =====
  const handleRegister = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, managerEmail, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: managerName });

      const entrepriseData = {
        nom: entrepriseName,
        rccm,
        nif,
        formeJuridique: legalForm,
        secteur: sector,
        adresse: address,
        telephone: phoneE164, // +241
      };

      const managerData = {
        nom: managerName,
        fonction: managerRole,
        email: managerEmail,
        telephone: phoneE164,
        newsletter: acceptNews,
      };

      await createEntrepriseUser(user, entrepriseData, managerData);
      await updateBalanceAndAddTransaction(phone, 0, {
        reference: 'inscription',
        type: 'initial',
        sender: '',
        receiver: phone,
        status: 'success',
      });

      navigation.replace('GestionEntrepriseScreen');
    } catch (error: any) {
      console.warn('Erreur Firebase:', error.code);
      const map: { [k: string]: string } = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/invalid-email': 'Adresse email invalide.',
        'auth/weak-password': 'Mot de passe trop faible.',
      };
      setErrors({ general: map[error?.code] || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  // ===== UI =====
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
          <Text style={styles.subtitle}>Inscription Entreprise</Text>
          <View style={styles.steps}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.stepBar, i <= step && styles.stepBarActive]} />
            ))}
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Header ligne (retour + titre) */}
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={step === 1 ? () => navigation.goBack() : prev} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#0B1024" />
            </TouchableOpacity>
            <Text style={styles.cardTitle}>
              {step === 1 ? 'Informations entreprise' : step === 2 ? 'Dirigeant & sécurité' : 'Finalisation'}
            </Text>
          </View>

          {/* Icon + sous-titre */}
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
            <View style={styles.stepIcon}>
              <Icon name={step === 1 ? 'briefcase-outline' : step === 2 ? 'account-lock-outline' : 'check'} size={24} color="#fff" />
            </View>
            <Text style={styles.sectionTitle}>
              {step === 1 ? 'Informations entreprise' : step === 2 ? 'Dirigeant & sécurité' : 'Finalisation'}
            </Text>
            <Text style={styles.sectionSub}>Étape {step}/3</Text>
          </View>

          {/* ===== Étape 1 : Entreprise ===== */}
          {step === 1 && (
            <View>
              <Text style={styles.label}>Raison sociale</Text>
              <TextInput
                style={[styles.input, errors.entrepriseName && styles.inputError]}
                placeholder="Nom de l'entreprise"
                placeholderTextColor="#9aa0a6"
                value={entrepriseName}
                onChangeText={setEntrepriseName}
              />
              {!!errors.entrepriseName && <Text style={styles.err}>{errors.entrepriseName}</Text>}

              <Text style={styles.label}>Numéro RCCM</Text>
              <TextInput
                style={[styles.input, errors.rccm && styles.inputError]}
                placeholder="14 chiffres minimum"
                placeholderTextColor="#9aa0a6"
                keyboardType="number-pad"
                value={rccm}
                onChangeText={(t) => setRccm(t.replace(/[^0-9]/g, ''))}
              />
              {!!errors.rccm && <Text style={styles.err}>{errors.rccm}</Text>}

              <Text style={styles.label}>Numéro NIF</Text>
              <TextInput
                style={[styles.input, errors.nif && styles.inputError]}
                placeholder="NIF"
                placeholderTextColor="#9aa0a6"
                value={nif}
                onChangeText={setNif}
              />
              {!!errors.nif && <Text style={styles.err}>{errors.nif}</Text>}

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.label}>Forme juridique</Text>
                  <TextInput
                    style={[styles.input, errors.legalForm && styles.inputError]}
                    placeholder="Ex : SARL, SA..."
                    placeholderTextColor="#9aa0a6"
                    value={legalForm}
                    onChangeText={setLegalForm}
                  />
                  {!!errors.legalForm && <Text style={styles.err}>{errors.legalForm}</Text>}
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.label}>Secteur d'activité</Text>
                  <TextInput
                    style={[styles.input, errors.sector && styles.inputError]}
                    placeholder="Ex : Commerce, Services..."
                    placeholderTextColor="#9aa0a6"
                    value={sector}
                    onChangeText={setSector}
                  />
                  {!!errors.sector && <Text style={styles.err}>{errors.sector}</Text>}
                </View>
              </View>

              <Text style={styles.label}>Adresse du siège</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="Adresse complète"
                placeholderTextColor="#9aa0a6"
                value={address}
                onChangeText={setAddress}
              />
              {!!errors.address && <Text style={styles.err}>{errors.address}</Text>}

              <Text style={styles.label}>Téléphone de l'entreprise</Text>
              <PhoneInput value={phone} onChangeText={setPhone} error={errors.phone} />
              <Text style={styles.hint}>Le numéro sera lié au compte mobile money entreprise</Text>

              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={handleNext}>
                <Text style={styles.primaryTxt}>Continuer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== Étape 2 : Dirigeant & sécurité ===== */}
          {step === 2 && (
            <View>
              <Text style={styles.label}>Nom et prénom (dirigeant)</Text>
              <TextInput
                style={[styles.input, errors.managerName && styles.inputError]}
                placeholder="Nom et prénom"
                placeholderTextColor="#9aa0a6"
                value={managerName}
                onChangeText={setManagerName}
              />
              {!!errors.managerName && <Text style={styles.err}>{errors.managerName}</Text>}

              <Text style={styles.label}>Fonction</Text>
              <TextInput
                style={[styles.input, errors.managerRole && styles.inputError]}
                placeholder="Ex : Gérant, Directeur..."
                placeholderTextColor="#9aa0a6"
                value={managerRole}
                onChangeText={setManagerRole}
              />
              {!!errors.managerRole && <Text style={styles.err}>{errors.managerRole}</Text>}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.managerEmail && styles.inputError]}
                placeholder="email@entreprise.com"
                placeholderTextColor="#9aa0a6"
                keyboardType="email-address"
                autoCapitalize="none"
                value={managerEmail}
                onChangeText={setManagerEmail}
              />
              {!!errors.managerEmail && <Text style={styles.err}>{errors.managerEmail}</Text>}

              <Text style={styles.label}>Mot de passe</Text>
              <View style={[styles.passwordWrap, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor="#9aa0a6"
                  secureTextEntry={securePwd}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setSecurePwd((v) => !v)}>
                  <Icon name={securePwd ? 'eye-outline' : 'eye-off-outline'} size={22} color="#0B1024" />
                </TouchableOpacity>
              </View>
              {!!errors.password && <Text style={styles.err}>{errors.password}</Text>}

              {!!password && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <View key={lvl} style={[styles.strengthBar, pwdStrength(password) >= lvl && styles.strengthOn]} />
                  ))}
                  <Text style={styles.strengthLabel}>
                    {pwdStrength(password) <= 1 ? 'Faible' :
                     pwdStrength(password) === 2 ? 'Moyen' :
                     pwdStrength(password) === 3 ? 'Bon' : 'Très bon'}
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={[styles.passwordWrap, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Répétez votre mot de passe"
                  placeholderTextColor="#9aa0a6"
                  secureTextEntry={secureConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setSecureConfirm((v) => !v)}>
                  <Icon name={secureConfirm ? 'eye-outline' : 'eye-off-outline'} size={22} color="#0B1024" />
                </TouchableOpacity>
              </View>
              {!!errors.confirmPassword && <Text style={styles.err}>{errors.confirmPassword}</Text>}

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

          {/* ===== Étape 3 : Finalisation ===== */}
          {step === 3 && (
            <View>
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Entreprise :</Text> {entrepriseName}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>RCCM :</Text> {rccm}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>NIF :</Text> {nif}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Forme :</Text> {legalForm}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Secteur :</Text> {sector}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Téléphone :</Text> +241 {phone}</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Dirigeant :</Text> {managerName} ({managerRole})</Text>
                <Text style={styles.summaryText}><Text style={styles.bold}>Email :</Text> {managerEmail}</Text>
              </View>

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
                <Text style={styles.checkText}>Je souhaite recevoir les actualités et offres (optionnel)</Text>
              </TouchableOpacity>

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
                    <Text style={styles.primaryTxt}>Créer le compte</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EntrepriseRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,       // espaces haut/bas pour nav/footer/clavier
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
    marginBottom: 10,
  },
  inputError: { borderColor: '#D32F2F' },
  err: { color: '#D32F2F', fontSize: 13, marginTop: 6, marginLeft: 2, fontWeight: '500' },

  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },

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

  // Aides / force mot de passe
  hint: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  strengthBar: { width: 20, height: 4, borderRadius: 4, backgroundColor: '#E5E7EB', marginRight: 4 },
  strengthOn: { backgroundColor: '#10B981' },
  strengthLabel: { marginLeft: 8, fontSize: 12, color: '#374151', fontWeight: '600' },
});