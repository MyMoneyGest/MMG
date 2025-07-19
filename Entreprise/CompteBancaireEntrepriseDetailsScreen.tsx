// CompteBancaireEntrepriseDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'CompteBancaireEntrepriseDetailsScreen'>;

const CompteBancaireEntrepriseDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { companyId } = route.params;
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'companies', companyId, 'linkedAccounts', 'compte bancaire');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBalance(data?.comptebancaireBalance ?? 0);
        setTransactions(
          (data?.transactions ?? []).sort(
            (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00796B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compte Bancaire - Solde</Text>
      <Text style={styles.balance}>{balance?.toLocaleString()} FCFA</Text>

      <Text style={styles.sectionTitle}>Dernières transactions</Text>
      <FlatList
        data={transactions.slice(0, 5)}
        keyExtractor={(item) => item.reference}
        renderItem={({ item }) => {
          const isReceived = item.type?.toLowerCase().includes('reçu');
          return (
            <View style={styles.transaction}>
              <Text style={styles.transactionType}>{item.type}</Text>
              <Text style={[styles.transactionAmount, { color: isReceived ? '#2E7D32' : '#B71C1C' }]}>
                {isReceived ? '+' : '-'}{item.amount.toLocaleString()} FCFA
              </Text>
              <Text style={styles.transactionDate}>{new Date(item.date).toLocaleString('fr-FR')}</Text>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('CompteBancaireEntrepriseDetailsScreen', { companyId })}
      >
        <Text style={styles.historyButtonText}>Voir tout l’historique</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CompteBancaireEntrepriseDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#E0F7FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#004D40' },
  balance: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#00796B' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#00796B' },
  transaction: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionType: { fontWeight: 'bold', flex: 2 },
  transactionAmount: { flex: 1, textAlign: 'right', fontWeight: '600' },
  transactionDate: { flex: 2, textAlign: 'right', fontSize: 12, color: '#555' },
  historyButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#004D40',
    borderRadius: 8,
    alignItems: 'center',
  },
  historyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
