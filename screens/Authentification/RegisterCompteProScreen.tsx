// EntrepriseRegisterScreen.tsx
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const createEntrepriseUser = async (
    user: any,
    entrepriseData: any,
    managerData: any
  ) => {
    const userDoc = {
      uid: user.uid,
      type: 'entreprise',
      entrepriseId: user.uid, // ✅ Clé nécessaire
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
    if (
      !entrepriseName || !rccm || !nif || !legalForm ||
      !sector || !address || !phone || !managerName ||
      !managerRole || !managerEmail || !password || !confirmPassword
    ) {
      Alert.alert('Erreur', 'Tous les champs doivent être remplis.');
      return;
    }

    if (!validateEmail(managerEmail)) {
      Alert.alert('Email invalide', 'Utilisez un email professionnel valide.');
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

    if (!/^\d{14,}$/.test(rccm)) {
      Alert.alert('Erreur RCCM', 'Le numéro RCCM doit contenir au moins 14 chiffres.');
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
        telephone: phone,
      };

      const managerData = {
        nom: managerName,
        fonction: managerRole,
        email: managerEmail,
        telephone: phone,
      };

      await createEntrepriseUser(user, entrepriseData, managerData);

      await updateBalanceAndAddTransaction(phone, 0, {
        reference: 'inscription',
        type: 'initial',
        sender: '',
        receiver: phone,
        status: 'success',
      });

      Alert.alert('Succès', 'Compte entreprise créé avec succès.');
      navigation.replace('GestionEntrepriseScreen'); // ✅ navigation directe vers écran entreprise

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erreur', 'Cet email est déjà utilisé.');
      } else {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inscription Entreprise</Text>

      {/* Champs entreprise */}
      <TextInput style={styles.input} placeholder="Raison sociale" value={entrepriseName} onChangeText={setEntrepriseName} />
      <TextInput style={styles.input} placeholder="Numéro RCCM (14 chiffres min.)" value={rccm} onChangeText={setRccm} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Numéro NIF" value={nif} onChangeText={setNif} />
      <TextInput style={styles.input} placeholder="Forme juridique" value={legalForm} onChangeText={setLegalForm} />
      <TextInput style={styles.input} placeholder="Secteur d'activité" value={sector} onChangeText={setSector} />
      <TextInput style={styles.input} placeholder="Adresse du siège" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Téléphone professionnel" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.sectionTitle}>Informations du dirigeant</Text>
      <TextInput style={styles.input} placeholder="Nom et prénom" value={managerName} onChangeText={setManagerName} />
      <TextInput style={styles.input} placeholder="Fonction" value={managerRole} onChangeText={setManagerRole} />
      <TextInput style={styles.input} placeholder="Email" value={managerEmail} onChangeText={setManagerEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry={secure} />
      <TextInput style={styles.input} placeholder="Confirmer mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={secure} />

      <TouchableOpacity onPress={() => setSecure(!secure)}>
        <Text style={styles.toggle}>{secure ? '👁️‍🗨️' : '🙈'}</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister} activeOpacity={0.8}>
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
});