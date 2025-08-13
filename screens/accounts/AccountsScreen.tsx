import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Accounts'>;

type Account = {
  id: string;
  type: 'airtel' | 'orange' | 'banque';
  name: string;
  balance: number;
  currency: 'XOF' | 'XAF' | 'EUR' | 'USD' | 'GHS';
  number: string;
};

type CountryCode = 'CI' | 'GA' | 'FR' | 'US' | 'GH';

const COUNTRIES: Record<
  CountryCode,
  { name: string; flag: string; currency: string; symbol: string; providers: string[] }
> = {
  CI: { name: "Côte d'Ivoire", flag: 'CI', currency: 'XOF', symbol: 'XOF', providers: ['Orange CI', 'MTN CI', 'Moov Africa'] },
  GA: { name: 'Gabon', flag: 'GA', currency: 'XAF', symbol: 'XAF', providers: ['Airtel GA', 'Moov GA'] },
  FR: { name: 'France', flag: 'FR', currency: 'EUR', symbol: '€', providers: ['BNP', 'Société Générale'] },
  US: { name: 'United States', flag: 'US', currency: 'USD', symbol: '$', providers: ['Chase', 'BoA'] },
  GH: { name: 'Ghana', flag: 'GH', currency: 'GHS', symbol: '₵', providers: ['MTN Ghana', 'AirtelTigo'] },
};

const DATA: Record<CountryCode, Account[]> = {
  CI: [
    { id: 'airtel_ci_1', type: 'airtel', name: 'Airtel Money CI', balance: 125000, currency: 'XOF', number: '+225 07 12 34 56 78' },
    { id: 'orange_ci_1', type: 'orange', name: 'Orange Money CI', balance: 89500, currency: 'XOF', number: '+225 05 98 76 54 32' },
    { id: 'bank_ci_1', type: 'banque', name: 'Banque Atlantic', balance: 450000, currency: 'XOF', number: 'CI93 B062 3456 7890 1234 5678 90' },
  ],
  GA: [
    { id: 'airtel_ga_1', type: 'airtel', name: 'Airtel Money GA', balance: 75000, currency: 'XAF', number: '+241 07 12 34 56 78' },
    { id: 'orange_ga_1', type: 'orange', name: 'Moov Money GA', balance: 120000, currency: 'XAF', number: '+241 06 98 76 54 32' },
  ],
  FR: [{ id: 'bank_fr_1', type: 'banque', name: 'BNP Paribas', balance: 2500, currency: 'EUR', number: 'FR14 2004 1010 0505 0001 3M02 606' }],
  US: [{ id: 'bank_us_1', type: 'banque', name: 'Chase Bank', balance: 3200, currency: 'USD', number: '1234567890' }],
  GH: [{ id: 'mtn_gh_1', type: 'airtel', name: 'MTN Mobile Money', balance: 850, currency: 'GHS', number: '+233 24 123 4567' }],
};

const AccountsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [country, setCountry] = useState<CountryCode>('CI');
  const [showBalance, setShowBalance] = useState(true);

  // MODALE "Ajouter un compte"
  const [addOpen, setAddOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [newType, setNewType] = useState<'airtel' | 'orange' | 'banque'>('airtel');
  const [newNumber, setNewNumber] = useState('');
  const [newPin, setNewPin] = useState('');

  const countryInfo = COUNTRIES[country];
  const accounts = useMemo(() => DATA[country] ?? [], [country]);

  const formatAmount = (n: number, cur: string) =>
    showBalance ? `${n.toLocaleString('fr-FR')} ${cur}` : '•••••••';

  const onSelectAccount = (acc: Account) => {
    if (acc.type !== 'banque') navigation.navigate('AirtelMoney');
    else alert('Vue Compte bancaire à venir');
  };

  const resetAddForm = () => {
    setNewType('airtel');
    setNewNumber('');
    setNewPin('');
    setTypeOpen(false);
  };

  const handleAdd = () => {
    // Ici tu brancheras Firestore si besoin.
    setAddOpen(false);
    resetAddForm();
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#0b1531', '#111c3d', '#10224e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Choisir un compte</Text>
            <Text style={styles.headerSubtitle}>Sélectionnez votre compte principal</Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => setShowBalance((s) => !s)}>
            <Ionicons name={showBalance ? 'eye-off-outline' : 'eye-outline'} size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Pays / Région */}
        <View style={styles.regionBox}>
          <View style={styles.regionRow}>
            <Ionicons name="location-outline" size={16} color="#bcd1ff" />
            <Text style={styles.regionLabel}>Pays / Région</Text>
          </View>

          <View style={styles.chipsRow}>
            {(['CI', 'GA', 'FR', 'US', 'GH'] as CountryCode[]).map((c) => (
              <Pressable key={c} onPress={() => setCountry(c)} style={[styles.chip, country === c && styles.chipActive]}>
                <Text style={[styles.chipText, country === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
            <View style={[styles.chip, styles.currencyPill]}>
              <Text style={styles.currencyText}>{countryInfo.currency}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte pays */}
        <View style={styles.countryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.countryAvatar}>
              <Text style={styles.countryAvatarText}>{country}</Text>
            </View>
            <View>
              <Text style={styles.countryName}>{countryInfo.name}</Text>
              <Text style={styles.countryMeta}>
                <Ionicons name="cash-outline" size={14} color="#64748b" /> Devise: {countryInfo.currency} ({countryInfo.symbol})
              </Text>
            </View>
          </View>
          <View style={styles.providersBadge}>
            <Text style={styles.providersBadgeText}>{countryInfo.providers.length} opérateurs</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="albums-outline" size={18} color="#0f172a" />
            <Text style={styles.sectionTitle}>Comptes disponibles</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Ionicons name="add" size={16} color="#0f172a" />
            <Text style={styles.addBtnText}>Ajouter</Text>
          </Pressable>
        </View>

        {/* Comptes */}
        {accounts.map((acc) => (
          <Pressable key={acc.id} onPress={() => onSelectAccount(acc)} style={{ marginBottom: 14 }}>
            {/* Bande de couleur */}
            <LinearGradient
              colors={
                acc.type === 'banque'
                  ? ['#3b82f6', '#2563eb', '#1d4ed8']
                  : acc.type === 'airtel'
                  ? ['#ef4444', '#dc2626', '#b91c1c']
                  : ['#f97316', '#ea580c', '#c2410c']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.accountHead, { borderTopLeftRadius: 14, borderTopRightRadius: 14 }]}
            >
              <View style={styles.accountHeadRow}>
                <Ionicons
                  name={acc.type === 'banque' ? 'business-outline' : acc.type === 'airtel' ? 'wallet-outline' : 'call-outline'}
                  size={22}
                  color="#fff"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountSub}>{acc.type === 'banque' ? 'Compte Bancaire' : 'Mobile Money'}</Text>
                </View>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>{acc.currency}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.accountBody}>
              <View>
                <Text style={styles.bodyLabel}>
                  <Ionicons name="cash-outline" size={14} color="#475569" /> Solde disponible
                </Text>
                <Text style={styles.balance}>{formatAmount(acc.balance, acc.currency)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bodyLabel}>
                  <Ionicons name="phone-portrait-outline" size={14} color="#475569" /> Numéro
                </Text>
                <Text style={styles.numberPill}>{acc.number}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {/* Opérateurs */}
        <View style={styles.opsCard}>
          <View style={styles.opsHeader}>
            <Ionicons name="radio-outline" size={18} color="#0f172a" />
            <Text style={styles.opsTitle}>Opérateurs disponibles</Text>
          </View>
          <View style={styles.opsChips}>
            {countryInfo.providers.map((p) => (
              <View key={p} style={styles.opChip}>
                <Text style={styles.opChipText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conseil */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>💡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Conseil MyMoneyGest</Text>
            <Text style={styles.tipText}>
              Vous pouvez gérer plusieurs comptes de différents pays. Les transferts entre devises
              sont automatiquement convertis aux taux du marché.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODALE AJOUTER UN COMPTE */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un compte</Text>
                <Pressable onPress={() => setAddOpen(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={18} color="#111827" />
                </Pressable>
              </View>
              <Text style={styles.modalSubtitle}>
                Connectez un nouveau compte mobile money ou bancaire à votre profil MyMoneyGest.
              </Text>

              {/* Type de compte (pseudo-select) */}
              <Text style={styles.fieldLabel}>Type de compte</Text>
              <Pressable style={styles.select} onPress={() => setTypeOpen((v) => !v)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons
                    name={newType === 'banque' ? 'business-outline' : newType === 'airtel' ? 'wallet-outline' : 'call-outline'}
                    size={16}
                    color="#111827"
                  />
                  <Text style={styles.selectValue}>
                    {newType === 'banque' ? 'Compte bancaire' : newType === 'airtel' ? 'Mobile Money' : 'Opérateur Mobile'}
                  </Text>
                </View>
                <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
              </Pressable>
              {typeOpen && (
                <View style={styles.selectList}>
                  {(['airtel', 'orange', 'banque'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => {
                        setNewType(t);
                        setTypeOpen(false);
                      }}
                      style={styles.selectItem}
                    >
                      <Ionicons
                        name={t === 'banque' ? 'business-outline' : t === 'airtel' ? 'wallet-outline' : 'call-outline'}
                        size={16}
                        color="#111827"
                      />
                      <Text style={styles.selectItemText}>
                        {t === 'banque' ? 'Compte bancaire' : t === 'airtel' ? 'Mobile Money' : 'Opérateur Mobile'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Numéro de compte */}
              <Text style={styles.fieldLabel}>Numéro de compte</Text>
              <TextInput
                style={styles.input}
                placeholder={newType === 'banque' ? 'IBAN ou numéro de compte' : 'Numéro de téléphone'}
                placeholderTextColor="#9ca3af"
                keyboardType={newType === 'banque' ? 'default' : 'phone-pad'}
                value={newNumber}
                onChangeText={setNewNumber}
              />

              {/* PIN */}
              <Text style={styles.fieldLabel}>Code PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                keyboardType="number-pad"
                value={newPin}
                onChangeText={setNewPin}
                maxLength={6}
              />

              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.primaryBtnText}>Ajouter le compte</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AccountsScreen;

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2ff' },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  regionBox: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  regionLabel: { color: '#c7d2fe', fontSize: 12, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipActive: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  chipText: { color: '#e5e7eb', fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#0f172a' },
  currencyPill: { backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.25)' },
  currencyText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  content: { padding: 16, paddingBottom: 28 },

  countryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  countryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryAvatarText: { fontWeight: '800', color: '#0f172a' },
  countryName: { fontWeight: '800', color: '#0f172a' },
  countryMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  providersBadge: { backgroundColor: '#1d4ed8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  providersBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  sectionHeader: { marginTop: 6, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '800', color: '#0f172a' },
  addBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  addBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },

  accountHead: { padding: 14 },
  accountHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accountName: { color: '#fff', fontWeight: '800' },
  accountSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  currencyBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999 },
  currencyBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  accountBody: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bodyLabel: { color: '#475569', fontSize: 12, fontWeight: '700' },
  balance: { marginTop: 4, fontSize: 24, fontWeight: '900', color: '#0f172a' },
  numberPill: {
    marginTop: 4,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },

  opsCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  opsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  opsTitle: { fontWeight: '800', color: '#0f172a' },
  opsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  opChipText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },

  tipCard: { marginTop: 12, backgroundColor: '#eef2ff', borderColor: '#c7d2fe', borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12 },
  tipIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center' },
  tipTitle: { color: '#1e40af', fontWeight: '800', fontSize: 13 },
  tipText: { color: '#1e3a8a', fontSize: 12, marginTop: 2 },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.55)',
    padding: 16,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: { color: '#475569', fontSize: 13, marginTop: 6, marginBottom: 12 },

  fieldLabel: { color: '#0f172a', fontWeight: '700', fontSize: 13, marginTop: 10, marginBottom: 6 },
  select: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectValue: { color: '#111827', fontWeight: '600' },
  selectList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  selectItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectItemText: { color: '#111827', fontWeight: '600' },

  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    color: '#111827',
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: '#0b1022',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
});