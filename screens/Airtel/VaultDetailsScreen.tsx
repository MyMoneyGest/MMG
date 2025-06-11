import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { format } from 'date-fns';

// Types

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = getAuth().currentUser;

  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'withdraw' | 'delete' | null>(null);
  const [amount, setAmount] = useState('');
  const isAmountValid = !!amount && !isNaN(Number(amount)) && Number(amount) > 0;
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const isLocked = vault.type === 'locked';

  const getUnlockDate = () => {
    if (!vault.lockedUntil) return null;
    const parsedDate = new Date(vault.lockedUntil);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const unlockDateFormatted = getUnlockDate()
    ? format(getUnlockDate()!, 'dd/MM/yyyy')
    : null;

  const canWithdraw = !isLocked || (getUnlockDate() && new Date() >= getUnlockDate()!);

  const requestAction = (type: 'add' | 'withdraw' | 'delete') => {
    setActionType(type);
    setPassword('');
    setModalVisible(true);
  };

  const handleConfirmedAction = async () => {
    if (!user || !user.email) return;

    const credential = EmailAuthProvider.credential(user.email, password);
    try {
      await reauthenticateWithCredential(user, credential);

      const vaultRef = doc(db, 'users', user.uid, 'vaults', vault.id);

      if (actionType === 'add') {
        const value = parseInt(amount);
        if (isNaN(value) || value <= 0) return;
        await updateDoc(vaultRef, { balance: vault.balance + value });
        Alert.alert('Succès', 'Argent ajouté au coffre');
      } else if (actionType === 'withdraw') {
        const value = parseInt(amount);
        if (isNaN(value) || value <= 0) return;
        if (value > vault.balance) {
          Alert.alert('Erreur', 'Montant supérieur au solde du coffre');
          return;
        }
        const now = new Date();
        const unlockDate = getUnlockDate();
        if (isLocked && unlockDate && now < unlockDate) {
          Alert.alert(
            'Coffre bloqué',
            `Retrait possible à partir du ${format(unlockDate, 'dd/MM/yyyy')}.`
          );
          return;
        }
        await updateDoc(vaultRef, { balance: vault.balance - value });
        Alert.alert('Succès', 'Argent retiré du coffre');
      } else if (actionType === 'delete') {
        await deleteDoc(vaultRef);
        Alert.alert('Succès', 'Coffre supprimé');
      }

      setModalVisible(false);
      setFailedAttempts(0);
      navigation.goBack();
    } catch (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        Alert.alert(
          'Trop de tentatives',
          'Vous allez être redirigé vers la réinitialisation du mot de passe.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ForgotPassword'),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', 'Mot de passe incorrect');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{vault.name}</Text>
      </View>
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

      <TouchableOpacity
        style={[styles.button, !isAmountValid && styles.disabledButton]}
        onPress={() => requestAction('add')}
        disabled={!isAmountValid}
      >
        <Text style={styles.buttonText}>Ajouter</Text>
      </TouchableOpacity>

      {canWithdraw && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#B71C1C' }, !isAmountValid && styles.disabledButton]}
          onPress={() => requestAction('withdraw')}
          disabled={!isAmountValid}
        >
          <Text style={styles.buttonText}>Retirer</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#D32F2F' }]}
        onPress={() => requestAction('delete')}
      >
        <Text style={styles.buttonText}>Supprimer ce coffre</Text>
      </TouchableOpacity>

      {/* Modal mot de passe */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmez avec votre mot de passe</Text>
            <TextInput
              placeholder="Mot de passe"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleConfirmedAction}>
              <Text style={styles.buttonText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.button, { backgroundColor: '#B71C1C' }]}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VaultDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});