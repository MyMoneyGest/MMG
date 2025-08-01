// EntrepriseRegisterScreen.tsx
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
import PhoneInput from '../../constants/PhoneInput';

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
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
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  // Champs entreprise
  const [entrepriseName, setEntrepriseName] = useState('');
  const [rccm, setRccm] = useState('');
  const [nif, setNif] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [sector, setSector] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Champs dirigeant
  const [managerName, setManagerName] = useState('');
  const [managerRole, setManagerRole] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // erreurs
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const resetErrors = () => setErrors({});

  const createEntrepriseUser = async (
    user: any,
    entrepriseData: any,
    managerData: any
  ) => {
    const userDoc = {
      uid: user.uid,
      type: 'entreprise',
      entrepriseId: user.uid,
      createdAt: serverTimestamp(),
      entreprise: entrepriseData,
      dirigeant: managerData,
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
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

  const handleRegister = async () => {
    resetErrors();
    const newErrors: { [key: string]: string } = {};

    if (!entrepriseName) newErrors.entrepriseName = 'Champ requis.';
    if (!rccm) newErrors.rccm = 'Champ requis.';
    else if (!/^\d{14,}$/.test(rccm)) newErrors.rccm = 'Doit contenir au moins 14 chiffres.';
    if (!nif) newErrors.nif = 'Champ requis.';
    if (!legalForm) newErrors.legalForm = 'Champ requis.';
    if (!sector) newErrors.sector = 'Champ requis.';
    if (!address) newErrors.address = 'Champ requis.';
    if (!phone) newErrors.phone = 'Champ requis.';

    if (!managerName) newErrors.managerName = 'Champ requis.';
    if (!managerRole) newErrors.managerRole = 'Champ requis.';
    if (!managerEmail) newErrors.managerEmail = 'Champ requis.';
    else if (!validateEmail(managerEmail)) newErrors.managerEmail = 'Email invalide.';
    if (!password) newErrors.password = 'Champ requis.';
    else if (password.length < 6) newErrors.password = 'Minimum 6 caractères.';
    if (!confirmPassword) newErrors.confirmPassword = 'Champ requis.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
        telephone: '+241' + phone,
      };

      const managerData = {
        nom: managerName,
        fonction: managerRole,
        email: managerEmail,
        telephone: '+241' + phone,
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
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ managerEmail: 'Cet email est déjà utilisé.' });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({ managerEmail: 'Adresse email invalide.' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Mot de passe trop faible.' });
      } else {
        setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (val: string) => void,
    errorKey: string,
    props: any = {}
  ) => (
    <>
      <TextInput
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#666" 
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {errors[errorKey] && <Text style={styles.errorText}>{errors[errorKey]}</Text>}
    </>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inscription Entreprise</Text>

      {renderInput('Raison sociale', entrepriseName, setEntrepriseName, 'entrepriseName')}
      {renderInput('Numéro RCCM (14 chiffres min.)', rccm, setRccm, 'rccm', { keyboardType: 'number-pad' })}
      {renderInput('Numéro NIF', nif, setNif, 'nif')}
      {renderInput('Forme juridique', legalForm, setLegalForm, 'legalForm')}
      {renderInput("Secteur d'activité", sector, setSector, 'sector')}
      {renderInput('Adresse du siège', address, setAddress, 'address')}
      <PhoneInput
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
      />

      <Text style={styles.sectionTitle}>Informations du dirigeant</Text>

      {renderInput('Nom et prénom', managerName, setManagerName, 'managerName')}
      {renderInput('Fonction', managerRole, setManagerRole, 'managerRole')}
      {renderInput('Email', managerEmail, setManagerEmail, 'managerEmail', { keyboardType: 'email-address', autoCapitalize: 'none' })}
      {renderInput('Mot de passe', password, setPassword, 'password', { secureTextEntry: secure })}
      {renderInput('Confirmer mot de passe', confirmPassword, setConfirmPassword, 'confirmPassword', { secureTextEntry: secure })}

      <TouchableOpacity onPress={() => setSecure(!secure)}>
        <Text style={styles.toggle}>{secure ? '👁️‍🗨️' : '🙈'}</Text>
      </TouchableOpacity>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Créer le compte</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default EntrepriseRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00796B',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    color: '#004D40',
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
    errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 8,
    marginLeft: 4,
  },
});