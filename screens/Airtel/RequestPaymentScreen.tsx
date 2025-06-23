// RequestPaymentScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';

const RequestPaymentScreen = () => {
  const auth = getAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any | null>(null);

  useEffect(() => {
    const fetchBeneficiaries = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'users', user.uid, 'beneficiaries'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBeneficiaries(data);
    };
    fetchBeneficiaries();
  }, []);

  const handleSubmit = async () => {
    if (!selectedBeneficiary || !amount || isNaN(Number(amount))) {
      Alert.alert('Erreur', 'Veuillez renseigner toutes les informations correctement.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const senderDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const senderName = senderDoc.exists() ? senderDoc.data().name || 'Expéditeur' : 'Expéditeur';

      const receiverUid = selectedBeneficiary.linkedUid;
      if (!receiverUid) throw new Error("Ce bénéficiaire n'a pas de compte MMG");

      await addDoc(collection(db, 'users', receiverUid, 'requests'), {
        senderUid: currentUser.uid,
        senderPhone: currentUser.phoneNumber,
        senderName,
        amount: Number(amount),
        reason,
        createdAt: Timestamp.now(),
        status: 'en attente',
      });

      Alert.alert('Succès', 'Demande de paiement envoyée.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demander un paiement</Text>

      <Text style={styles.label}>Choisir un bénéficiaire :</Text>
      <FlatList
        data={beneficiaries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.beneficiaryItem, selectedBeneficiary?.id === item.id && styles.selected]}
            onPress={() => setSelectedBeneficiary(item)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </TouchableOpacity>
        )}
      />

      <TextInput
        placeholder="Montant"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      <TextInput
        placeholder="Motif (facultatif)"
        value={reason}
        onChangeText={setReason}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Envoyer la demande</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RequestPaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: '600', marginVertical: 10 },
  beneficiaryItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 10,
  },
  selected: {
    backgroundColor: '#B2DFDB',
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  phone: { fontSize: 14 },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});