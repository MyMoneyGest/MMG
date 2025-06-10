import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';

type Vault = {
  id: string;
  name: string;
  balance: number;
  goal?: number;
  createdAt: Date;
  type: 'standard' | 'locked';
  lockedUntil?: string | null;
  uid: string;
};

type VaultDetailsRouteProp = RouteProp<RootStackParamList, 'VaultDetails'>;

const VaultDetailsScreen = () => {
  const route = useRoute<VaultDetailsRouteProp>();
  const { vault } = route.params as { vault: Vault };
  const navigation = useNavigation();
  const user = getAuth().currentUser;

  const [amount, setAmount] = useState('');
  const isLocked = vault.type === 'locked';

  const parsedUnlockDate = (() => {
    try {
      if (!vault.lockedUntil) return null;
      const date = new Date(vault.lockedUntil);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  })();

  const unlockDateFormatted = parsedUnlockDate
    ? format(parsedUnlockDate, 'dd/MM/yyyy')
    : null;

  const canWithdraw =
    !isLocked || (parsedUnlockDate && new Date() >= parsedUnlockDate);

  const handleAddMoney = async () => {
    const value = parseInt(amount);
    if (!user || isNaN(value) || value <= 0) return;

    const vaultRef = doc(db, 'users', user.uid, 'vaults', vault.id);
    await updateDoc(vaultRef, {
      balance: vault.balance + value,
    });

    Alert.alert('Succès', 'Argent ajouté au coffre');
    navigation.goBack();
  };

  const handleWithdraw = async () => {
    if (isLocked && parsedUnlockDate && new Date() < parsedUnlockDate) {
      Alert.alert(
        'Coffre bloqué',
        `Retrait possible à partir du ${unlockDateFormatted}.`
      );
      return;
    }

    const value = parseInt(amount);
    if (!user || isNaN(value) || value <= 0 || value > vault.balance) return;

    const vaultRef = doc(db, 'users', user.uid, 'vaults', vault.id);
    await updateDoc(vaultRef, {
      balance: vault.balance - value,
    });

    Alert.alert('Succès', 'Argent retiré du coffre');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vault.name}</Text>
      <Text style={styles.balance}>Solde : {vault.balance.toLocaleString()} FCFA</Text>
      {vault.goal && <Text>🎯 Objectif : {vault.goal.toLocaleString()} FCFA</Text>}
      {unlockDateFormatted && <Text>🔒 Débloqué le : {unlockDateFormatted}</Text>}

      <TextInput
        placeholder="Montant"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleAddMoney}>
        <Text style={styles.buttonText}>Ajouter</Text>
      </TouchableOpacity>

      {canWithdraw && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#B71C1C' }]}
          onPress={handleWithdraw}
        >
          <Text style={styles.buttonText}>Retirer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VaultDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  balance: { fontSize: 18, marginBottom: 10 },
  input: { borderBottomWidth: 1, marginBottom: 20, paddingVertical: 8 },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});