import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '@/services/firebaseConfig';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateSharedVaultScreen'>;

const CreateSharedVaultScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du coffre est requis.');
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      // 📦 Création du coffre dans sharedVaults/
      const vaultRef = await addDoc(collection(db, 'sharedVaults'), {
        name: name.trim(),
        balance: 0,
        creatorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      console.log('📦 Coffre créé avec ID :', vaultRef.id);

      // 👥 Ajout du créateur comme membre admin
      await setDoc(doc(db, 'sharedVaults', vaultRef.id, 'members', user.uid), {
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      Alert.alert('Succès', 'Coffre partagé créé.');
      navigation.goBack();
    } catch (e) {
      console.error('Erreur création coffre partagé:', e);
      Alert.alert('Erreur', 'Impossible de créer le coffre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Créer un coffre partagé</Text>

      <TextInput
        placeholder="Nom du coffre"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Création...' : 'Créer'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreateSharedVaultScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F0F8F6',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#00796B',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});