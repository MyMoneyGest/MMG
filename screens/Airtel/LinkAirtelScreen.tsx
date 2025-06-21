//LinkAirtelScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const LinkAirtelScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  const sendFakeCode = () => {
    if (!phone || !phone.startsWith('+241') || phone.length < 10) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro valide au format +241XXXXXXXX');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
    setGeneratedCode(code);
    setCodeSent(true);
    Alert.alert('Code envoyé', `Un code fictif a été envoyé : ${code}`); // Pour test
  };

  const validateCode = async () => {
  if (enteredCode === generatedCode) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Erreur', 'Utilisateur non authentifié.');
        return;
      }

      const uid = currentUser.uid;
      const linkedRef = doc(db, 'users', uid, 'linkedAccounts', 'airtel');

      await setDoc(linkedRef, {
        uid,
        phoneNumber: phone,
        airtelBalance: 22500, // valeur fictive pour le test
        lastUpdated: new Date().toISOString(),
        transactions: [
          { id: 't1', type: 'Réception', amount: 10000, date: '2025-06-12' },
          { id: 't2', type: 'Envoi', amount: -5000, date: '2025-06-11' }
        ]
      });

      Alert.alert('Succès', 'Votre compte Airtel Money est désormais lié.');
      navigation.navigate('AirtelMoney');
    } catch (error) {
      console.error('Erreur Firestore :', error);
      Alert.alert('Erreur', 'Impossible de lier le compte Airtel.');
    }
  } else {
    Alert.alert('Erreur', 'Code incorrect. Veuillez réessayer.');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lier votre compte Airtel</Text>
      
      <TextInput
        style={styles.input}
        placeholder="+241XXXXXXXX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!codeSent}
      />
      
      {!codeSent && (
        <TouchableOpacity style={styles.button} onPress={sendFakeCode}>
          <Text style={styles.buttonText}>Recevoir un code</Text>
        </TouchableOpacity>
      )}

      {codeSent && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Entrez le code reçu"
            keyboardType="numeric"
            value={enteredCode}
            onChangeText={setEnteredCode}
          />
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
  input: { borderBottomWidth: 1, marginBottom: 20, paddingVertical: 8 },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});