import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getAuth } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RequestsInboxScreen'>;

type RouteParams = {
  filter?: 'received' | 'sent';
  highlightId?: string;
};

type PaymentRequest = {
  id: string;
  requesterUid: string;
  requesterName?: string;
  targetUid: string;
  amount: number;
  note?: string;
  status: 'pending' | 'paid' | 'declined';
  createdAt?: Timestamp | Date | string | number;
};

const RequestsInboxScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;

  const [tab, setTab] = useState<'received' | 'sent'>(params.filter ?? 'received');
  const [received, setReceived] = useState<PaymentRequest[]>([]);
  const [sent, setSent] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<PaymentRequest>>(null);

  const user = getAuth().currentUser;

  useEffect(() => {
    if (!user) return;

    const col = collection(db, 'paymentRequests');

    // Reçues
    const qRecv = query(
      col,
      where('targetUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubRecv = onSnapshot(
      qRecv,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as PaymentRequest[];
        setReceived(arr);
        setLoading(false);
      },
      (err) => {
        console.error('Listen received error:', err);
        setLoading(false);
      }
    );

    // Envoyées
    const qSent = query(
      col,
      where('requesterUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubSent = onSnapshot(
      qSent,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as PaymentRequest[];
        setSent(arr);
        setLoading(false);
      },
      (err) => {
        console.error('Listen sent error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubRecv();
      unsubSent();
    };
  }, [user?.uid]);

  // Liste affichée selon l’onglet
  const rows = useMemo(() => (tab === 'received' ? received : sent), [tab, received, sent]);

  // Mettre en avant la demande ciblée (depuis une notif)
  useEffect(() => {
    if (!params.highlightId || rows.length === 0) return;
    const idx = rows.findIndex((r) => r.id === params.highlightId);
    if (idx >= 0) {
      // petit délai pour laisser la FlatList se monter
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      }, 200);
    }
  }, [params.highlightId, rows]);

  const formatDate = (v?: Timestamp | Date | string | number) => {
    if (!v) return '';
    if (typeof v === 'string' || typeof v === 'number') {
      return new Date(v).toLocaleString('fr-FR');
    }
    const ts: any = v as any;
    if (ts?.toDate) return ts.toDate().toLocaleString('fr-FR');
    return new Date(v as Date).toLocaleString('fr-FR');
    };

  const renderStatus = (s: PaymentRequest['status']) => {
    switch (s) {
      case 'pending':
        return <Text style={[styles.badge, styles.badgePending]}>En attente</Text>;
      case 'paid':
        return <Text style={[styles.badge, styles.badgePaid]}>Payée</Text>;
      case 'declined':
        return <Text style={[styles.badge, styles.badgeDeclined]}>Refusée</Text>;
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: PaymentRequest }) => {
    const isReceived = tab === 'received';
    const title = isReceived
      ? `${item.requesterName || 'Utilisateur'} vous a demandé`
      : `Vous avez demandé à ${item.targetUid === user?.uid ? 'vous-même' : ''}`;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          params.highlightId === item.id && styles.highlight,
        ]}
        onPress={() => {
          // Si tu as un écran de détail, décommente :
          // navigation.navigate('PaymentRequestDetail', { requestId: item.id });
        }}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.title}>
            {isReceived
              ? `${item.requesterName || 'Utilisateur'}`
              : 'Demande envoyée'}
          </Text>
          {renderStatus(item.status)}
        </View>

        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

        <View style={styles.rowBetween}>
          <Text style={styles.amount}>{`${Number(item.amount).toLocaleString()} FCFA`}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'received' && styles.tabBtnActive]}
          onPress={() => setTab('received')}
        >
          <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>
            Reçues
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'sent' && styles.tabBtnActive]}
          onPress={() => setTab('sent')}
        >
          <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>
            Envoyées
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Chargement…' : tab === 'received'
              ? 'Aucune demande reçue.'
              : 'Aucune demande envoyée.'}
          </Text>
        }
        onScrollToIndexFailed={() => {}}
      />
    </SafeAreaView>
  );
};

export default RequestsInboxScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  tabs: {
    flexDirection: 'row',
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#B2DFDB',
  },
  tabText: {
    fontWeight: '600',
    color: '#00796B',
  },
  tabTextActive: {
    color: '#004D40',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  highlight: {
    borderWidth: 2,
    borderColor: '#00796B',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#004D40' },
  note: { marginTop: 6, color: '#333' },
  amount: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12, color: '#666' },
  empty: { textAlign: 'center', color: '#555', marginTop: 40 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    overflow: 'hidden',
  } as any,
  badgePending: { backgroundColor: '#FFF3CD', color: '#946200' },
  badgePaid: { backgroundColor: '#D1E7DD', color: '#0F5132' },
  badgeDeclined: { backgroundColor: '#F8D7DA', color: '#842029' },
});