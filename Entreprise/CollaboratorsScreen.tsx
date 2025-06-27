import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';

const CollaborateursScreen = () => {
  const [collaborateurs, setCollaborateurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [fonction, setFonction] = useState('');
  const [telephone, setTelephone] = useState('');
  const [entrepriseId, setentrepriseId] = useState<string | null>(null);

  // Fonction pour récupérer l'entrepriseId depuis le doc user
  const fetchentrepriseId = async (userUid: string) => {
    try {
      const userDocRef = doc(db, 'users', userUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data().entrepriseId || null;
      }
      return null;
    } catch (error) {
      console.log("Erreur récupération entrepriseId:", error);
      return null;
    }
  };

  // Récupérer les collaborateurs de l'entreprise
  const fetchCollaborateurs = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté.");

      // Si on n'a pas encore l'entrepriseId, on le récupère
      let entId = entrepriseId;
      if (!entId) {
        entId = await fetchentrepriseId(user.uid);
        setentrepriseId(entId);
      }
      if (!entId) throw new Error("Utilisateur non associé à une entreprise");

      const querySnapshot = await getDocs(collection(db, 'entreprises', entId, 'collaborators'));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaborateurs(list);
    } catch (error: any) {
      console.log("Erreur récupération collaborateurs:", error);
      Alert.alert('Erreur', error.message || 'Impossible de récupérer les collaborateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborateurs();
  }, []);

  const handleAddCollaborator = async () => {
    if (!nom || !email || !fonction || !telephone) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté.");

      let entId = entrepriseId;
      if (!entId) {
        entId = await fetchentrepriseId(user.uid);
        setentrepriseId(entId);
      }
      if (!entId) throw new Error("Utilisateur non associé à une entreprise");

      await addDoc(collection(db, 'entreprises', entId, 'collaborators'), {
        nom,
        email,
        fonction,
        telephone,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Succès', 'Collaborateur ajouté.');
      setNom('');
      setEmail('');
      setFonction('');
      setTelephone('');
      setModalVisible(false);
      fetchCollaborateurs();
    } catch (error: any) {
      console.log("Erreur ajout collaborateur:", error);
      Alert.alert('Erreur', `Impossible d'ajouter le collaborateur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collaborateurs</Text>

      {loading && <ActivityIndicator size="large" color="#00796B" />}

      {!loading && (
        <FlatList
          data={collaborateurs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.collaboratorItem}>
              <Text style={styles.collaboratorName}>{item.nom} - {item.fonction}</Text>
              <Text>{item.email}</Text>
              <Text>{item.telephone}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>Aucun collaborateur</Text>}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Ajouter un collaborateur</Text>
      </TouchableOpacity>

      {/* Modal pour ajout */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un collaborateur</Text>

            <TextInput placeholder="Nom" style={styles.input} value={nom} onChangeText={setNom} />
            <TextInput placeholder="Fonction" style={styles.input} value={fonction} onChangeText={setFonction} />
            <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput placeholder="Téléphone" style={styles.input} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddCollaborator}>
                <Text style={styles.buttonText}>Ajouter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.buttonText, { color: '#00796B' }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default CollaborateursScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#00796B', marginBottom: 20 },
  collaboratorItem: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  collaboratorName: { fontWeight: '600' },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  modalBackground: {
    flex:1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    padding:20,
  },
  modalContent: {
    backgroundColor:'#fff',
    borderRadius:8,
    padding:20,
  },
  modalTitle: { fontSize:20, fontWeight:'bold', marginBottom:15, color:'#00796B' },
  input: {
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:8,
    padding:10,
    marginBottom:12,
  },
  modalButtons: { flexDirection:'row', justifyContent:'space-between' },
  modalButton: {
    flex:1,
    backgroundColor:'#00796B',
    padding:12,
    borderRadius:8,
    marginHorizontal:5,
    alignItems:'center',
  },
  cancelButton: {
    backgroundColor:'#eee',
  }
});