import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const AirtelBeneficiariesScreen = () => {
  const user = getAuth().currentUser;
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('Airtel');

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, 'users', user.uid, 'beneficiaries');
    const q = query(ref, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBeneficiaries(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async () => {
    if (!name || !phone) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }

    try {
      await addDoc(collection(db, 'users', user!.uid, 'beneficiaries'), {
        name,
        phone,
        operator,
        createdAt: new Date(),
      });
      setName('');
      setPhone('');
      setOperator('Airtel');
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible d\'ajouter ce bénéficiaire.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', user!.uid, 'beneficiaries', id));
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de supprimer.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.beneficiaryItem}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.phone}</Text>
        <Text style={styles.operator}>{item.operator}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text style={styles.delete}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mes bénéficiaires</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={beneficiaries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un bénéficiaire</Text>
            <TextInput
              placeholder="Nom complet"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Numéro de téléphone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              placeholder="Opérateur (Airtel, Moov...)"
              value={operator}
              onChangeText={setOperator}
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleAdd}>
              <Text style={styles.buttonText}>Ajouter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#B71C1C' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AirtelBeneficiariesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { fontSize: 16, color: '#00796B', fontWeight: 'bold' },
  listContent: { paddingVertical: 20 },
  beneficiaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  operator: { color: '#00796B', fontSize: 12, marginTop: 4 },
  delete: { color: '#B71C1C', fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});