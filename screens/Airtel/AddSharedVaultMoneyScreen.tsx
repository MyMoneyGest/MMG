import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '@/services/firebaseConfig';
import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { getUserMainBalanceRef, checkPassword } from '@/utils/userUtils';
import { generateTransactionRef } from '@/utils/generateRef';

const AddSharedVaultMoneyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { vaultId } = route.params;

  const user = auth.currentUser;
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMoney = async () => {
    if (!user || !amount || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    const value = parseInt(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Erreur', 'Montant invalide.');
      return;
    }

    setLoading(true);

    try {
      // 🔐 Vérification du mot de passe
      const valid = await checkPassword(user.uid, password);
      if (!valid) {
        setLoading(false);
        Alert.alert('Erreur', 'Mot de passe incorrect.');
        return;
      }

      // 🔹 Décrémenter le solde principal Airtel
      const balanceRef = getUserMainBalanceRef(user.uid);
      const balanceSnap = await getDoc(balanceRef);
      if (!balanceSnap.exists() || balanceSnap.data().amount < value) {
        setLoading(false);
        Alert.alert('Solde insuffisant');
        return;
      }

      await updateDoc(balanceRef, {
        amount: increment(-value),
      });

      // 🔹 Incrémenter le solde du coffre
      const vaultRef = doc(db, 'sharedVaults', vaultId);
      await updateDoc(vaultRef, {
        balance: increment(value),
      });

      // 🔹 Ajouter une transaction dans le coffre
      await addDoc(collection(db, 'sharedVaults', vaultId, 'transactions'), {
        type: 'deposit',
        amount: value,
        createdAt: serverTimestamp(),
        ref: await generateTransactionRef(),
        from: user.uid,
        to: `coffre:${vaultId}`,
        note: 'Ajout au coffre',
      });

      Alert.alert('Succès', 'Argent ajouté au coffre.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible d’ajouter de l’argent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ajouter de l'argent au coffre</Text>

      <TextInput
        style={styles.input}
        placeholder="Montant en FCFA"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleAddMoney} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Traitement...' : 'Ajouter'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AddSharedVaultMoneyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#00796B' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});