// SharedVaultDetailScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

type VaultMember = {
  uid: string;
  role: 'admin' | 'editor' | 'viewer';
  displayName?: string;
  email?: string;
  joinedAt?: Timestamp;
  contributions?: number;
  lastActivity?: string;
};

const SharedVaultDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const vaultId = route?.params?.vaultId;
  const user = auth.currentUser;

  const [vault, setVault] = useState<any>(null);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [airtelBalance, setAirtelBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'members'>('overview');

  useEffect(() => {
    if (!vaultId || !user) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVault(), fetchMembers(), fetchAirtelBalance()]);
      setLoading(false);
    };

    loadData();
  }, [vaultId]);

  const fetchVault = async () => {
    try {
      const snap = await getDoc(doc(db, 'sharedVaults', vaultId));
      if (snap.exists()) setVault(snap.data());
      else Alert.alert('Erreur', 'Coffre introuvable.');
    } catch (e) {
      console.error('Erreur coffre :', e);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'sharedVaults', vaultId, 'members'));
      const membersData: VaultMember[] = [];

      for (const docSnap of membersSnapshot.docs) {
        const memberUid = docSnap.id;
        const memberData = docSnap.data() as any;
        let displayName = memberUid;

        try {
          const userSnap = await getDoc(doc(db, 'users', memberUid));
          if (userSnap.exists()) {
            const userData = userSnap.data() as any;
            displayName = userData.fullName || userData.phoneNumber || memberUid;
          }
        } catch {}

        membersData.push({
          uid: memberUid,
          role: memberData.role,
          displayName,
          email: memberData.email,
          joinedAt: memberData.joinedAt,
          contributions: memberData.contributions ?? 0,
          lastActivity: memberData.lastActivity ?? '',
        });

        if (user && memberUid === user.uid) {
          setUserRole(memberData.role);
        }
      }

      setMembers(membersData);
    } catch (e) {
      console.error('Erreur membres :', e);
    }
  };

  const fetchAirtelBalance = async () => {
    if (!auth.currentUser) return;
    try {
      const balSnap = await getDoc(doc(db, 'airtelBalances', auth.currentUser.uid));
      if (balSnap.exists()) {
        setAirtelBalance(balSnap.data().balance || 0);
      }
    } catch (e) {
      console.warn('Erreur de récupération du solde Airtel:', e);
    }
  };

  const getRoleLabel = (role: VaultMember['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'editor':
        return 'Contributeur';
      case 'viewer':
        return 'Observateur';
      default:
        return role;
    }
  };

  const formatDate = (ts?: Timestamp) =>
    ts?.toDate ? `Il y a ${Math.max(1, Math.floor((Date.now() - ts.toDate().getTime()) / (24*3600*1000)))} jour(s)` : '';

  const progress = useMemo(() => {
    if (!vault?.target || vault.target <= 0) return 0;
    return Math.min(100, (Number(vault.balance || 0) / Number(vault.target)) * 100);
  }, [vault]);

  const canManageFunds = userRole === 'admin' || userRole === 'editor';
  const canInvite = userRole === 'admin';

  if (!vaultId) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>⚠️ vaultId est manquant</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6D28D9" />
        <Text style={{ marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER dégradé */}
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{vault?.name || 'Coffre partagé'}</Text>
        {vault?.description ? (
          <Text style={styles.headerSub}>{vault.description}</Text>
        ) : null}

        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={styles.sousTitre}>Solde actuel</Text>
          <Text style={styles.grandSolde}>{(vault?.balance || 0).toLocaleString()} XOF</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}% de l'objectif atteint</Text>
        </View>

        {/* Onglets */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setTab('overview')}
            style={[styles.tabBtn, tab === 'overview' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>Aperçu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('members')}
            style={[styles.tabBtn, tab === 'members' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'members' && styles.tabTextActive]}>
              Membres ({members.length})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'overview' ? (
          <>
            {/* Actions principales */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBig, styles.btnPrimary]}
                onPress={() =>
                  canManageFunds
                    ? navigation.navigate('AddSharedVaultMoneyScreen', { vaultId })
                    : Alert.alert('Action non autorisée', 'Rôle requis : Contributeur ou Administrateur.')
                }
              >
                <Text style={styles.actionBigIcon}>＋</Text>
                <Text style={styles.actionBigText}>Ajouter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBig, styles.btnOutline]}
                onPress={() =>
                  canManageFunds
                    ? navigation.navigate('AddSharedVaultMoneyScreen', { vaultId, mode: 'withdraw' })
                    : Alert.alert('Action non autorisée', 'Rôle requis : Contributeur ou Administrateur.')
                }
              >
                <Text style={[styles.actionBigIcon, { color: '#1F2937' }]}>—</Text>
                <Text style={[styles.actionBigText, { color: '#111827' }]}>Retirer</Text>
              </TouchableOpacity>
            </View>

            {/* Infos du coffre */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations du coffre</Text>

              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.muted}>Objectif</Text>
                  <Text style={styles.value}>{(vault?.target || 0).toLocaleString()} XOF</Text>
                </View>
                <View>
                  <Text style={styles.muted}>Restant</Text>
                  <Text style={styles.value}>
                    {Math.max(0, Number(vault?.target || 0) - Number(vault?.balance || 0)).toLocaleString()} XOF
                  </Text>
                </View>
              </View>

              <View style={[styles.rowBetween, { marginTop: 16 }]}>
                <View style={styles.badgeRow}>
                  <Text style={styles.muted}>Type de coffre</Text>
                  <View style={[styles.badge, { backgroundColor: '#EEF2FF' }]}>
                    <Text style={[styles.badgeText, { color: '#3730A3' }]}>Standard</Text>
                  </View>
                </View>
                <View style={styles.badgeRow}>
                  <Text style={styles.muted}>Mode</Text>
                  <View style={[styles.badge, { backgroundColor: '#F5F3FF' }]}>
                    <Text style={[styles.badgeText, { color: '#6D28D9' }]}>Partagé</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Activité récente (placeholder UX) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activité récente</Text>

              <View style={styles.activityItem}>
                <View style={[styles.bullet, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Ajout par Jean K.</Text>
                  <Text style={styles.activitySub}>Il y a 2 jours</Text>
                </View>
                <Text style={[styles.amount, { color: '#059669' }]}>+25 000 XOF</Text>
              </View>

              <View style={styles.activityItem}>
                <View style={[styles.bullet, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Ajout par Marie K. (Administrateur)</Text>
                  <Text style={styles.activitySub}>Il y a 5 jours</Text>
                </View>
                <Text style={[styles.amount, { color: '#059669' }]}>+50 000 XOF</Text>
              </View>

              <View style={styles.activityItem}>
                <View style={[styles.bullet, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>Retrait par Vous</Text>
                  <Text style={styles.activitySub}>Il y a 1 semaine</Text>
                </View>
                <Text style={[styles.amount, { color: '#DC2626' }]}>10 000 XOF</Text>
              </View>
            </View>

            {/* Carte solde Airtel utilisateur */}
            <View style={styles.cardMuted}>
              <Text style={styles.muted}>Votre solde Airtel</Text>
              <Text style={styles.value}>{airtelBalance.toLocaleString()} XOF</Text>
            </View>
          </>
        ) : (
          <>
            {/* Bouton Inviter */}
            <TouchableOpacity
              style={[styles.inviteBtn, !canInvite && { opacity: 0.6 }]}
              disabled={!canInvite}
              onPress={() =>
                canInvite
                  ? navigation.navigate('AddSharedVaultMemberScreen', { vaultId })
                  : Alert.alert('Action non autorisée', 'Rôle requis : Administrateur.')
              }
            >
              <Text style={styles.inviteText}>👤 Inviter un membre</Text>
            </TouchableOpacity>

            {/* Liste des membres */}
            {members.map((m) => (
              <View key={m.uid} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>
                    {((m.displayName || m.email || m.uid) as string)
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.displayName ?? m.email ?? m.uid}</Text>
                  <Text style={styles.memberMeta}>
                    Contributions: {(m.contributions || 0).toLocaleString()} XOF
                  </Text>
                  {!!m.joinedAt && <Text style={styles.memberMeta}>Dernière activité: {formatDate(m.joinedAt)}</Text>}
                </View>

                <View style={[styles.rolePill, rolePillStyle[m.role]]}>
                  <Text style={[styles.rolePillTxt, rolePillTxtStyle[m.role]]}>{getRoleLabel(m.role)}</Text>
                </View>
              </View>
            ))}

            {/* Légende des rôles */}
            <View style={styles.cardMuted}>
              <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Rôles et permissions</Text>
              <Text style={styles.legendLine}>
                <Text style={styles.legendBold}>Propriétaire</Text> : Contrôle total du coffre
              </Text>
              <Text style={styles.legendLine}>
                <Text style={styles.legendBold}>Administrateur</Text> : Gestion des membres et des fonds
              </Text>
              <Text style={styles.legendLine}>
                <Text style={styles.legendBold}>Contributeur</Text> : Peut ajouter et retirer des fonds
              </Text>
              <Text style={styles.legendLine}>
                <Text style={styles.legendBold}>Observateur</Text> : Consultation uniquement
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SharedVaultDetailScreen;

/* ---------- styles ---------- */

const rolePillStyle = StyleSheet.create({
  admin: { backgroundColor: '#DBEAFE' },
  editor: { backgroundColor: '#DCFCE7' },
  viewer: { backgroundColor: '#F3F4F6' },
});

const rolePillTxtStyle = StyleSheet.create({
  admin: { color: '#1D4ED8' },
  editor: { color: '#059669' },
  viewer: { color: '#374151' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { padding: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  sousTitre: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  grandSolde: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },

  progressTrack: { height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 10, overflow: 'hidden' },
  progressBar: { height: 6, backgroundColor: '#fff', borderRadius: 999 },
  progressText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 },

  tabs: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#ffffff' },
  tabText: { color: '#EDE9FE', fontWeight: '600' },
  tabTextActive: { color: '#6D28D9' },

  body: { padding: 16, gap: 14 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBig: { flex: 1, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionBigIcon: { fontSize: 22, lineHeight: 22, color: '#fff', marginBottom: 4 },
  actionBigText: { color: '#fff', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#10B981' },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 1 },
  cardMuted: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14 },
  cardTitle: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: '#6B7280', fontSize: 12 },
  value: { color: '#111827', fontWeight: '700', marginTop: 2 },

  badgeRow: {},
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start', marginTop: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  bullet: { width: 10, height: 10, borderRadius: 999 },
  activityTitle: { color: '#111827', fontWeight: '600' },
  activitySub: { color: '#6B7280', fontSize: 12 },
  amount: { fontWeight: '800' },

  inviteBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteText: { fontWeight: '700', color: '#111827' },

  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatar: { width: 36, height: 36, borderRadius: 999, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#5B21B6', fontWeight: '800' },
  memberName: { fontWeight: '700', color: '#111827' },
  memberMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },

  rolePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillTxt: { fontSize: 12, fontWeight: '800' },

  legendLine: { color: '#374151', marginTop: 4 },
  legendBold: { fontWeight: '700', color: '#111827' },
});