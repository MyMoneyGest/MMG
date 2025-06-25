import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const EnterpriseInfoScreen = () => {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser!;
      const udoc = await getDoc(doc(db, 'users', user.uid));
      const data = udoc.data();
      setInfo(data?.entreprise ?? null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#00796B" />;
  }

  if (!info) {
    return <View style={styles.container}><Text>Aucune information entreprise trouvée.</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Infos Entreprise</Text>
      {Object.entries(info).map(([key, val]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)} :</Text>
          <Text style={styles.value}>{String(val)}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default EnterpriseInfoScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#004D40', marginBottom: 20, textAlign: 'center' },
  row: { marginBottom: 12 },
  label: { fontWeight: '600', color: '#00796B' },
  value: { marginLeft: 8 },
});