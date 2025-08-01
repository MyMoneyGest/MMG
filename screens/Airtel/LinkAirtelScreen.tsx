import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import PhoneInput from '../../constants/PhoneInput'; // ✅ Utilisation du composant personnalisé

const LinkAirtelScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const sendFakeCode = () => {
    setPhoneError('');
    setCodeError('');

    if (!phone || phone.length !== 9 || !/^\d{9}$/.test(phone)) {
      setPhoneError('Veuillez entrer un numéro valide (9 chiffres après +241).');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
    setGeneratedCode(code);
    setCodeSent(true);
    alert(`Code fictif envoyé,  Notez le !  : ${code}`); // Pour test uniquement
  };

  const validateCode = async () => {
    setCodeError('');

    if (enteredCode !== generatedCode) {
      setCodeError('Code incorrect. Veuillez réessayer.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setCodeError('Utilisateur non authentifié.');
        return;
      }

      const uid = currentUser.uid;
      const linkedRef = doc(db, 'users', uid, 'linkedAccounts', 'airtel');

      await setDoc(linkedRef, {
        uid,
        phoneNumber: '+241' + phone,
        airtelBalance: 22500,
        lastUpdated: new Date().toISOString(),
        transactions: [
          { id: 't1', type: 'Réception', amount: 10000, date: '2025-06-12' },
          { id: 't2', type: 'Envoi', amount: -5000, date: '2025-06-11' },
        ],
      });

      navigation.navigate('AirtelMoney');
    } catch (error) {
      console.error('Erreur Firestore :', error);
      setCodeError('Erreur lors de la liaison. Veuillez réessayer.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lier votre compte Airtel</Text>

      <PhoneInput
        value={phone}
        onChangeText={setPhone}
        error={phoneError}
      />

      {!codeSent && (
        <TouchableOpacity style={styles.button} onPress={sendFakeCode}>
          <Text style={styles.buttonText}>Recevoir un code</Text>
        </TouchableOpacity>
      )}

      {codeSent && (
        <>
          <TextInput
            style={[styles.input, codeError ? styles.inputError : null]}
            placeholder="Entrez le code reçu"
            keyboardType="numeric"
            value={enteredCode}
            onChangeText={setEnteredCode}
          />
          {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={validateCode}>
            <Text style={styles.buttonText}>Valider</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default LinkAirtelScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  inputError: {
    borderBottomColor: '#D32F2F',
    borderBottomWidth: 2,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: -4,
    marginBottom: 10,
    marginLeft: 2,
  },
});