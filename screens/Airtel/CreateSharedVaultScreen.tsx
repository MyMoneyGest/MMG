import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '@/services/firebaseConfig';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateSharedVaultScreen'
>;

const CURRENCIES = ['XAF', 'XOF', 'USD', 'EUR', 'GHS'] as const;
type Currency = typeof CURRENCIES[number];

type Beneficiary = {
  id: string;           // doc id dans users/{uid}/beneficiaries
  name?: string;
  phone?: string;
  email?: string;
  operator?: string;
  linkedUid?: string;   // présent => “✅ Utilisateur MyMoneyGest”
};

export default function CreateSharedVaultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = auth.currentUser;

  // Stepper
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('XAF');

  // Step 2 (config)
  const [type, setType] = useState<'standard' | 'blocked'>('standard');
  const [blockDuration, setBlockDuration] = useState<'6' | '12' | '24' | '36'>('6');
  const [initialDeposit, setInitialDeposit] = useState<string>('');

  // Bénéficiaires MMG
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBens, setLoadingBens] = useState(true);

  // Sélection (on stocke les linkedUid)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Recherche
  const [search, setSearch] = useState('');

  // Création
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setLoadingBens(true);
        // On lit les bénéficiaires de l’utilisateur
        const ref = collection(db, 'users', user.uid, 'beneficiaries');
        const qRef = query(ref, orderBy('createdAt', 'desc'));
        const snap = await getDocs(qRef);

        // On garde uniquement ceux qui ont linkedUid (== MMG user)
        const list: Beneficiary[] = snap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name || '',
              phone: data.phone || '',
              email: data.email || '',
              operator: data.operator || '',
              linkedUid: data.linkedUid || undefined,
            };
          })
          .filter((b) => !!b.linkedUid);

        setBeneficiaries(list);
      } catch (e) {
        console.warn('Erreur chargement bénéficiaires:', e);
      } finally {
        setLoadingBens(false);
      }
    })();
  }, [user]);

  const hasSearch = search.trim().length > 0;

  const filteredBeneficiaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) =>
      `${b.name ?? ''} ${b.phone ?? ''} ${b.email ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [beneficiaries, search]);

  // Suggestions (3 premiers MMG pas déjà sélectionnés) quand pas de recherche
  const suggestions = useMemo(() => {
    if (hasSearch) return [];
    const notSelected = beneficiaries.filter(
      (b) => b.linkedUid && !selected.has(b.linkedUid)
    );
    return notSelected.slice(0, 3);
  }, [beneficiaries, selected, hasSearch]);

  const toggleSelect = (b: Beneficiary) => {
    if (!b.linkedUid) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(b.linkedUid!)) n.delete(b.linkedUid!);
      else n.add(b.linkedUid!);
      return n;
    });
  };

  const removeSelected = (linkedUid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(linkedUid);
      return n;
    });
  };

  const selectedBeneficiaries = useMemo(
    () => beneficiaries.filter((b) => b.linkedUid && selected.has(b.linkedUid)),
    [beneficiaries, selected]
  );

  const canGoNext =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    !!Number(targetAmount);

  const canSubmit = canGoNext && selected.size > 0 && !loading;

  const formatMoney = (val: string) =>
    !val ? '' : `${Number(val).toLocaleString()} ${currency}`;

  const handleCreate = async () => {
    if (!user) return;
    if (!canSubmit) {
      Alert.alert('Info', 'Ajoutez au moins un membre (bénéficiaire MMG).');
      return;
    }

    setLoading(true);
    try {
      // 1) Crée le doc du coffre
      const vaultRef = await addDoc(collection(db, 'sharedVaults'), {
        name: name.trim(),
        description: description.trim(),
        targetAmount: Number(targetAmount),
        currency,
        type,
        blockDurationMonths: type === 'blocked' ? Number(blockDuration) : null,
        balance: 0,
        creatorUid: user.uid,
        createdAt: serverTimestamp(),
        participantsCount: selected.size + 1,
        status: 'active',
      });

      // 2) Créateur = admin
      await setDoc(doc(db, 'sharedVaults', vaultRef.id, 'members', user.uid), {
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      // 3) Chaque bénéficiaire sélectionné (MMG) devient membre (contributor)
      const ops: Promise<any>[] = [];
      selected.forEach((linkedUid) => {
        ops.push(
          setDoc(doc(db, 'sharedVaults', vaultRef.id, 'members', linkedUid), {
            role: 'contributor',
            joinedAt: serverTimestamp(),
          })
        );
      });
      await Promise.all(ops);

      // 4) Dépôt initial optionnel → commande (à traiter plus tard côté CF)
      if (Number(initialDeposit) > 0) {
        await addDoc(collection(db, 'sharedVaults', vaultRef.id, 'commands'), {
          type: 'initial_deposit',
          amount: Math.trunc(Number(initialDeposit)),
          requestedBy: user.uid,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Succès', 'Coffre partagé créé avec vos bénéficiaires MMG.');
      navigation.goBack();
    } catch (e) {
      console.error('Erreur création coffre partagé:', e);
      Alert.alert('Erreur', "Impossible de créer le coffre pour l'instant.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------- RENDUS ---------- */

  const Step1 = () => (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Informations du coffre partagé</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nom du coffre partagé *</Text>
        <TextInput
          placeholder="Ex: Maison familiale, Voyage de groupe…"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description du projet *</Text>
        <TextInput
          placeholder="Décrivez l'objectif commun…"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          multiline
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Objectif d'épargne collectif *</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="1000000"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
            style={[styles.input, { flex: 1, marginRight: 10 }]}
          />
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {
              const idx = CURRENCIES.indexOf(currency);
              const next = CURRENCIES[(idx + 1) % CURRENCIES.length];
              setCurrency(next);
            }}
          >
            <Text style={styles.selectorTxt}>{currency} ▾</Text>
          </TouchableOpacity>
        </View>
        {!!targetAmount && (
          <Text style={styles.helper}>Objectif collectif : {formatMoney(targetAmount)}</Text>
        )}
      </View>

      <TouchableOpacity
        disabled={!canGoNext}
        style={[styles.primaryBtn, !canGoNext && styles.disabled]}
        onPress={() => setStep(2)}
      >
        <Text style={styles.primaryTxt}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBeneficiaryRow = ({ item }: { item: Beneficiary }) => {
    const checked = item.linkedUid ? selected.has(item.linkedUid) : false;
    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item)}
        style={[
          styles.memberItem,
          checked && { borderColor: '#6D28D9', backgroundColor: '#F5F3FF' },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.memberTxt}>{item.name || item.email || item.phone || 'Bénéficiaire'}</Text>
          <Text style={{ color: '#6B7280' }}>{item.phone || item.email || ''}</Text>
          {!!item.linkedUid && (
            <Text style={styles.badgeMMGInline}>✅ Utilisateur MyMoneyGest</Text>
          )}
        </View>
        <Text style={{ color: checked ? '#6D28D9' : '#9CA3AF', fontWeight: '800' }}>
          {checked ? '✓' : '＋'}
        </Text>
      </TouchableOpacity>
    );
  };

  const SelectedChips = () => {
    if (selectedBeneficiaries.length === 0) return null;
    return (
      <View style={styles.chipsWrap}>
        {selectedBeneficiaries.map((b) => (
          <View key={b.linkedUid} style={styles.chip}>
            <Text style={styles.chipText}>
              {b.name || b.phone || 'Utilisateur'}
            </Text>
            <TouchableOpacity onPress={() => removeSelected(b.linkedUid!)} style={styles.chipRemove}>
              <Text style={styles.chipRemoveTxt}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const Step2HeaderTop = () => (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Inviter des membres MyMoneyGest</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoStrong}>Restriction importante</Text>
        <Text style={styles.infoTxt}>
          Seuls vos bénéficiaires qui utilisent déjà MyMoneyGest peuvent rejoindre un coffre partagé.
          Recherchez dans votre liste ci‑dessous.
        </Text>
      </View>

      {loadingBens ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#6D28D9" />
          <Text style={{ marginLeft: 8 }}>Chargement des bénéficiaires…</Text>
        </View>
      ) : beneficiaries.length === 0 ? (
        <View style={[styles.emptyBox, { marginTop: 8 }]}>
          <Text style={styles.emptyTitle}>Aucun bénéficiaire MMG</Text>
          <Text style={styles.emptySub}>
            Ajoutez d’abord un bénéficiaire “✅ Utilisateur MyMoneyGest”, puis revenez ici.
          </Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, { marginTop: 10 }]}
            onPress={() => navigation.navigate('AirtelBeneficiairesScreen' as any)}
          >
            <Text style={styles.secondaryTxt}>Créer un bénéficiaire</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Barre de recherche */}
          <TextInput
            placeholder="Rechercher (nom, numéro, email)…"
            value={search}
            onChangeText={setSearch}
            style={[styles.input, { marginBottom: 12 }]}
          />

          {/* Suggestions (3 max) quand pas de recherche */}
          {!hasSearch && suggestions.length > 0 && (
            <View>
              <Text style={styles.suggestionTitle}>Suggestions (MyMoneyGest)</Text>
              <View>
                {suggestions.map((s) => (
                  <View key={s.id} style={{ marginBottom: 8 }}>
                    {renderBeneficiaryRow({ item: s } as any)}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.secondaryBtn, { marginTop: 6 }]}
                onPress={() => navigation.navigate('AirtelBeneficiairesScreen' as any)}
              >
                <Text style={styles.secondaryTxt}>Gérer mes bénéficiaires</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Compteur + CHIPS sélectionnés */}
          <Text style={{ color: '#6B7280', marginTop: 6, marginBottom: 6 }}>
            Sélectionnés : {selected.size}
          </Text>
          <SelectedChips />
        </>
      )}
    </View>
  );

  const Step2Footer = () => (
    <View style={[styles.section, { paddingTop: 0 }]}>
      <View style={{ height: 16 }} />
      <Text style={styles.cardTitle}>Configuration du coffre</Text>

      <TouchableOpacity
        onPress={() => setType('standard')}
        style={[styles.choice, type === 'standard' && styles.choiceActiveGreen]}
      >
        <Text style={styles.choiceTitle}>Coffre standard partagé</Text>
        <Text style={styles.choiceSub}>Accès libre pour tous les membres</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setType('blocked')}
        style={[styles.choice, type === 'blocked' && styles.choiceActiveOrange]}
      >
        <Text style={styles.choiceTitle}>Coffre bloqué partagé</Text>
        <Text style={styles.choiceSub}>Épargne collective bloquée</Text>

        {type === 'blocked' && (
          <View style={styles.blockRow}>
            {(['6', '12', '24', '36'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.pill, blockDuration === d && styles.pillActive]}
                onPress={() => setBlockDuration(d)}
              >
                <Text style={[styles.pillTxt, blockDuration === d && styles.pillTxtActive]}>
                  {d === '6' ? '6 mois' : d === '12' ? '1 an' : d === '24' ? '2 ans' : '3 ans'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>

      <Text style={[styles.cardTitle, { marginTop: 22 }]}>Votre contribution initiale (optionnel)</Text>
      <TextInput
        placeholder="0"
        keyboardType="numeric"
        value={initialDeposit}
        onChangeText={setInitialDeposit}
        style={styles.input}
      />
      {!!initialDeposit && (
        <Text style={styles.helper}>Votre contribution : {formatMoney(initialDeposit)}</Text>
      )}

      <View style={[styles.row, { marginTop: 18 }]}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]}
          onPress={() => setStep(1)}
        >
          <Text style={styles.secondaryTxt}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { flex: 1 }, !canSubmit && styles.disabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          <Text style={styles.primaryTxt}>
            {loading ? 'Création du coffre…' : 'Créer le coffre partagé'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {step === 1 ? (
          <FlatList
            data={[{ key: 'step1' }]}
            keyExtractor={(it) => it.key}
            renderItem={() => <Step1 />}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backTxt}>‹</Text>
                  </TouchableOpacity>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeTxt}>Étape {step}/2</Text>
                  </View>
                </View>
                <Text style={styles.headerTitle}>Créer un coffre partagé</Text>
                <Text style={styles.headerSubtitle}>Épargnez en famille ou entre amis</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={hasSearch ? filteredBeneficiaries : []}
            keyExtractor={(item) => item.id}
            renderItem={renderBeneficiaryRow}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <>
                <View style={styles.header}>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                      <Text style={styles.backTxt}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeTxt}>Étape {step}/2</Text>
                    </View>
                  </View>
                  <Text style={styles.headerTitle}>Créer un coffre partagé</Text>
                  <Text style={styles.headerSubtitle}>Épargnez en famille ou entre amis</Text>
                </View>
                <Step2HeaderTop />
              </>
            }
            ListEmptyComponent={
              hasSearch && !loadingBens ? (
                <View style={[styles.emptyBox, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyTitle}>Aucun bénéficiaire trouvé</Text>
                  <Text style={styles.emptySub}>
                    Essayez un autre nom/numéro ou créez un bénéficiaire.
                  </Text>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { marginTop: 10 }]}
                    onPress={() => navigation.navigate('AirtelBeneficiairesScreen' as any)}
                  >
                    <Text style={styles.secondaryTxt}>Créer un bénéficiaire</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListFooterComponent={<Step2Footer />}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** ---------- STYLES ---------- */
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F6F7FB' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: '#6D28D9',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  backTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  stepBadge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  stepBadgeTxt: { color: '#fff', fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 10 },
  headerSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  section: { paddingHorizontal: 16, paddingTop: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },

  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '700' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#EEF2FF',
  },
  helper: { marginTop: 6, color: '#6D28D9', fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center' },

  selector: {
    height: 48, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 2, borderColor: '#EEF2FF', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  selectorTxt: { fontWeight: '700', color: '#111827' },

  primaryBtn: {
    backgroundColor: '#6D28D9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryTxt: { color: '#fff', fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryTxt: { color: '#111827', fontWeight: '800' },
  disabled: { opacity: 0.6 },

  infoBox: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoStrong: { color: '#7C3AED', fontWeight: '800', marginBottom: 4 },
  infoTxt: { color: '#6B21A8' },

  emptyBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  emptyTitle: { fontWeight: '800', color: '#111827', marginBottom: 4 },
  emptySub: { color: '#6B7280', textAlign: 'center' },

  suggestionTitle: { fontWeight: '800', color: '#111827', marginBottom: 8 },

  memberItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EEF2FF',
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberTxt: { fontWeight: '600', color: '#1F2937' },
  badgeMMGInline: { marginTop: 4, color: '#388E3C', fontWeight: '600', fontSize: 12 },

  choice: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  choiceActiveGreen: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  choiceActiveOrange: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  choiceTitle: { fontWeight: '800', color: '#111827' },
  choiceSub: { color: '#6B7280', marginTop: 3 },

  blockRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap', gap: 8 },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 6,
  },
  pillActive: { backgroundColor: '#6D28D9', borderColor: '#6D28D9' },
  pillTxt: { color: '#111827', fontWeight: '700' },
  pillTxtActive: { color: '#fff' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },

  // Chips sélectionnés
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipText: { color: '#1F2937', fontWeight: '600' },
  chipRemove: { marginLeft: 8, backgroundColor: '#4F46E5', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  chipRemoveTxt: { color: '#fff', fontWeight: '800', lineHeight: 14 },
});