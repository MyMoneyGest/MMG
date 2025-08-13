// VaultDetailsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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

  // Suivi du solde Airtel (inchangé)
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

  /** Envoi d'une commande vault (inchangé) */
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

      if (actionType === 'withdraw' && !canWithdraw) {
        Alert.alert('Coffre bloqué', `Retrait possible à partir du ${unlockDateFormatted}.`);
        setIsLoading(false);
        return;
      }

      if (actionType === 'delete') {
        setIsLoading(false);
        setModalVisible(false);
        Alert.alert(
          'Non disponible',
          "La suppression de coffre n'est pas encore supportée côté client. On peut l’ajouter plus tard via une Function."
        );
        return;
      }

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

  /** ---------- UI ---------- */
  const progress =
    vault.goal && vault.goal > 0 ? Math.min((vault.balance / vault.goal) * 100, 100) : 0;

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {airtelBalance !== null && (
            <View style={styles.airtelBadge}>
              <Ionicons name="wallet" size={14} color="#064e3b" />
              <Text style={styles.airtelBadgeText}>{airtelBalance.toLocaleString()} XOF</Text>
            </View>
          )}
        </View>

        <Text style={styles.vaultName}>{vault.name}</Text>

        <View style={styles.balanceWrap}>
          <Text style={styles.balanceLabel}>Solde actuel</Text>
          <Text style={styles.balanceValue}>
            {vault.balance.toLocaleString()} XOF
          </Text>
        </View>

        {vault.goal ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress.toFixed(1)}% de l’objectif atteint
            </Text>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* INPUT MONTANT */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Montant</Text>
          <View style={styles.amountRow}>
            <Ionicons name="cash-outline" size={20} color="#0f172a" />
            <TextInput
              placeholder="Saisir un montant"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={styles.amountInput}
            />
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionPrimary,
              (!isAmountValid || isLoading) && styles.actionDisabled,
            ]}
            onPress={() => requestAction('add')}
            disabled={!isAmountValid || isLoading}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.actionText}>
              {isLoading && actionType === 'add' ? 'Envoi...' : 'Ajouter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionOutline,
              (!isAmountValid || isLoading || !canWithdraw) && styles.actionDisabledOutline,
            ]}
            onPress={() => requestAction('withdraw')}
            disabled={!isAmountValid || isLoading || !canWithdraw}
          >
            <Ionicons name="remove" size={20} color={canWithdraw ? '#0f172a' : '#94a3b8'} />
            <Text style={[styles.actionTextOutline, !canWithdraw && { color: '#94a3b8' }]}>
              {isLoading && actionType === 'withdraw' ? 'Envoi...' : 'Retirer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PARTAGER */}
        <View style={[styles.card, styles.shareCard]}>
          <View style={styles.shareRow}>
            <View style={styles.shareIcon}>
              <Ionicons name="share-social-outline" size={18} color="#7c3aed" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Partager ce coffre</Text>
              <Text style={styles.cardSub}>
                Invitez famille ou amis à épargner ensemble
              </Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Bientôt', 'Conversion en coffre partagé à venir.')} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={16} color="#7c3aed" />
              <Text style={styles.shareBtnText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INFOS COFFRE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations du coffre</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Objectif</Text>
              <Text style={styles.infoValue}>
                {vault.goal ? vault.goal.toLocaleString() : '—'} XOF
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Restant</Text>
              <Text style={styles.infoValue}>
                {vault.goal ? Math.max(vault.goal - vault.balance, 0).toLocaleString() : '—'} XOF
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItemRow}>
              <Text style={styles.infoLabel}>Type de coffre</Text>
              <View style={[styles.badge, isLocked ? styles.badgeDanger : styles.badgeNeutral]}>
                <Text style={[styles.badgeText, isLocked ? { color: '#fff' } : { color: '#0f172a' }]}>
                  {isLocked ? 'Bloqué' : 'Standard'}
                </Text>
              </View>
            </View>
            <View style={styles.infoItemRow}>
              <Text style={styles.infoLabel}>Mode</Text>
              <View style={[styles.badge, styles.badgeOutline]}>
                <Text style={styles.badgeText}>Personnel</Text>
              </View>
            </View>
          </View>

          {unlockDateFormatted && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.infoLabel}>Date de déblocage</Text>
              <Text style={styles.infoValue}>{unlockDateFormatted}</Text>
            </View>
          )}
        </View>

        {/* ACTIVITÉ RÉCENTE (placeholder local) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activité récente</Text>

          {[
            { id: 1, type: 'add', label: 'Ajout par Jean K.', amount: 25000, ago: 'il y a 2 jours' },
            { id: 2, type: 'add', label: 'Ajout par Vous', amount: 50000, ago: 'il y a 5 jours' },
            { id: 3, type: 'withdraw', label: 'Retrait par Vous', amount: -10000, ago: 'il y a 1 semaine' },
          ].map((a) => (
            <View key={a.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, a.type === 'add' ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fee2e2' }]}>
                <Ionicons
                  name={a.type === 'add' ? 'add' : 'remove'}
                  size={16}
                  color={a.type === 'add' ? '#16a34a' : '#dc2626'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityLabel}>{a.label}</Text>
                <Text style={styles.activitySub}>{a.ago}</Text>
              </View>
              <Text style={[styles.activityAmount, a.type === 'add' ? { color: '#16a34a' } : { color: '#dc2626' }]}>
                {a.type === 'add' ? '+' : '-'}
                {Math.abs(a.amount).toLocaleString()} XOF
              </Text>
            </View>
          ))}
        </View>

        {/* SUPPRESSION (désactivée côté métier — on garde le CTA comme avant) */}
        <TouchableOpacity
          style={[styles.deleteBtn]}
          onPress={() => requestAction('delete')}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteText}>Supprimer ce coffre</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL MOT DE PASSE (inchangé fonctionnellement) */}
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
              style={styles.modalInput}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity
              style={[styles.modalBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleConfirmedAction}
              disabled={isLoading}
            >
              <Text style={styles.modalBtnText}>{isLoading ? 'Validation...' : 'Confirmer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.modalBtn, { backgroundColor: '#B71C1C' }]}
            >
              <Text style={styles.modalBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VaultDetailsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },

  /* Header */
  header: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 18, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 10 },
  airtelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  airtelBadgeText: { color: '#064e3b', fontWeight: '700', fontSize: 12 },

  vaultName: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12 },
  balanceWrap: { marginTop: 6 },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },

  progressWrap: { marginTop: 12 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 999 },
  progressBar: { height: 8, backgroundColor: '#fff', borderRadius: 999 },
  progressText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 6, fontWeight: '600' },

  /* Content */
  content: { padding: 16, paddingBottom: 32, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  cardSub: { color: '#64748b', fontSize: 12 },

  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, height: 46 },
  amountInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#0f172a' },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionPrimary: { backgroundColor: '#0ea5e9' },
  actionOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  actionDisabled: { backgroundColor: '#93c5fd' },
  actionDisabledOutline: { opacity: 0.5 },
  actionText: { color: '#fff', fontWeight: '800' },
  actionTextOutline: { color: '#0f172a', fontWeight: '800' },

  shareCard: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#e9d5ff', backgroundColor: '#faf5ff' },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f5f3ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  shareBtnText: { color: '#7c3aed', fontWeight: '700' },

  infoGrid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  infoItem: { flex: 1 },
  infoItemRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoLabel: { color: '#64748b', fontSize: 12 },
  infoValue: { color: '#0f172a', fontWeight: '800', marginTop: 2 },

  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeNeutral: { backgroundColor: '#f1f5f9' },
  badgeDanger: { backgroundColor: '#ef4444' },
  badgeOutline: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  badgeText: { fontSize: 12, fontWeight: '700' },

  activityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  activityIcon: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activityLabel: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  activitySub: { color: '#64748b', fontSize: 12 },
  activityAmount: { fontWeight: '800' },

  deleteBtn: { marginTop: 6, backgroundColor: '#ef4444', height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { color: '#fff', fontWeight: '800' },

  /* Modal */
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  modalInput: { borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 8, marginBottom: 10 },
  modalBtn: { backgroundColor: '#0ea5e9', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  modalBtnText: { color: '#fff', fontWeight: '800' },

  errorText: { color: '#dc2626', marginTop: 4, textAlign: 'center', fontWeight: '600' },
});