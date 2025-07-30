// src/screens/airtel/AirtelMoneyAllTransactionsScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import {
  collection, doc, getDoc, onSnapshot, orderBy, query, limit as fsLimit,
} from 'firebase/firestore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AirtelMoneyAllTransactions'>;

type FeedDoc = {
  source: 'airtel' | 'vault' | string;
  kind: 'transfer_in' | 'transfer_out' | 'vault_deposit' | 'vault_withdrawal' | string;
  direction: 'credit' | 'debit';
  amount: number;
  note?: string;
  reference?: string | null;
  mainTransactionId?: string;
  counterpartyUid?: string;
  counterpartyName?: string;
  vaultId?: string;
  vaultName?: string;
  timestamp?: any; // Firestore Timestamp
};

type Row = FeedDoc & {
  id: string;
  displayTitle: string;
  displayRef: string;
  displayDate: string;
  signedAmount: string;
};

export default function AirtelMoneyAllTransactions() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const resolvingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const feedCol = collection(db, 'users', user.uid, 'activityFeed');
    const q = query(feedCol, orderBy('timestamp', 'desc'), fsLimit(100));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Row[] = snap.docs.map((d) => {
          const data = d.data() as FeedDoc;
          const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
          const displayDate = ts.toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          });
          const isCredit = data.direction === 'credit';
          const signedAmount = `${isCredit ? '+' : '-'}${Number(data.amount).toLocaleString()} FCFA`;
          const displayRef = data.reference ?? data.mainTransactionId ?? d.id;

          // Titre lisible
          let displayTitle = '';
          if (data.source === 'airtel') {
            const name = data.counterpartyName || data.counterpartyUid || 'Utilisateur';
            displayTitle = data.kind === 'transfer_in'
              ? `Virement de ${name}`
              : `Virement à ${name}`;
          } else if (data.source === 'vault') {
            const vn = data.vaultName || 'coffre';
            displayTitle = data.kind === 'vault_withdrawal'
              ? `Retrait depuis ${vn}`
              : `Versement vers ${vn}`;
          } else {
            displayTitle = data.kind || 'Mouvement';
          }

          return {
            id: d.id,
            ...data,
            displayTitle,
            displayRef,
            displayDate,
            signedAmount,
          };
        });
        setRows(next);
        setLoading(false);
      },
      (err) => {
        console.error('activityFeed onSnapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Fallback : si counterpartyName absent et counterpartyUid présent (cas ancien),
  // on résout via phoneDirectory une seule fois par UID.
  useEffect(() => {
    const uids = Array.from(new Set(
      rows
        .filter(r => r.source === 'airtel')
        .map(r => r.counterpartyUid)
        .filter((v): v is string => Boolean(v))
    ));
    const missing = uids.filter(uid => !nameMap[uid] && !resolvingRef.current.has(uid));
    if (!missing.length) return;

    missing.forEach(async (uid) => {
      resolvingRef.current.add(uid);
      try {
        const s = await getDoc(doc(db, 'phoneDirectory', uid));
        const d = s.exists() ? (s.data() as any) : null;
        const display = d?.name || d?.displayName || d?.phone || 'Utilisateur';
        setNameMap(prev => ({ ...prev, [uid]: display }));
      } finally {
        resolvingRef.current.delete(uid);
      }
    });
  }, [rows, nameMap]);

  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((it) => {
      const name = it.counterpartyName
        || (it.counterpartyUid ? nameMap[it.counterpartyUid] : '')
        || '';
      const hay = [
        it.displayTitle, it.direction, it.source, it.kind,
        String(it.amount), it.displayDate, it.displayRef,
        it.note ?? '', name, it.vaultName ?? ''
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery, nameMap]);

  const renderItem = ({ item }: { item: Row }) => {
    const isCredit = item.direction === 'credit';
    const iso = item.timestamp?.toDate ? item.timestamp.toDate().toISOString() : new Date().toISOString();
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate('TransactionDetail', {
            transaction: {
              id: item.mainTransactionId || item.id,
              reference: item.displayRef,
              type: item.source === 'vault'
                ? (item.kind === 'vault_withdrawal' ? 'Retrait coffre' : 'Versement coffre')
                : (isCredit ? 'Virement reçu' : 'Virement émis'),
              amount: isCredit ? item.amount : -item.amount,
              date: iso,
              sender: item.source === 'airtel'
                ? (isCredit ? (item.counterpartyName || '—') : 'Vous')
                : (item.kind === 'vault_withdrawal' ? (item.vaultName || 'Coffre') : 'Vous'),
              receiver: item.source === 'airtel'
                ? (isCredit ? 'Vous' : (item.counterpartyName || '—'))
                : (item.kind === 'vault_withdrawal' ? 'Vous' : (item.vaultName || 'Coffre')),
              status: 'Réussi',
              reason: item.note ?? '',
            },
          })
        }
      >
        <Text style={styles.title}>{item.displayTitle}</Text>
        <Text style={[styles.amount, { color: isCredit ? '#2E7D32' : '#B71C1C' }]}>{item.signedAmount}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{item.displayDate}</Text>
          <Text style={styles.ref}>{item.displayRef}</Text>
        </View>
        {item.note ? <Text style={styles.note} numberOfLines={1}>{item.note}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}><Text style={styles.headerTitle}>Historique complet</Text></View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Rechercher (nom, type, montant, date, réf, coffre)…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator /><Text style={{ marginTop: 8 }}>Chargement…</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Aucune transaction.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  header: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#ffffffcc', borderBottomWidth: 1, borderBottomColor: '#00796B' },
  headerTitle: { fontSize: 20, color: '#00796B', fontWeight: 'bold', textAlign: 'center' },
  searchBox: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#ffffffaa' },
  input: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderColor: '#00796B', borderWidth: 1 },
  list: { padding: 20 },
  loading: { paddingTop: 40, alignItems: 'center' },
  empty: { textAlign: 'center', color: '#555', marginTop: 30 },
  item: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  title: { fontWeight: 'bold', fontSize: 16, color: '#004D40' },
  amount: { fontSize: 16, marginTop: 4, fontWeight: 'bold' },
  metaRow: { marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 12, color: '#555' },
  ref: { fontSize: 12, color: '#777' },
  note: { fontSize: 12, color: '#333', marginTop: 6 },
});