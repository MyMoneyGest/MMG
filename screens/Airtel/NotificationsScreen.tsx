import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection, doc, onSnapshot, orderBy, query, writeBatch, getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getAuth().currentUser;

  useEffect(() => {
    if (!user) return;

    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};
        const notifCol =
          userData.type === 'entreprise' && userData.entrepriseId
            ? collection(db, 'entreprises', userData.entrepriseId, 'notifications')
            : collection(db, 'users', user.uid, 'notifications');

        const q = query(notifCol, orderBy('date', 'desc'));
        unsub = onSnapshot(q, async (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as any;
            const dateObj =
              data?.date?.toDate ? data.date.toDate()
              : typeof data?.date === 'string' ? new Date(data.date)
              : new Date();
            return { id: d.id, ...data, _date: dateObj };
          });

          setNotifications(items);
          setLoading(false);

          // Marquer opened: true en batch
          const batch = writeBatch(db);
          let hasUpdates = false;
          snap.docs.forEach((d) => {
            if (!d.get('opened')) {
              batch.update(doc(notifCol, d.id), { opened: true });
              hasUpdates = true;
            }
          });
          if (hasUpdates) {
            try { await batch.commit(); } catch { /* no-op */ }
          }
        });
      } catch (e) {
        console.error('Erreur récupération notifications :', e);
        setLoading(false);
      }
    })();

    return () => { if (unsub) unsub(); };
  }, [user]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{item._date.toLocaleString('fr-FR')}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2F1' },
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