import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  SafeAreaView, TouchableOpacity, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

type Client = {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
};

const ClientsScreen = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [entreprise, setEntreprise] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const entrepriseId = user.uid;
    const ref = collection(db, 'entreprises', entrepriseId, 'clients');

    const unsubscribe = onSnapshot(query(ref, orderBy('createdAt', 'desc')), snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Client, 'id'>),
      }));
      setClients(data);
      setFilteredClients(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredClients(
      clients.filter(
        c =>
          c.nom?.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower)
      )
    );
  }, [search, clients]);

  const resetForm = () => {
    setNom('');
    setEmail('');
    setTelephone('');
    setEntreprise('');
    setEditClientId(null);
  };

  const handleAddOrUpdateClient = async () => {
    if (!nom || !email) {
      Alert.alert('Champs requis', 'Nom et email sont obligatoires.');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    const entrepriseId = user.uid;
    const ref = collection(db, 'entreprises', entrepriseId, 'clients');

    try {
      if (editClientId) {
        const docRef = doc(db, 'entreprises', entrepriseId, 'clients', editClientId);
        await updateDoc(docRef, { nom, email, telephone, entreprise });
      } else {
        await addDoc(ref, {
          nom,
          email,
          telephone,
          entreprise,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Erreur', 'Action échouée.');
    }
  };

  const handleEdit = (client: Client) => {
    setEditClientId(client.id);
    setNom(client.nom);
    setEmail(client.email);
    setTelephone(client.telephone || '');
    setEntreprise(client.entreprise || '');
    setModalVisible(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!user) return;

    Alert.alert('Confirmation', 'Supprimer ce client ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const docRef = doc(db, 'entreprises', user.uid, 'clients', clientId);
          await deleteDoc(docRef);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="person-add-outline" size={28} color="#00796B" />
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Rechercher un client"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clientItem}>
            <Text style={styles.clientName}>{item.nom}</Text>
            <Text style={styles.clientDetail}>{item.email}</Text>
            {item.telephone ? <Text style={styles.clientDetail}>{item.telephone}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                <Ionicons name="create-outline" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.placeholder}>Aucun client trouvé.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editClientId ? 'Modifier' : 'Ajouter'} un client</Text>

            <TextInput placeholder="Nom" value={nom} onChangeText={setNom} style={styles.input} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
            <TextInput placeholder="Téléphone" value={telephone} onChangeText={setTelephone} style={styles.input} keyboardType="phone-pad" />
            <TextInput placeholder="Entreprise (facultatif)" value={entreprise} onChangeText={setEntreprise} style={styles.input} />

            <TouchableOpacity onPress={handleAddOrUpdateClient} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{editClientId ? 'Mettre à jour' : 'Enregistrer'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ClientsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
  },
  searchInput: {
    margin: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    borderColor: '#C8E6C9',
    borderWidth: 1,
  },
  clientItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 8,
    elevation: 2,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1B5E20',
  },
  clientDetail: {
    color: '#607D8B',
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionBtn: {
    marginLeft: 15,
  },
  placeholder: {
    textAlign: 'center',
    color: '#90A4AE',
    fontSize: 16,
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000088',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2E7D32',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#AED581',
  },
  saveButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
  },
});