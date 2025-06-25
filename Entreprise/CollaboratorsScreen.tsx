import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Collaborator = {
  nom: string;
  email: string;
  fonction: string;
  telephone?: string;
};

const CollaboratorsScreen = () => {
  const [list, setList] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser!;
      const col = collection(db, 'enterprises', user.uid, 'collaborators');
      const snap = await getDocs(col);
      setList(snap.docs.map(d => d.data() as Collaborator));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#00796B" />;
  }

  if (`${list.length}` === '0') {
    return <View style={styles.empty}><Text>Aucun collaborateur enregistré.</Text></View>;
  }

  return (
    <FlatList
      data={list}
      keyExtractor={(item, idx) => item.email + idx}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.nom}</Text>
          <Text>{item.fonction}</Text>
          <Text>{item.email}</Text>
          {!!item.telephone && <Text>{item.telephone}</Text>}
        </View>
      )}
    />
  );
};

export default CollaboratorsScreen;

const styles = StyleSheet.create({
  container: { padding: 20 },
  card: { backgroundColor: '#ffffffee', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 1 },
  name: { fontWeight: '600', fontSize: 16, marginBottom: 4, color: '#004D40' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});