// NotificationsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'NotificationsScreen'>;

type NotifItem = {
  id: string;
  title?: string;
  message?: string;
  date?: any; // Firestore Timestamp | string | number
  kind?:
    | 'request_in'
    | 'request_out'
    | 'request_paid_in'
    | 'request_paid_out'
    | 'transfer_in'
    | 'transfer_out'
    | string;
  paymentRequestId?: string;
  txId?: string;
  reference?: string;
  amount?: number;
  counterpartyName?: string;
  note?: string;
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<Nav>();
  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        // Si tu gères aussi des notifs d'entreprise ailleurs, adapte ici.
        const notifRef =
          userData?.type === 'entreprise' && userData?.entrepriseId
            ? collection(db, 'entreprises', userData.entrepriseId, 'notifications')
            : collection(db, 'users', user.uid, 'notifications');

        const qRef = query(notifRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(qRef);

        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, any>),
        })) as NotifItem[];

        setNotifications(data);
      } catch (e) {
        console.error('Erreur récupération notifications :', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (notifId: string) => {
    try {
      if (!user) return;
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notifId), {
        opened: true,
        read: true,
      });
    } catch (e) {
      // non bloquant
      console.warn('Marquage lu échoué', e);
    }
  };

  const onPressNotif = async (item: NotifItem) => {
    if (!user) return;

    // 1) Marquer lue
    await markAsRead(item.id);

    // 2) Router selon la nature
    if (
      (item.kind === 'request_in' || item.kind === 'request_paid_in') &&
      item.paymentRequestId
    ) {
      navigation.navigate('RequestsInboxScreen', {
        filter: 'received',
        highlightId: item.paymentRequestId,
      });
      return;
    }

    if (
      (item.kind === 'request_out' || item.kind === 'request_paid_out') &&
      item.paymentRequestId
    ) {
      navigation.navigate('RequestsInboxScreen', {
        filter: 'sent',
        highlightId: item.paymentRequestId,
      });
      return;
    }

    if (item.kind === 'transfer_in' || item.kind === 'transfer_out') {
      navigation.navigate('TransactionDetail', {
        transaction: {
          id: item.txId ?? '',
          reference: item.reference ?? '',
          type: item.kind === 'transfer_in' ? 'Virement reçu' : 'Virement émis',
          amount: item.amount ?? 0,
          date: new Date().toISOString(),
          sender:
            item.kind === 'transfer_in'
              ? item.counterpartyName ?? 'Utilisateur'
              : 'Vous',
          receiver:
            item.kind === 'transfer_out'
              ? item.counterpartyName ?? 'Utilisateur'
              : 'Vous',
          status: 'Réussi',
          reason: item.note ?? '',
        },
      });
      return;
    }

    // Par défaut : pas de navigation spécifique
  };

  const renderItem = ({ item }: { item: NotifItem }) => {
    // Affichage de la date robuste (Timestamp | string | number)
    const dateStr = item.date?.toDate
      ? item.date.toDate().toLocaleString('fr-FR')
      : new Date(item.date ?? Date.now()).toLocaleString('fr-FR');

    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => onPressNotif(item)}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#00796B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.empty}>Aucune notification pour le moment.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1', padding: 20 },
  
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#00796B' },
  message: { fontSize: 14, marginTop: 4 },
  date: { fontSize: 12, color: '#666', marginTop: 6 },
  empty: { textAlign: 'center', color: '#555', marginTop: 50, fontSize: 16 },
});