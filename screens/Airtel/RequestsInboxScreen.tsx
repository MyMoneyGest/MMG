// screens/airtel/RequestsInboxScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  DocumentData,
} from 'firebase/firestore';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RequestsInboxScreen'>;
type R = RouteProp<RootStackParamList, 'RequestsInboxScreen'>;

type Req = {
  id: string;
  requesterUid: string;
  requesterName?: string;
  targetUid: string;
  amount: number;
  note?: string;
  status: 'pending' | 'paid' | 'declined';
  createdAt?: any; // Firestore Timestamp | string | number
};

type TabKey = 'received' | 'sent';

const RequestsInboxScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const initialTab: TabKey = (route.params?.filter as TabKey) || 'received';
  const highlightRef = useRef<string | undefined>(route.params?.highlightId);

  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState<Req[]>([]);
  const [sent, setSent] = useState<Req[]>([]);
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    if (!user) return;

    const col = collection(db, 'paymentRequests');

    // Demandes reçues : targetUid == moi
    const qReceived = query(
      col,
      where('targetUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubR = onSnapshot(
      qReceived,
      (snap) => {
        const rows: Req[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as any;
        setReceived(rows);
        setLoading(false);
      },
      (err) => {
        console.error('RequestsInbox(received) listen error:', err);
        setLoading(false);
      }
    );

    // Demandes envoyées : requesterUid == moi
    const qSent = query(
      col,
      where('requesterUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubS = onSnapshot(
      qSent,
      (snap) => {
        const rows: Req[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as any;
        setSent(rows);
        setLoading(false);
      },
      (err) => {
        console.error('RequestsInbox(sent) listen error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubR();
      unsubS();
    };
  }, [user?.uid]);

  // Dataset selon l’onglet
  const data = useMemo(() => (tab === 'received' ? received : sent), [tab, received, sent]);

  const openDetail = (req: Req) => {
    navigation.navigate('PaymentRequestDetail', { requestId: req.id });
  };

  const renderItem = ({ item }: { item: Req }) => {
    const created =
      item.createdAt?.toDate
        ? item.createdAt.toDate()
        : new Date(item.createdAt ?? Date.now());

    const isHighlight = highlightRef.current === item.id;
    const isMine = item.requesterUid === user?.uid;

    return (
      <TouchableOpacity
        onPress={() => openDetail(item)}
        style={[styles.row, isHighlight && styles.highlightRow]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.lineTop}>
            {tab === 'received'
              ? `De ${item.requesterName ?? 'Utilisateur'}`
              : `À ${item.targetUid === user?.uid ? 'vous' : 'destinataire'}`}
          </Text>

          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

          <Text style={styles.date}>{created.toLocaleString('fr-FR')}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>
            {Number(item.amount).toLocaleString()} FCFA
          </Text>
          <Text
            style={[
              styles.status,
              item.status === 'pending' && { color: '#B07100' },
              item.status === 'paid' && { color: '#2E7D32' },
              item.status === 'declined' && { color: '#B71C1C' },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const Empty = () => (
    <Text style={styles.empty}>
      {tab === 'received'
        ? 'Aucune demande reçue.'
        : 'Aucune demande envoyée.'}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Onglets “côte à côte” */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'received' && styles.tabBtnActive]}
          onPress={() => setTab('received')}
        >
          <Text style={[styles.tabLabel, tab === 'received' && styles.tabLabelActive]}>
            Reçues
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{received.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === 'sent' && styles.tabBtnActive]}
          onPress={() => setTab('sent')}
        >
          <Text style={[styles.tabLabel, tab === 'sent' && styles.tabLabelActive]}>
            Envoyées
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{sent.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Empty />}
        />
      )}
    </SafeAreaView>
  );
};

export default RequestsInboxScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },

  // Onglets
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
  },
  tabLabel: {
    fontSize: 15,
    color: '#004D40',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#00796B',
  },
  countPill: {
    minWidth: 24,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00796B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Liste / items
  row: {
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    marginHorizontal: 16,
  },
  highlightRow: {
    borderWidth: 2,
    borderColor: '#00BCD4',
  },
  lineTop: { fontSize: 15, fontWeight: '600', color: '#004D40' },
  amount: { fontSize: 15, fontWeight: '700' },
  status: { marginTop: 4, fontSize: 12 },
  note: { marginTop: 2, fontSize: 13, color: '#333' },
  date: { marginTop: 4, fontSize: 12, color: '#666' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#555', marginTop: 30 },
});