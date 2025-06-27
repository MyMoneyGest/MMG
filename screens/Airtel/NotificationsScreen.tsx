import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
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

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getAuth().currentUser;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        // 1. Récupérer le user
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (!userData) return;

        let notifRef;

        // 2. Choisir la bonne source
        if (userData.type === 'entreprise' && userData.entrepriseId) {
          notifRef = collection(db, 'entreprises', userData.entrepriseId, 'notifications');
        } else {
          notifRef = collection(db, 'users', user.uid, 'notifications');
        }

        // 3. Récupérer les notifications triées
        const q = query(notifRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setNotifications(data);

        // 4. Marquer comme lues si non lues
        for (const notif of snapshot.docs) {
          if (!notif.data().opened) {
            await updateDoc(doc(notifRef, notif.id), { opened: true });
          }
        }

      } catch (error) {
        console.error('Erreur récupération notifications :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>
        {new Date(item.date).toLocaleString('fr-FR')}
      </Text>
    </View>
  );

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