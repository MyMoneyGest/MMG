// VaultsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Vault {
  id: string;
  name: string;
  balance: number;
  goal?: number | undefined;
  createdAt: Date;
  type: 'standard' | 'locked';
  lockedUntil?: string | undefined;
  uid: string;
}

type SharedVault = {
  id: string;
  name: string;
  balance: number;
  target: number;
  locked?: boolean;
  unlockDate?: string;
  description: string;
  members: string[];
};

const COLORS = { bg: '#F4F6F9', 
  headerStart: '#0b132b', 
  headerEnd: '#1c2541', 
  primary: '#0f172a', 
  card: '#fff', 
  text: '#0f172a', 
  muted: '#64748b', 
  green: '#22c55e', 
  purple: '#7c3aed', 
  border: '#e5e7eb', 
  accent: '#eef2ff', 
  dashed: '#cbd5e1', 
  danger: '#ef4444', 
};

const VaultsScreen = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [vaultGoal, setVaultGoal] = useState('');
  const [lockDuration, setLockDuration] = useState('');
  const [selectedType, setSelectedType] = useState<'standard' | 'locked'>('standard');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal');

  const auth = getAuth();
  const user = auth.currentUser;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'vaults'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVaults: Vault[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        balance: doc.data().balance,
        goal: doc.data().goal ?? null,
        createdAt: doc.data().createdAt.toDate(),
        type: doc.data().type || 'standard',
        lockedUntil: doc.data().lockedUntil,
        uid: user.uid,
      }));
      setVaults(fetchedVaults);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateVault = async () => {
    if (!vaultName.trim()) return;

    const existingSameName = vaults.some(
      (v) => v.name.toLowerCase() === vaultName.trim().toLowerCase()
    );
    if (existingSameName) {
      setErrorMessage('Un coffre avec ce nom existe déjà.');
      return;
    }

    const sameTypeVaultsCount = vaults.filter((v) => v.type === selectedType).length;
    if (sameTypeVaultsCount >= 10) {
      setErrorMessage(
        'Limite atteinte : vous ne pouvez pas créer plus de 10 coffres pour ce type.'
      );
      return;
    }

    try {
      const vaultData: any = {
        name: vaultName.trim(),
        balance: 0,
        goal: vaultGoal ? parseInt(vaultGoal) : null,
        createdAt: new Date(),
        type: selectedType,
        uid: user!.uid,
      };

      if (selectedType === 'locked' && lockDuration) {
        const days = parseInt(lockDuration);
        if (!isNaN(days)) {
          const unlockDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          vaultData.lockedUntil = unlockDate.toISOString();
        }
      }

      await addDoc(collection(db, 'users', user!.uid, 'vaults'), vaultData);

      setVaultName('');
      setVaultGoal('');
      setLockDuration('');
      setSelectedType('standard');
      setModalVisible(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Erreur lors de la création du coffre :', error);
    }
  };

  const personalStandardVaults = vaults.filter((v) => v.type === 'standard');
  const personalLockedVaults = vaults.filter((v) => v.type === 'locked');

  const sharedVaults: SharedVault[] = [
    {
      id: 'sv1',
      name: 'Maison Familiale',
      balance: 350000,
      target: 1000000,
      description: 'Achat maison en famille',
      members: ['Jean K.', 'Marie K.', 'Papa K.', 'Maman K.'],
    },
    {
      id: 'sv2',
      name: 'Voyage Groupe',
      balance: 180000,
      target: 400000,
      locked: true,
      unlockDate: 'Décembre 2025',
      description: "Voyage de fin d'année - Bloqué",
      members: ['Jean K.', 'Marie K.', 'Alex T.'],
    },
  ];

  const sharedStandardVaults = sharedVaults.filter((v) => !v.locked);
  const sharedLockedVaults = sharedVaults.filter((v) => v.locked);

  const totalPersonal = vaults.reduce((s, v) => s + (v.balance || 0), 0);
  const totalShared = sharedVaults.reduce((s, v) => s + (v.balance || 0), 0);

  const renderProgress = (v: Vault) => {
    const goal = v.goal || 0;
    const pct = goal > 0 ? Math.min(100, (v.balance / goal) * 100) : 0;

    return (
      <View style={{ marginTop: 10 }}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progression</Text>
          <Text style={styles.progressValue}>
            {goal > 0
              ? `${v.balance.toLocaleString()} / ${goal.toLocaleString()} XOF`
              : `${v.balance.toLocaleString()} XOF`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        {goal > 0 && (
          <View style={styles.progressFooter}>
            <Text style={styles.progressFootText}>
              {pct.toFixed(1)} % de l'objectif atteint
            </Text>
            {v.type === 'locked' && v.lockedUntil && (
              <Text style={styles.progressFootText}>
                Déblocage : {format(new Date(v.lockedUntil), 'MMMM yyyy')}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderVaultCard = (v: Vault) => (
    <TouchableOpacity
      key={v.id}
      onPress={() => navigation.navigate('VaultDetails', { vault: v })}
      style={styles.vaultCard}
      activeOpacity={0.9}
    >
      <View style={styles.vaultHeader}>
        <View style={styles.vaultIconWrap}>
          {v.type === 'locked' ? (
            <Ionicons name="lock-closed" size={22} color="#ea580c" />
          ) : (
            <Ionicons name="shield-checkmark" size={22} color="#16a34a" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.vaultName}>{v.name}</Text>
            <View
              style={[
                styles.badge,
                v.type === 'locked' ? styles.badgeDanger : styles.badgeSecondary,
              ]}
            >
              <Text style={[styles.badgeText, v.type === 'locked' && { color: '#fff' }]}>
                {v.type === 'locked' ? 'Bloqué' : 'Standard'}
              </Text>
            </View>
          </View>
          <Text style={styles.vaultSubtitle}>
            {v.type === 'locked'
              ? 'Fonds d’épargne – Coffre bloqué'
              : 'Coffre d’épargne personnel'}
          </Text>
        </View>
      </View>

      {renderProgress(v)}

      <View style={styles.vaultFooter}>
        <Text style={styles.vaultDate}>Créé le {format(v.createdAt, 'dd/MM/yyyy')}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSharedVaultCard = (v: SharedVault) => {
    const pct = Math.min(100, (v.balance / v.target) * 100);
    const membersPreview =
      v.members.length <= 2
        ? v.members.join(', ')
        : `${v.members[0]}, ${v.members[1]} +${v.members.length - 2} autres`;

    return (
      <View key={v.id} style={[styles.vaultCard, { borderColor: '#e9d5ff' }]}>
        <View style={styles.vaultHeader}>
          <View style={[styles.vaultIconWrap, { backgroundColor: '#faf5ff' }]}>
            <Ionicons name="people" size={22} color="#7c3aed" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.vaultName}>{v.name}</Text>
              <Ionicons name="arrow-redo-outline" size={14} color="#7c3aed" />
            </View>
            <Text style={[styles.vaultSubtitle, { marginTop: 2 }]}>{v.description}</Text>
            <Text style={{ color: '#7c3aed', fontSize: 12, marginTop: 2 }}>
              {v.members.length} {v.members.length > 1 ? 'membres' : 'membre'}
            </Text>
          </View>
          <View style={{ gap: 6 }}>
            <View style={[styles.badge, { backgroundColor: v.locked ? '#ef4444' : '#e2e8f0' }]}>
              <Text style={[styles.badgeText, { color: v.locked ? '#fff' : '#0f172a' }]}>
                {v.locked ? 'Bloqué' : 'Standard'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#ede9fe' }]}>
              <Text style={[styles.badgeText, { color: '#7c3aed' }]}>Partagé</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressValue}>
              {v.balance.toLocaleString()} / {v.target.toLocaleString()} XOF
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: '#8b5cf6' }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressFootText}>{pct.toFixed(1)} % de l’objectif atteint</Text>
            {v.locked && v.unlockDate && <Text style={styles.progressFootText}>Déblocage : {v.unlockDate}</Text>}
          </View>
        </View>

        <View
          style={{
            marginTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            paddingTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Ionicons name="people-outline" size={14} color="#64748b" />
          <Text style={{ color: '#64748b', fontSize: 12 }}>{membersPreview}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Mes Coffres</Text>
              <Text style={styles.headerSubtitle}>Épargne personnelle et partagée</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerAdd} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Overviews */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: '#22c55e' }]}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#d1fae5"
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.overviewSmall}>Personnel</Text>
            <Text style={styles.overviewValue}>{totalPersonal.toLocaleString()} XOF</Text>
            <Text style={styles.overviewSmall}>{vaults.length} coffres</Text>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: '#7c3aed' }]}>
            <Ionicons
              name="people-outline"
              size={18}
              color="#ede9fe"
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.overviewSmall}>Partagé</Text>
            <Text style={styles.overviewValue}>{totalShared.toLocaleString()} XOF</Text>
            <Text style={styles.overviewSmall}>{sharedVaults.length} coffres</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'personal' && styles.tabActive]}
            onPress={() => setActiveTab('personal')}
          >
            <Ionicons
              name="person-outline"
              size={16}
              color={activeTab === 'personal' ? '#0f172a' : COLORS.muted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'personal' ? styles.tabTextActive : undefined,
              ]}
            >
              Personnel ({vaults.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'shared' && styles.tabActive]}
            onPress={() => setActiveTab('shared')}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'shared' ? '#0f172a' : COLORS.muted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'shared' ? styles.tabTextActive : undefined,
              ]}
            >
              Partagé ({sharedVaults.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lists */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : activeTab === 'personal' ? (
          <View style={{ gap: 14 }}>
            {personalStandardVaults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Coffres standards</Text>
                {personalStandardVaults.map(renderVaultCard)}
              </>
            )}

            {personalLockedVaults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Coffres bloqués</Text>
                {personalLockedVaults.map(renderVaultCard)}
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.createCard, { borderColor: '#e9d5ff' }]}
              onPress={() => navigation.navigate('CreatePersonalVaultScreen')}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Ionicons name="add" size={22} color="#7c3aed" />
                <Ionicons name="shield-checkmark" size={22} color="#7c3aed" />
              </View>
              <Text style={styles.createTitle}>Créer un coffre personnel</Text>
              <Text style={[styles.createSub, { textAlign: 'center' }]}>
                Épargnez en toute sécurité
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {sharedStandardVaults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Coffres standards</Text>
                {sharedStandardVaults.map(renderSharedVaultCard)}
              </>
            )}

            {sharedLockedVaults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Coffres bloqués</Text>
                {sharedLockedVaults.map(renderSharedVaultCard)}
              </>
            )}

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.createCard, { borderColor: '#e9d5ff' }]}
              onPress={() => navigation.navigate('CreateSharedVaultScreen')}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Ionicons name="add" size={22} color="#7c3aed" />
                <Ionicons name="people" size={22} color="#7c3aed" />
              </View>
              <Text style={styles.createTitle}>Créer un coffre partagé</Text>
              <Text style={[styles.createSub, { textAlign: 'center' }]}>
                Épargnez en famille ou entre amis
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total épargné</Text>
            <Text style={styles.statValue}>
              {(totalPersonal + totalShared).toLocaleString()} XOF
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Coffres actifs</Text>
            <Text style={styles.statValue}>
              {vaults.length + sharedVaults.length}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Objectifs</Text>
            <Text style={styles.statValue}>
              {vaults.filter((v) => (v.goal || 0) > 0 && v.balance >= (v.goal || 0)).length}{' '}
              atteints
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer un coffre</Text>
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TextInput
              placeholder="Nom du coffre"
              placeholderTextColor="#666"
              value={vaultName}
              onChangeText={setVaultName}
              style={styles.input}
            />
            <TextInput
              placeholder="Objectif (optionnel)"
              placeholderTextColor="#666"
              value={vaultGoal}
              onChangeText={setVaultGoal}
              style={styles.input}
              keyboardType="numeric"
            />

            {selectedType === 'locked' && (
              <TextInput
                placeholder="Durée de blocage (en jours)"
                placeholderTextColor="#666"
                value={lockDuration}
                onChangeText={setLockDuration}
                style={styles.input}
                keyboardType="numeric"
              />
            )}

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === 'standard' && styles.typeSelected,
                ]}
                onPress={() => setSelectedType('standard')}
              >
                <Text style={styles.typeText}>Standard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === 'locked' && styles.typeSelectedLocked,
                ]}
                onPress={() => setSelectedType('locked')}
              >
                <Text style={[styles.typeText, { color: '#7c2d12' }]}>Bloqué</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleCreateVault}>
              <Text style={styles.modalButtonText}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default VaultsScreen;

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    backgroundColor: COLORS.headerEnd,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAdd: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  overviewRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  overviewCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  overviewSmall: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center' },
  overviewValue: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 18,
    marginVertical: 2,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.muted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: COLORS.text },

  sectionTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginVertical: 6,
    color: COLORS.text,
  },

  vaultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  vaultHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  vaultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginRight: 8 },
  vaultSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 4,
  },
  badgeSecondary: { backgroundColor: '#e2fbe7' },
  badgeDanger: { backgroundColor: COLORS.danger },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  progressValue: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#22c55e',
    borderRadius: 999,
  },
  progressFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressFootText: { color: COLORS.muted, fontSize: 12 },

  vaultFooter: { marginTop: 10 },
  vaultDate: { color: COLORS.muted, fontSize: 12 },

  createCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.dashed,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    backgroundColor: '#fff',
  },
  createTitle: { marginTop: 6, fontWeight: '700', color: COLORS.text },
  createSub: { color: COLORS.muted, fontSize: 12 },

  emptyShared: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 8, fontWeight: '800', color: COLORS.text },
  emptySub: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 2 },

  statsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: { alignItems: 'center', flex: 1 },
  statLabel: { color: COLORS.muted, fontSize: 12 },
  statValue: { color: COLORS.text, fontWeight: '800', marginTop: 2 },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#00000088' },
  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10, color: COLORS.text },
  errorText: { color: COLORS.danger, marginBottom: 8 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeSelected: { backgroundColor: '#e2fbe7', borderColor: '#16a34a' },
  typeSelectedLocked: { backgroundColor: '#ffedd5', borderColor: '#fb923c' },
  typeText: { fontWeight: '700', color: COLORS.text },

  modalButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  modalButtonText: { color: '#fff', fontWeight: '800' },
  cancelText: { color: COLORS.danger, marginTop: 10, textAlign: 'center', fontWeight: '700' },
  badgeText: { fontWeight: '700' },
});