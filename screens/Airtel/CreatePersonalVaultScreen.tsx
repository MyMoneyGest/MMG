import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { auth, db } from '@/services/firebaseConfig';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';

/** ---------- Config ---------- */
const CURRENCIES = ['XAF', 'XOF', 'USD', 'EUR', 'GHS'] as const;
type Currency = typeof CURRENCIES[number];

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreatePersonalVaultScreen'
>;

/** ---------- Helpers ---------- */
function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}
const formatMoney = (n: number | string, ccy: string) =>
  `${Number(n || 0).toLocaleString()} ${ccy}`;

/** ---------- Screen ---------- */
export default function CreatePersonalVaultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = getAuth().currentUser;

  // Stepper
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 — infos
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('XAF');

  // Step 2 — config
  const [type, setType] = useState<'standard' | 'locked'>('standard');
  const [blockDuration, setBlockDuration] = useState<'3' | '6' | '12' | '24'>('6');
  const [initialDeposit, setInitialDeposit] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const canGoStep2 = useMemo(
    () => name.trim().length > 0 && description.trim().length > 0 && !!Number(targetAmount),
    [name, description, targetAmount]
  );
  const canSubmit = useMemo(() => canGoStep2 && !loading, [canGoStep2, loading]);

  const rotateCurrency = () => {
    const i = CURRENCIES.indexOf(currency);
    setCurrency(CURRENCIES[(i + 1) % CURRENCIES.length]);
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté.');
      return;
    }
    if (!canSubmit) return;

    try {
      setLoading(true);

      // 1) Créer le coffre
      const now = new Date();
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        balance: 0,
        goal: Number(targetAmount),
        currency,
        type: type === 'locked' ? 'locked' : 'standard',
        createdAt: serverTimestamp(),
        uid: user.uid,
      };
      if (type === 'locked') {
        const months = Number(blockDuration);
        payload.lockedUntil = addMonths(now, months).toISOString();
      }

      const ref = await addDoc(collection(db, 'users', user.uid, 'vaults'), payload);

      // 2) Dépôt initial optionnel -> commande (asynchrone côté backend)
      if (Number(initialDeposit) > 0) {
        await addDoc(collection(db, 'users', user.uid, 'vaultCommands'), {
          type: 'deposit',
          vaultId: ref.id,
          amount: Math.trunc(Number(initialDeposit)),
          note: 'Premier dépôt (création coffre perso)',
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Succès', 'Coffre créé avec succès.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible de créer le coffre pour l'instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backTxt}>‹</Text>
              </TouchableOpacity>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeTxt}>Étape {step}/2</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Créer un coffre personnel</Text>
            <Text style={styles.headerSubtitle}>
              Épargnez pour vos objectifs personnels
            </Text>
          </View>

          {/* Step Indicator (visuel simple) */}
          <View style={styles.progressRow}>
            <View style={[styles.stepDot, step >= 1 ? styles.dotActive : styles.dotIdle]}>
              <Text style={[styles.dotTxt, step >= 1 && { color: '#fff' }]}>{step > 1 ? '✓' : '1'}</Text>
            </View>
            <View style={[styles.progressBar, step > 1 ? styles.barActive : styles.barIdle]} />
            <View style={[styles.stepDot, step >= 2 ? styles.dotActive : styles.dotIdle]}>
              <Text style={[styles.dotTxt, step >= 2 && { color: '#fff' }]}>2</Text>
            </View>
          </View>

          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.cardTitle}>Informations de votre coffre</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Nom du coffre *</Text>
                <TextInput
                  placeholder="Ex: Vacances d'été, Achat voiture, Mariage…"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description de votre objectif *</Text>
                <TextInput
                  placeholder="Décrivez votre objectif d'épargne personnel…"
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, { height: 96, textAlignVertical: 'top' }]}
                  multiline
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Montant à épargner *</Text>
                <View style={styles.row}>
                  <TextInput
                    placeholder="150000"
                    keyboardType="numeric"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                  />
                  <TouchableOpacity style={styles.selector} onPress={rotateCurrency}>
                    <Text style={styles.selectorTxt}>{currency} ▾</Text>
                  </TouchableOpacity>
                </View>
                {!!targetAmount && (
                  <Text style={styles.helper}>
                    Objectif : {formatMoney(targetAmount, currency)}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setStep(2)}
                disabled={!canGoStep2}
                style={[styles.primaryBtn, !canGoStep2 && styles.disabled]}
              >
                <Text style={styles.primaryTxt}>Continuer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.section}>
              {/* Type */}
              <Text style={styles.cardTitle}>Type de coffre personnel</Text>

              <TouchableOpacity
                onPress={() => setType('standard')}
                style={[styles.choice, type === 'standard' && styles.choiceActiveGreen]}
              >
                <Text style={styles.choiceTitle}>Coffre standard</Text>
                <Text style={styles.choiceSub}>Accès libre à votre épargne personnelle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType('locked')}
                style={[styles.choice, type === 'locked' && styles.choiceActiveOrange]}
              >
                <Text style={styles.choiceTitle}>Coffre bloqué</Text>
                <Text style={styles.choiceSub}>Épargne personnelle bloquée pour vous discipliner</Text>

                {type === 'locked' && (
                  <View style={styles.blockRow}>
                    {(['3', '6', '12', '24'] as const).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.pill, blockDuration === d && styles.pillActive]}
                        onPress={() => setBlockDuration(d)}
                      >
                        <Text style={[styles.pillTxt, blockDuration === d && styles.pillTxtActive]}>
                          {d === '3' ? '3 mois' : d === '6' ? '6 mois' : d === '12' ? '1 an' : '2 ans'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Dépôt initial */}
              <Text style={[styles.cardTitle, { marginTop: 16 }]}>Premier dépôt (optionnel)</Text>
              <TextInput
                placeholder="0"
                keyboardType="numeric"
                value={initialDeposit}
                onChangeText={setInitialDeposit}
                style={styles.input}
              />
              {!!initialDeposit && (
                <Text style={styles.helper}>
                  Premier dépôt : {formatMoney(initialDeposit, currency)}
                </Text>
              )}
              <Text style={styles.noteTxt}>
                Vous pourrez toujours ajouter de l'argent plus tard.
              </Text>

              {/* Résumé */}
              <View style={[styles.summary, type === 'locked' ? styles.summaryOrange : styles.summaryGreen]}>
                <Text style={styles.summaryTitle}>Résumé de votre coffre</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Nom</Text>
                  <Text style={styles.summaryValue}>{name || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue}>
                    {type === 'locked' ? `Bloqué ${blockDuration} mois` : 'Standard'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Objectif</Text>
                  <Text style={styles.summaryValue}>{formatMoney(targetAmount || 0, currency)}</Text>
                </View>
                {!!initialDeposit && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Premier dépôt</Text>
                    <Text style={styles.summaryValue}>{formatMoney(initialDeposit, currency)}</Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={[styles.row, { marginTop: 14 }]}>
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
                    {loading ? 'Création…' : 'Créer mon coffre'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F6F7FB' },
  container: { paddingBottom: 32 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: '#0F6B3E',
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

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  dotActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  dotIdle: { borderColor: '#D1D5DB', backgroundColor: '#fff' },
  dotTxt: { fontWeight: '800', color: '#111827' },
  progressBar: {
    flex: 1, height: 2, marginHorizontal: 10, borderRadius: 2,
  },
  barActive: { backgroundColor: '#16A34A' },
  barIdle: { backgroundColor: '#E5E7EB' },

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
    borderColor: '#E6F1EA',
  },
  row: { flexDirection: 'row', alignItems: 'center' },

  selector: {
    height: 48, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 2, borderColor: '#E6F1EA', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  selectorTxt: { fontWeight: '700', color: '#111827' },

  primaryBtn: {
    backgroundColor: '#16A34A',
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
  pillActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  pillTxt: { color: '#111827', fontWeight: '700' },
  pillTxtActive: { color: '#fff' },

  helper: { marginTop: 6, color: '#16A34A', fontWeight: '600' },
  noteTxt: { color: '#6B7280', fontSize: 12, marginTop: 6 },

  summary: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  summaryGreen: { borderColor: '#D1FAE5', backgroundColor: '#ECFDF5' },
  summaryOrange: { borderColor: '#FFEDD5', backgroundColor: '#FFF7ED' },
  summaryTitle: { fontWeight: '800', color: '#111827', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { color: '#374151' },
  summaryValue: { fontWeight: '700', color: '#111827' },
});