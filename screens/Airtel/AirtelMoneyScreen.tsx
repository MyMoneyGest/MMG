// AirtelMoneyScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { Bell } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'AirtelMoney'>;

type RecentTx = {
  id: string;
  type: 'Virement émis' | 'Virement reçu';
  amount: number;
  date: string; // ISO
  reference?: string;
  sender?: string;
  receiver?: string;
};

const AirtelMoneyScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [username, setUsername] = useState('');
  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [airtelBalance, setAirtelBalance] = useState<number | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // anciens modaux conservés (logique inchangée)
  const [showOperations, setShowOperations] = useState(false);
  const [showVaults, setShowVaults] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);

  const insets = useSafeAreaInsets();

  // ——— Firestore: profil + solde + 3 dernières
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUsername(currentUser.displayName || 'Utilisateur');

    // Solde Airtel
    const airtelRef = doc(db, 'users', currentUser.uid, 'linkedAccounts', 'airtel');
    const unsubBalance = onSnapshot(airtelRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setAirtelBalance(Number(data.airtelBalance ?? 0));
      }
    });

    // 3 dernières transactions
    const txCol = collection(
      db,
      'users',
      currentUser.uid,
      'linkedAccounts',
      'airtel',
      'transactions'
    );
    const q3 = query(txCol, orderBy('timestamp', 'desc'), fsLimit(3));
    const unsubRecent = onSnapshot(q3, (snap) => {
      const items: RecentTx[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const isCredit = data.direction === 'credit';

        const ts = data.timestamp?.toDate
          ? data.timestamp.toDate()
          : data.timestamp
          ? new Date(data.timestamp)
          : new Date();

        return {
          id: d.id,
          type: isCredit ? 'Virement reçu' : 'Virement émis',
          amount: Number(data.amount ?? 0),
          date: ts.toISOString(),
          reference: data.reference ?? data.mainTransactionId ?? d.id,
          sender: data.fromName ?? data.from,
          receiver: data.toName ?? data.to,
        };
      });
      setRecentTx(items);
    });

    return () => {
      unsubBalance();
      unsubRecent();
    };
  }, []);

  // ——— Firestore: notifications non lues
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    let unsubOpened: (() => void) | undefined;
    let unsubRead: (() => void) | undefined;
    let disposed = false;

    (async () => {
      try {
        const uSnap = await getDoc(doc(db, 'users', currentUser.uid));
        const u = uSnap.data() || {};
        const notifCol =
          u?.type === 'entreprise' && u?.entrepriseId
            ? collection(db, 'entreprises', u.entrepriseId, 'notifications')
            : collection(db, 'users', currentUser.uid, 'notifications');

        let openedCount = 0;
        let legacyCount = 0;

        const recalc = () => {
          if (disposed) return;
          setHasUnread(openedCount > 0 || legacyCount > 0);
        };

        unsubOpened = onSnapshot(
          query(notifCol, where('opened', '==', false)),
          (snap) => {
            openedCount = snap.size;
            recalc();
          }
        );

        unsubRead = onSnapshot(
          query(notifCol, where('read', '==', false)),
          (snap) => {
            legacyCount = snap.size;
            recalc();
          }
        );
      } catch {
        setHasUnread(false);
      }
    })();

    return () => {
      disposed = true;
      if (unsubOpened) unsubOpened();
      if (unsubRead) unsubRead();
    };
  }, []);

  // ——— Navigation helpers (inchangés)
  const handleNavigateToAirtelMoneyAllTransactions = () => {
    navigation.navigate('AirtelMoneyAllTransactions');
  };
  const handleNavigateToVaults = () => navigation.navigate('VaultsScreen');
  const handleNavigateToSharedVaults = () => navigation.navigate('SharedVaultsScreen');
  const handleNavigateToBeneficiaries = () => navigation.navigate('AirtelBeneficiairesScreen');
  const handleNavigateToSendMoney = () => navigation.navigate('AirtelSendMoneyScreen');
  const handleNavigateToRequestPayment = () => navigation.navigate('RequestsHubScreen');
  const handleNavigateToBudgetMensuel = () => navigation.navigate('BudgetMensuelScreen');
  const handleNavigateToSupport = () => navigation.navigate('AirtelSupportScreen');
  const handleNavigateToStatements = () => navigation.navigate('StatementsScreen');
  const handleNavigateToMonthlyActivity = () => navigation.navigate('MonthlyActivityScreen');
  const handleNavigateToAirtelRecharge = () => navigation.navigate('AirtelRechargeScreen');
  const handleNavigateToAirtelRetirer = () => navigation.navigate('AirtelWithdrawScreen');

  // ——— UI
  return (
    <LinearGradient colors={['#EEF2FF', '#F1F5F9']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* HEADER (Figma) */}
          <LinearGradient
            colors={['#0f172a', '#1f2937']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGrad}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerTitleRow}>
                <View style={styles.appIcon}>
                  <Ionicons name="apps" size={18} color="#fff" />
                </View>
                <Text style={styles.appTitle}>Airtel Money</Text>
                <View style={styles.countryPill}>
                  <Text style={styles.countryDot}>🌍</Text>
                  <Text style={styles.countryText}>GA</Text>
                </View>
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('NotificationsScreen')}
                  style={styles.iconBtn}
                >
                  <Bell size={18} color="#fff" />
                  {hasUnread && <View style={styles.notifDot} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Profile')}
                  style={styles.iconBtn}
                >
                  <Ionicons name="person-circle-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Carte solde + œil */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceLeft}>
                <View style={styles.balancePill}>
                  <Ionicons name="cash-outline" size={16} color="#1e293b" />
                  <Text style={styles.balancePillText}>Solde disponible</Text>
                </View>
                <Text style={styles.balanceValueBig}>
                  {showBalance
                    ? `${airtelBalance !== null ? airtelBalance.toLocaleString() : '—'} XAF`
                    : '••••••••'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowBalance((s) => !s)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#0f172a"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Actions rapides */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="flash-outline" size={16} color="#0f172a" />
                  <Text style={styles.sectionTitle}>Actions rapides</Text>
                </View>
                <View style={styles.badgeSoft}>
                  <Ionicons name="sparkles-outline" size={12} color="#a16207" />
                  <Text style={styles.badgeSoftText}>Raccourcis</Text>
                </View>
              </View>

              <View style={styles.quickGrid}>
                {/* Ajouter au coffre → On réutilise Recharge (ajout) */}
                <TouchableOpacity
                  onPress={handleNavigateToAirtelRecharge}
                  style={[styles.quickItem, { shadowColor: '#059669' }]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.quickIcon, { backgroundColor: '#059669' }]}>
                    <Ionicons name="add-outline" size={20} color="#fff" />
                  </View>
                  <Text style={styles.quickLabel}>Ajouter</Text>
                  <Text style={styles.quickSub}>au coffre</Text>
                </TouchableOpacity>

                {/* Retirer */}
                <TouchableOpacity
                  onPress={handleNavigateToAirtelRetirer}
                  style={[styles.quickItem, { shadowColor: '#EA580C' }]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.quickIcon, { backgroundColor: '#EA580C' }]}>
                    <Ionicons name="remove-outline" size={20} color="#fff" />
                  </View>
                  <Text style={styles.quickLabel}>Retirer</Text>
                  <Text style={styles.quickSub}>du coffre</Text>
                </TouchableOpacity>

                {/* Recharge mobile */}
                <TouchableOpacity
                  onPress={handleNavigateToAirtelRecharge}
                  style={[styles.quickItem, { shadowColor: '#2563EB' }]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.quickIcon, { backgroundColor: '#2563EB' }]}>
                    <Ionicons name="call-outline" size={18} color="#fff" />
                  </View>
                  <Text style={styles.quickLabel}>Recharge</Text>
                  <Text style={styles.quickSub}>mobile</Text>
                </TouchableOpacity>

                {/* Dépenses du mois */}
                <TouchableOpacity
                  onPress={handleNavigateToBudgetMensuel}
                  style={[styles.quickItem, { shadowColor: '#DC2626' }]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.quickIcon, { backgroundColor: '#DC2626' }]}>
                    <Ionicons name="trending-down-outline" size={18} color="#fff" />
                  </View>
                  <Text style={styles.quickLabel}>Dépenses</Text>
                  <Text style={styles.quickSub}>du mois</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tipLine}>
                <Ionicons name="bulb-outline" size={14} color="#0f172a" />
                <Text style={styles.tipText}>
                  Personnalisez vos raccourcis dans les paramètres
                </Text>
              </View>
            </View>

            {/* Services principaux */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="grid-outline" size={16} color="#0f172a" />
                  <Text style={styles.sectionTitle}>Services principaux</Text>
                </View>
              </View>

              <View style={styles.servicesGrid}>
                <TouchableOpacity
                  onPress={handleNavigateToBeneficiaries}
                  style={[styles.serviceCard, styles.serviceSoftPurple]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="people-outline" size={20} color="#6D28D9" />
                  </View>
                  <Text style={styles.serviceTitle}>Bénéficiaires</Text>
                  <Text style={styles.serviceDesc}>Gérer vos contacts de confiance</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('OperationsScreen')}
                  style={[styles.serviceCard, styles.serviceSoftSlate]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: '#F1F5F9' }]}>
                    <MaterialIcons name="compare-arrows" size={20} color="#0F172A" />
                  </View>
                  <Text style={styles.serviceTitle}>Opérations</Text>
                  <Text style={styles.serviceDesc}>Transferts et paiements</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('VaultsScreen')}
                  style={[styles.serviceCard, styles.serviceSoftIndigo]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#4338CA" />
                  </View>
                  <Text style={styles.serviceTitle}>Coffres</Text>
                  <Text style={styles.serviceDesc}>Épargne collaborative sécurisée</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNavigateToBudgetMensuel}
                  style={[styles.serviceCard, styles.serviceSoftAmber]}
                  activeOpacity={0.9}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="bar-chart-outline" size={20} color="#B45309" />
                  </View>
                  <Text style={styles.serviceTitle}>Budget</Text>
                  <Text style={styles.serviceDesc}>Gestion financière intelligente</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transactions récentes */}
            <View style={[styles.sectionBlock, { marginBottom: 8 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="pulse-outline" size={16} color="#0f172a" />
                  <Text style={styles.sectionTitle}>Transactions récentes</Text>
                </View>
                <TouchableOpacity onPress={handleNavigateToAirtelMoneyAllTransactions}>
                  <Text style={styles.linkSeeAll}>Voir tout</Text>
                </TouchableOpacity>
              </View>

              {recentTx.map((item) => {
                const isReceived = item.type === 'Virement reçu';
                const amountText = `${isReceived ? '+' : ''}${item.amount.toLocaleString()} XAF`;

                return (
                  <View key={item.reference ?? item.id} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txAvatar,
                          { backgroundColor: isReceived ? '#DCFCE7' : '#FEE2E2' },
                        ]}
                      >
                        {isReceived ? (
                          <Ionicons name="download-outline" size={18} color="#16A34A" />
                        ) : (
                          <Ionicons name="send-outline" size={18} color="#DC2626" />
                        )}
                      </View>
                      <View>
                        <Text style={styles.txType}>{item.type}</Text>
                        <Text style={styles.txMeta}>
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isReceived ? '#16A34A' : '#B91C1C' },
                        ]}
                      >
                        {amountText}
                      </Text>
                      <Text style={styles.txRef}>Ref. {item.reference ?? item.id}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Navigation & Aide (raccourci) */}
            <View style={{ height: 12 }} />

            {/* Anciennes feuilles "modales" conservées (logique existante) */}
            {showVaults && (
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowVaults(false)}
                >
                  <Text style={styles.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToVaults}>
                  <Ionicons name="wallet" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mes coffres</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToSharedVaults}>
                  <Ionicons name="wallet" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mes coffres partagés</Text>
                </TouchableOpacity>
              </View>
            )}

            {showOperations && (
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowOperations(false)}
                >
                  <Text style={styles.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToSendMoney}>
                  <MaterialIcons name="send" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Envoyer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToRequestPayment}>
                  <FontAwesome name="money" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Demander</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToAirtelRecharge}>
                  <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Recharger</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToAirtelRetirer}>
                  <FontAwesome5 name="money-bill-wave" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Retirer</Text>
                </TouchableOpacity>
              </View>
            )}

            {showManagement && (
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowManagement(false)}
                >
                  <Text style={styles.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleNavigateToMonthlyActivity}
                >
                  <Ionicons name="stats-chart" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Activité mensuelle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleNavigateToStatements}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Voir mes relevés</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleNavigateToBudgetMensuel}
                >
                  <Ionicons name="pie-chart" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mon budget</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToSupport}>
                  <Ionicons name="people" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Support</Text>
                </TouchableOpacity>
              </View>
            )}

            {showBeneficiaries && (
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowBeneficiaries(false)}
                >
                  <Text style={styles.modalCloseText}>Fermer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNavigateToBeneficiaries} style={styles.actionButton}>
                  <Ionicons name="folder" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mes bénéficiaires</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AirtelMoneyScreen;

// ——— Styles inspirés Figma
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // Header
  headerGrad: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countryDot: { fontSize: 12 },
  countryText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Carte solde
  balanceCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: { gap: 8 },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  balancePillText: { color: '#1e293b', fontWeight: '700' },
  balanceValueBig: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Contenu
  scrollContent: { padding: 16 },

  // Sections
  sectionBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  badgeSoft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeSoftText: { color: '#a16207', fontWeight: '700', fontSize: 12 },

  // Quick actions
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  quickSub: { fontSize: 11, color: '#64748b' },
  tipLine: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 12,
  },
  tipText: { color: '#0f172a', fontSize: 12 },

  // Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceSoftPurple: { backgroundColor: '#F5F3FF' },
  serviceSoftSlate: { backgroundColor: '#F8FAFC' },
  serviceSoftIndigo: { backgroundColor: '#EEF2FF' },
  serviceSoftAmber: { backgroundColor: '#FFFBEB' },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceTitle: { fontWeight: '800', color: '#0f172a' },
  serviceDesc: { color: '#475569', fontSize: 12, marginTop: 2 },

  // Transactions
  linkSeeAll: { color: '#0f172a', fontWeight: '700' },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFF2F5',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txType: { fontWeight: '800', color: '#0f172a', fontSize: 13 },
  txMeta: { color: '#64748b', fontSize: 12 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '900', fontSize: 14 },
  txRef: { color: '#64748b', fontSize: 11 },

  // Modales héritées
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffffee',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1000,
  },
  modalClose: { alignSelf: 'flex-end', marginBottom: 10 },
  modalCloseText: { color: '#0f172a', fontWeight: '800' },
  actionButton: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  buttonText: { color: '#fff', fontWeight: '800' },
});