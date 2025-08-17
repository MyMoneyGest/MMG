import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import PhoneInput from '../../constants/PhoneInput';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Beneficiary = {
  id: string;
  name: string;
  phone: string;
  operator?: string;
  linkedUid?: string | null; // présent si utilisateur MyMoneyGest
  lastTransferAmount?: number; // optionnel si tu veux l’afficher
  lastTransferAt?: Timestamp;  // optionnel
};

const AirtelBeneficiariesScreen = () => {
  const navigation = useNavigation<Navigation>();
  const user = getAuth().currentUser;

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // sans indicatif, ton PhoneInput gère +241
  const [operator, setOperator] = useState('Airtel');
  const [editId, setEditId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Helpers UI
  const initials = (n?: string) =>
    (n || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || '—';

  const formatAmount = (v?: number) =>
    typeof v === 'number' ? `${v.toLocaleString()} XOF` : undefined;

  const formatRelativeDate = (ts?: Timestamp) => {
    if (!ts?.toDate) return undefined;
    const d = ts.toDate();
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Aujourd'hui";
    if (days === 1) return 'Il y a 1 jour';
    if (days < 7) return `Il y a ${days} jours`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return 'Il y a 1 semaine';
    return `Il y a ${weeks} semaines`;
  };

  // --- Lecture temps réel des bénéficiaires
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.uid, 'beneficiaries');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Beneficiary[];
      setBeneficiaries(list);
    });
    return () => unsub();
  }, [user]);

  // --- Recherche locale
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) =>
      `${b.name ?? ''} ${b.phone ?? ''} ${b.operator ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [beneficiaries, search]);

  // --- Add/Update
  const handleAddOrUpdate = async () => {
    setPhoneError('');
    setSuccessMessage('');

    if (!name || !phone) {
      if (!phone) setPhoneError('Le numéro est requis.');
      return;
    }
    // 9 chiffres après +241 dans ton flux (ex: 07XXXXXXXX => stocké +2417XXXXXXXX)
    if (!/^\d{9}$/.test(phone)) {
      setPhoneError('Numéro invalide. 9 chiffres après +241 attendus.');
      return;
    }

    try {
      const formattedPhone = '+241' + phone.replace(/^0/, '');

      // Vérifier si ce numéro existe dans l’annuaire public => utilisateur MMG
      let linkedUid: string | null = null;
      const phoneQuery = query(
        collection(db, 'phoneDirectory'),
        where('phone', '==', formattedPhone)
      );
      const snap = await getDocs(phoneQuery);
      if (!snap.empty) {
        linkedUid = (snap.docs[0].data() as any).uid;
      }

      const payload = {
        name: name.trim(),
        phone: formattedPhone,
        operator: operator || 'Airtel',
        linkedUid,
        createdAt: new Date(),
      };

      if (editId) {
        await updateDoc(doc(db, 'users', user!.uid, 'beneficiaries', editId), payload);
      } else {
        await addDoc(collection(db, 'users', user!.uid, 'beneficiaries'), payload);
      }

      setName('');
      setPhone('');
      setOperator('Airtel');
      setEditId(null);
      setModalVisible(false);
      setSuccessMessage('Bénéficiaire enregistré.');
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', `Impossible d'${editId ? 'mettre à jour' : 'ajouter'} ce bénéficiaire.`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'beneficiaries', id));
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de supprimer.');
    }
  };

  // --- Render d’un item
  const renderItem = ({ item }: { item: Beneficiary }) => {
    const lastAmount = formatAmount(item.lastTransferAmount);
    const lastWhen = formatRelativeDate(item.lastTransferAt);
    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials(item.name)}</Text>
            </View>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              {!!item.operator && <Text style={styles.operator}>{item.operator}</Text>}
              {item.linkedUid ? (
                <Text style={styles.badgeMMG}>✅ Utilisateur MyMoneyGest</Text>
              ) : (
                <Text style={styles.badgeNonMMG}>Non inscrit MMG</Text>
              )}
              {(lastAmount || lastWhen) && (
                <Text style={styles.lastLine}>
                  Dernier: {lastAmount ?? '—'} {lastWhen ? `- ${lastWhen}` : ''}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => {
              setName(item.name);
              setPhone(item.phone.replace('+241', ''));
              setOperator(item.operator || 'Airtel');
              setEditId(item.id);
              setModalVisible(true);
            }}
          >
            <Text style={styles.linkPrimary}>Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Confirmer la suppression',
                'Voulez-vous vraiment supprimer ce bénéficiaire ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => handleDelete(item.id),
                  },
                ]
              )
            }
          >
            <Text style={styles.linkDanger}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backTxt}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Bénéficiaires</Text>
              <Text style={styles.headerSubtitle}>Contacts favoris</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.plusBtn}
            onPress={() => {
              setEditId(null);
              setName('');
              setPhone('');
              setOperator('Airtel');
              setModalVisible(true);
            }}
          >
            <Text style={styles.plusTxt}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Barre de recherche (facultative) */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Rechercher par nom, numéro, opérateur…"
            placeholderTextColor="#A1A1AA"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Liste */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addCard}
            onPress={() => {
              setEditId(null);
              setName('');
              setPhone('');
              setOperator('Airtel');
              setModalVisible(true);
            }}
          >
            <Text style={styles.addIcon}>👥</Text>
            <Text style={styles.addTitle}>Ajouter un bénéficiaire</Text>
            <Text style={styles.addSubtitle}>Enregistrer un nouveau contact</Text>
          </TouchableOpacity>
        }
      />

      {/* Modal Add / Edit */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {successMessage ? (
              <Text style={styles.successMsg}>{successMessage}</Text>
            ) : null}

            <Text style={styles.modalTitle}>
              {editId ? 'Modifier le bénéficiaire' : 'Ajouter un bénéficiaire'}
            </Text>

            <TextInput
              placeholder="Nom complet"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <PhoneInput value={phone} onChangeText={setPhone} error={phoneError} />

            <TextInput
              placeholder="Opérateur (Airtel, Moov…)"
              placeholderTextColor="#6B7280"
              value={operator}
              onChangeText={setOperator}
              style={styles.input}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddOrUpdate}>
              <Text style={styles.primaryTxt}>{editId ? 'Mettre à jour' : 'Ajouter le bénéficiaire'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#B71C1C' }]}
              onPress={() => {
                setModalVisible(false);
                setEditId(null);
                setPhoneError('');
              }}
            >
              <Text style={styles.primaryTxt}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AirtelBeneficiariesScreen;

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B0B12' }, // header dark background
  header: {
    backgroundColor: '#0B0B12',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F2937',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },

  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1, borderColor: '#27272A',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  backTxt: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', lineHeight: 22 },

  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: '#A1A1AA', marginTop: 2 },

  plusBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1, borderColor: '#27272A',
    alignItems: 'center', justifyContent: 'center',
  },
  plusTxt: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', lineHeight: 22 },

  searchBox: { marginTop: 12 },
  searchInput: {
    backgroundColor: '#111827',
    color: '#E5E7EB',
    borderWidth: 1, borderColor: '#27272A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  listContent: {
    padding: 16,
    backgroundColor: '#0F1117',
    paddingBottom: 32,
  },

  // Card bénéficiaire
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  avatar: {
    width: 44, height: 44, borderRadius: 9999,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarTxt: { fontWeight: '700', color: '#111827' },

  name: { fontWeight: '700', fontSize: 16, color: '#111827' },
  phone: { color: '#4B5563', marginTop: 2 },
  operator: { color: '#00796B', fontSize: 12, marginTop: 2, fontWeight: '600' },
  badgeMMG: { marginTop: 4, color: '#388E3C', fontWeight: '600', fontSize: 12 },
  badgeNonMMG: { marginTop: 4, color: '#9CA3AF', fontSize: 12, fontStyle: 'italic' },
  lastLine: { marginTop: 6, color: '#6B7280', fontSize: 12 },

  sendBtn: {
    backgroundColor: '#0B0B12',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendTxt: { color: '#FFFFFF', fontWeight: '700' },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 10,
  },
  linkPrimary: { color: '#00796B', fontWeight: '700' },
  linkDanger: { color: '#B71C1C', fontWeight: '700' },

  // Add card
  addCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  addIcon: { fontSize: 28, marginBottom: 6 },
  addTitle: { fontWeight: '700', color: '#111827' },
  addSubtitle: { color: '#6B7280', marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffffff',
    borderRadius: 14,
    padding: 20,
    width: '100%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#0F172A' },
  input: {
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    marginBottom: 14,
    color: '#111827',
  },
  primaryBtn: {
    backgroundColor: '#14c7b2ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryTxt: { color: '#fff', fontWeight: '800' },
  successMsg: {
    color: '#388E3C',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
});