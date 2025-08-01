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
  updateDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import PhoneInput from '../../constants/PhoneInput';

const AirtelBeneficiariesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = getAuth().currentUser;
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('Airtel');
  const [editId, setEditId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleAddOrUpdate = async () => {
    setPhoneError('');

    if (!name || !phone) {
      if (!phone) setPhoneError('Le numéro est requis.');
      return;
    }
    if (!/^\d{9}$/.test(phone)) {
      setPhoneError('Numéro invalide. 9 chiffres après +241 attendus.');
      return;
    }

    try {
      const phoneQuery = query(collection(db, 'phoneDirectory'), where('phone', '==', '+241' + phone));
      const snap = await getDocs(phoneQuery);

      let linkedUid: string | null = null;
      if (!snap.empty) {
        linkedUid = snap.docs[0].data().uid;
      }

      const payload = {
        name,
        phone: '+241' + phone,
        operator,
        linkedUid,
        createdAt: new Date(),
      };

      if (editId) {
        const ref = doc(db, 'users', user!.uid, 'beneficiaries', editId);
        await updateDoc(ref, payload);
      } else {
        await addDoc(collection(db, 'users', user!.uid, 'beneficiaries'), payload);
      }

      setName('');
      setPhone('');
      setOperator('Airtel');
      setEditId(null);
      setModalVisible(false);
      setSuccessMessage('Bénéficiaire mis à jour avec succès.');

      navigation.navigate('AirtelBeneficiairesScreen');
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', `Impossible d'${editId ? 'mettre à jour' : 'ajouter'} ce bénéficiaire.`);
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
        {item.linkedUid ? (
          <Text style={styles.badgeMMG}>✅ Utilisateur MyMoneyGest</Text>
        ) : (
          <Text style={styles.badgeNonMMG}>Non inscrit MMG</Text>
        )}

        <TouchableOpacity onPress={() => {
          setName(item.name);
          setPhone(item.phone.replace('+241', ''));
          setOperator(item.operator || 'Airtel');
          setEditId(item.id);
          setModalVisible(true);
        }}>
          <Text style={styles.edit}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Confirmer la suppression',
              'Voulez-vous vraiment supprimer ce bénéficiaire ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => handleDelete(item.id),
                },
              ]
            )
          }
        >
          <Text style={styles.delete}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mes bénéficiaires</Text>
        <TouchableOpacity onPress={() => {
          setEditId(null);
          setName('');
          setPhone('');
          setOperator('Airtel');
          setModalVisible(true);
        }}>
          <Text style={styles.addButton}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={beneficiaries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {successMessage !== '' && (
              <Text style={{ color: '#388E3C', marginBottom: 10, textAlign: 'center', fontWeight: '600' }}>
                {successMessage}
              </Text>
            )}
            <Text style={styles.modalTitle}>{editId ? 'Modifier le bénéficiaire' : 'Ajouter un bénéficiaire'}</Text>
            <TextInput
              placeholder="Nom complet"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              error={phoneError}
            />
            <TextInput
              placeholder="Opérateur (Airtel, Moov...)"
              value={operator}
              onChangeText={setOperator}
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleAddOrUpdate}>
              <Text style={styles.buttonText}>{editId ? 'Mettre à jour' : 'Ajouter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#B71C1C' }]}
              onPress={() => {
                setModalVisible(false);
                setEditId(null);
              }}
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
    flexDirection: 'column',
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
  edit: { color: '#00796B', fontWeight: 'bold', marginTop: 8 },
  delete: { color: '#B71C1C', fontWeight: 'bold', marginTop: 4 },
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
  badgeMMG: {
    marginTop: 4,
    color: '#388E3C',
    fontWeight: '600',
    fontSize: 13,
  },
  badgeNonMMG: {
    marginTop: 4,
    color: '#999',
    fontSize: 13,
    fontStyle: 'italic',
  },
});