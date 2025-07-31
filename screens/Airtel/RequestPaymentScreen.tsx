// RequestPaymentScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ScrollView, SafeAreaView
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  collection, query, getDocs, addDoc, doc, getDoc, serverTimestamp,
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
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

    // Récupération nom demandeur (facultatif)
    const senderDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const requesterName = senderDoc.exists() ? (senderDoc.data().name || 'Utilisateur') : 'Utilisateur';

    const targetUid = selectedBeneficiary.linkedUid;
    if (!targetUid) {
      Alert.alert('Erreur', "Ce bénéficiaire n'a pas de compte MMG");
      return;
    }

    // ✅ ECRITURE DANS LA COLLECTION GLOBALE
    await addDoc(collection(db, 'paymentRequests'), {
      requesterUid: currentUser.uid,
      requesterName,        // utile pour les notifs/affichage
      targetUid,            // la "cible" (qui devra payer ou refuser)
      amount: Math.trunc(Number(amount)),
      note: reason || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    Alert.alert('Succès', 'Demande de paiement envoyée.');
    navigation.goBack();
  } catch (error) {
    console.error(error);
    Alert.alert('Erreur', "Impossible d'envoyer la demande.");
  }
};

  const handleAddBeneficiary = () => {
    navigation.navigate('AirtelBeneficiairesScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Demander de l’argent</Text>
        
      </View>
    <View style={styles.header}>
      <Text style={styles.subtitle}>Choisissez un bénéficiaire</Text>
        <TouchableOpacity onPress={handleAddBeneficiary}>
          <Text style={styles.addButton}>+ Ajouter</Text>
        </TouchableOpacity>
    </View>
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
    

    </SafeAreaView>
  );
};

export default RequestPaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
   title: {
    fontSize: 20,
    color: '#00796B',
    fontWeight: 'bold',
  },
  label: { fontWeight: '600', marginVertical: 10 },
  beneficiaryItem: {
    padding: 12, borderRadius: 8, backgroundColor: '#eee', marginBottom: 10,
  },
  selected: { backgroundColor: '#B2DFDB' },
  name: { fontWeight: 'bold', fontSize: 16 },
  phone: { fontSize: 14 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 15, paddingVertical: 8 },
  button: {
    backgroundColor: '#00796B', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffffcc',
    borderBottomWidth: 1,
    borderBottomColor: '#00796B',
  },
  addButton: {
    fontSize: 16,
    color: '#00796B',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#004D40',
  },
});