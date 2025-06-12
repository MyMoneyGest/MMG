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
import { runTransaction } from 'firebase/firestore';


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

  // ... (imports inchangés)

const handleConfirmedAction = async () => {
  if (!user || !user.email) return;

  const credential = EmailAuthProvider.credential(user.email, password);
  const vaultRef = doc(db, 'users', user.uid, 'vaults', vault.id);
  const userRef = doc(db, 'users', user.uid);

  try {
    await reauthenticateWithCredential(user, credential);

    const value = parseInt(amount);
    if ((actionType === 'add' || actionType === 'withdraw') && (!value || isNaN(value) || value <= 0)) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }

    await runTransaction(db, async (transaction) => {
      const vaultSnap = await transaction.get(vaultRef);
      const userSnap = await transaction.get(userRef);

      if (!vaultSnap.exists() || !userSnap.exists()) throw new Error("Données introuvables");

      const currentVault = vaultSnap.data();
      const currentBalance = currentVault.balance;
      const currentMainBalance = userSnap.data().mainBalance || 0;

      if (actionType === 'add') {
        if (value > currentMainBalance) throw new Error('SOLDE_INSUFFISANT');
        transaction.update(vaultRef, { balance: currentBalance + value });
        transaction.update(userRef, { mainBalance: currentMainBalance - value });

      } else if (actionType === 'withdraw') {
        if (value > currentBalance) throw new Error('COFFRE_INSUFFISANT');

        const now = new Date();
        const unlockDate = getUnlockDate();
        if (isLocked && unlockDate && now < unlockDate) {
          throw new Error(`BLOQUÉ_JUSQUAU_${format(unlockDate, 'dd/MM/yyyy')}`);
        }

        transaction.update(vaultRef, { balance: currentBalance - value });
        transaction.update(userRef, { mainBalance: currentMainBalance + value });

      } else if (actionType === 'delete') {
        transaction.delete(vaultRef);
        transaction.update(userRef, { mainBalance: currentMainBalance + currentBalance });
      }
    });

    const successMessage =
      actionType === 'delete'
        ? `Coffre supprimé. Le montant a été transféré vers votre solde principal.`
        : actionType === 'add'
        ? 'Argent ajouté au coffre.'
        : 'Argent retiré du coffre.';

    Alert.alert('Succès', successMessage);

    setModalVisible(false);
    setFailedAttempts(0);
    navigation.goBack();

  } catch (error: any) {
    if (__DEV__) {
      console.error('Erreur lors de la transaction :', error);
    }
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    const isWrongPassword =
      error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password';

    if (nextAttempts >= 5) {
      Alert.alert(
        'Trop de tentatives',
        'Vous allez être redirigé vers la réinitialisation du mot de passe.',
        [{ text: 'OK', onPress: () => navigation.navigate('ForgotPassword') }]
      );
    } else if (isWrongPassword) {
      Alert.alert('Mot de passe incorrect', `Tentative ${nextAttempts} sur 5`);
    } else if (error.message === 'SOLDE_INSUFFISANT') {
      Alert.alert('Erreur', 'Votre solde principal est insuffisant pour cette opération.');
    } else if (error.message === 'COFFRE_INSUFFISANT') {
      Alert.alert('Erreur', 'Le montant dépasse le solde disponible dans ce coffre.');
    } else if (error.message?.startsWith('BLOQUÉ_JUSQUAU_')) {
      const date = error.message.replace('BLOQUÉ_JUSQUAU_', '');
      Alert.alert('Coffre bloqué', `Retrait possible à partir du ${date}.`);
    } else {
      Alert.alert('Erreur', 'Une erreur inattendue est survenue. Veuillez réessayer.');
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