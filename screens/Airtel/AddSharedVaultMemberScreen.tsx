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
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, doc, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';

const AddSharedVaultMemberScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { vaultId } = route.params;

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMember = async () => {
    if (!phone.match(/^\+241\d{9}$/)) {
      Alert.alert('Erreur', 'Le numéro doit être au format +241XXXXXXXX');
      return;
    }

    setLoading(true);

    try {
      const q = query(collection(db, 'phoneDirectory'), where('phone', '==', phone));
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Utilisateur introuvable', 'Aucun compte lié à ce numéro.');
        setLoading(false);
        return;
      }

      const targetUid = snap.docs[0].data().uid;

      const memberRef = doc(db, 'sharedVaults', vaultId, 'members', targetUid);
      await setDoc(memberRef, {
        role: 'editor',
        joinedAt: serverTimestamp(),
      });

      Alert.alert('Succès', 'Membre ajouté au coffre.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'ajouter le membre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ajouter un membre</Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="+241XXXXXXXXX"
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: '#999' }]}
        onPress={handleAddMember}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Ajout en cours...' : 'Ajouter'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AddSharedVaultMemberScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#00796B' },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});