import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AjouterCollaborateurScreen'>;

const AjouterCollaborateurScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [fonction, setFonction] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAddCollaborator = async () => {
    if (!nom || !email || !fonction || !telephone) {
      Alert.alert('Champs manquants', 'Tous les champs doivent être remplis.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté.");

      const entrepriseId = user.uid; // L'UID de l'admin est utilisé comme ID de l’entreprise

      const collaboratorData = {
        nom,
        email,
        fonction,
        telephone,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'enterprises', entrepriseId, 'collaborators'), collaboratorData);

      Alert.alert('Succès', 'Collaborateur ajouté avec succès.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Erreur ajout collaborateur :', error);
      Alert.alert('Erreur', error.message || "Impossible d'ajouter le collaborateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ajouter un collaborateur</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du collaborateur"
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        style={styles.input}
        placeholder="Fonction (ex: Développeur, RH...)"
        value={fonction}
        onChangeText={setFonction}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Téléphone"
        value={telephone}
        onChangeText={setTelephone}
        keyboardType="phone-pad"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleAddCollaborator}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default AjouterCollaborateurScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
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
    fontWeight: '600',
  },
});