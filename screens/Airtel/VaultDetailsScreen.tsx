import React, { useEffect, useMemo, useState } from 'react';
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
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { format } from 'date-fns';

type Vault = {
  id: string;
  name: string;
  balance: number;
  goal?: number;
  createdAt: Date;
  type: 'standard' | 'locked';
  lockedUntil?: string | null; // ISO string
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
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [airtelBalance, setAirtelBalance] = useState<number | null>(null);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAmountValid = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0;
  }, [amount]);

  const isLocked = vault.type === 'locked';

  const getUnlockDate = () => {
    if (!vault.lockedUntil) return null;
    const d = new Date(vault.lockedUntil);
    return isNaN(d.getTime()) ? null : d;
  };
  const unlockDate = getUnlockDate();
  const unlockDateFormatted = unlockDate ? format(unlockDate, 'dd/MM/yyyy') : null;
  const canWithdraw = !isLocked || (unlockDate && new Date() >= unlockDate);

  const requestAction = (type: 'add' | 'withdraw' | 'delete') => {
    setActionType(type);
    setPassword('');
    setPasswordError('');
    setModalVisible(true);
  };

  // Suivi du solde Airtel
  useEffect(() => {
    if (!user) return;
    const airtelRef = doc(db, 'users', user.uid, 'linkedAccounts', 'airtel');
    const unsubscribe = onSnapshot(airtelRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setAirtelBalance(Number(data.airtelBalance ?? 0));
      }
    });
    return () => unsubscribe();
  }, [user]);

  /** Crée un vaultCommand et attend sa résolution (success/failed) */
  const sendVaultCommand = async (type: 'deposit' | 'withdrawal', vaultId: string, rawAmount: number, note?: string) => {
    if (!user) throw new Error('Utilisateur non connecté');
    const uid = user.uid;
    const ref = await addDoc(collection(db, 'users', uid, 'vaultCommands'), {
      type,
      vaultId,
      amount: Math.trunc(rawAmount),
      note: note ?? '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return new Promise<{ reference?: string }>((resolve, reject) => {
      const unsub = onSnapshot(ref, (s) => {
        const d = s.data() as any;
        if (!d) return;
        if (d.status === 'success') {
          unsub();
          resolve({ reference: d.reference });
        } else if (d.status === 'failed') {
          unsub();
          reject(new Error(d.error || 'Échec de l’opération'));
        }
      });
      // filet de sécurité
      setTimeout(() => {
        unsub();
        reject(new Error('Timeout'));
      }, 30000);
    });
  };

  const handleConfirmedAction = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;

    if (!password.trim()) {
      setPasswordError('Veuillez entrer votre mot de passe.');
      return;
    }

    try {
      // Re‑auth
      setIsLoading(true);
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      setFailedAttempts(0);

      const value = Math.trunc(Number(amount));
      if ((actionType === 'add' || actionType === 'withdraw') && (!value || value <= 0)) {
        setPasswordError('');
        Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
        setIsLoading(false);
        return;
      }

      if (actionType === 'withdraw') {
        // Vérrouillage côté client (garde-fou UX ; le serveur protège aussi)
        if (!canWithdraw) {
          Alert.alert('Coffre bloqué', `Retrait possible à partir du ${unlockDateFormatted}.`);
          setIsLoading(false);
          return;
        }
      }

      if (actionType === 'delete') {
        // Tes règles interdisent delete côté client.
        setIsLoading(false);
        setModalVisible(false);
        Alert.alert(
          'Non disponible',
          "La suppression de coffre n'est pas encore supportée côté client. On peut l'ajouter via un vaultDeleteCommand + Function si tu veux."
        );
        return;
      }

      // Envoi de la commande au serveur
      if (actionType === 'add') {
        const res = await sendVaultCommand('deposit', vault.id, value, `Versement vers ${vault.name}`);
        setModalVisible(false);
        Alert.alert('Succès', `Argent ajouté au coffre.\nRéférence : ${res.reference ?? '—'}`);
        navigation.goBack();
      } else if (actionType === 'withdraw') {
        const res = await sendVaultCommand('withdrawal', vault.id, value, `Retrait depuis ${vault.name}`);
        setModalVisible(false);
        Alert.alert('Succès', `Argent retiré du coffre.\nRéférence : ${res.reference ?? '—'}`);
        navigation.goBack();
      }

    } catch (error: any) {
      // Gestion des erreurs
      if (__DEV__) console.error('Erreur vault command :', error);

      const isWrongPassword =
        error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password';

      if (isWrongPassword) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        setPasswordError(`Mot de passe incorrect (tentative ${next} sur 5)`);
        if (next >= 5) {
          Alert.alert(
            'Trop de tentatives',
            'Vous allez être redirigé vers la réinitialisation du mot de passe.',
            [{ text: 'OK', onPress: () => navigation.navigate('ForgotPassword') }]
          );
        }
        setIsLoading(false);
        return;
      }

      // Messages métier (renvoyés par la Function)
      const msg = String(error?.message || '');
      if (msg.includes('Solde Airtel insuffisant')) {
        Alert.alert('Erreur', 'Votre solde principal est insuffisant pour cette opération.');
      } else if (msg.includes('Solde du coffre insuffisant')) {
        Alert.alert('Erreur', 'Le montant dépasse le solde disponible dans ce coffre.');
      } else if (msg.startsWith('BLOQUÉ_JUSQUAU_')) {
        const date = msg.replace('BLOQUÉ_JUSQUAU_', '');
        Alert.alert('Coffre bloqué', `Retrait possible à partir du ${date}.`);
      } else {
        Alert.alert('Erreur', 'Une erreur inattendue est survenue. Veuillez réessayer.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{vault.name}</Text>
        {airtelBalance !== null && (
          <Text style={styles.balanceSmall}>💰 {airtelBalance.toLocaleString()} FCFA</Text>
        )}
      </View>

      <Text style={styles.balance}>Solde : {vault.balance.toLocaleString()} FCFA</Text>
      {vault.goal ? <Text>🎯 Objectif : {vault.goal.toLocaleString()} FCFA</Text> : null}
      {unlockDateFormatted ? <Text>🔒 Débloqué le : {unlockDateFormatted}</Text> : null}

      <TextInput
        placeholder="Montant"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, !isAmountValid || isLoading ? styles.disabledButton : null]}
        onPress={() => requestAction('add')}
        disabled={!isAmountValid || isLoading}
      >
        <Text style={styles.buttonText}>{isLoading && actionType === 'add' ? 'Envoi...' : 'Ajouter'}</Text>
      </TouchableOpacity>

      {canWithdraw && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#B71C1C' }, !isAmountValid || isLoading ? styles.disabledButton : null]}
          onPress={() => requestAction('withdraw')}
          disabled={!isAmountValid || isLoading}
        >
          <Text style={styles.buttonText}>{isLoading && actionType === 'withdraw' ? 'Envoi...' : 'Retirer'}</Text>
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
              placeholder="Votre mot de passe"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              style={styles.input}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isLoading ? styles.disabledButton : null]}
              onPress={handleConfirmedAction}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Validation...' : 'Confirmer'}</Text>
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
  disabledButton: { backgroundColor: '#ccc' },
  modalContainer: {
    flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20,
  },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  balanceSmall: { fontSize: 14, color: '#00796B', fontWeight: '600' },
  errorText: { color: '#D32F2F', marginBottom: 10, textAlign: 'center', fontWeight: '500' },
});