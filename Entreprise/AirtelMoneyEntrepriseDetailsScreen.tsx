import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AirtelMoneyEntrepriseDetailsScreen'>;

const AirtelMoneyEntrepriseDetailsScreen = ({ route }: Props) => {
  const { companyId } = route.params;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const ref = doc(db, 'companies', companyId, 'linkedAccounts', 'airtel');
    return onSnapshot(ref, snapshot => {
      const data = snapshot.data();
      setBalance(data?.airtelBalance ?? 0);
      setTransactions(data?.transactions ?? []);
    });
  }, [companyId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solde Airtel Money: {balance?.toLocaleString()} FCFA</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.reference}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.amount}>{item.amount} FCFA</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleString('fr-FR')}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default AirtelMoneyEntrepriseDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  item: { padding: 10, backgroundColor: '#eee', borderRadius: 8, marginBottom: 10 },
  type: { fontWeight: '600' },
  amount: { color: '#00796B' },
  date: { fontSize: 12, color: '#555' },
});