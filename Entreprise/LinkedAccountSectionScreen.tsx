import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'LinkedAccountSectionScreen'>;

const LinkedAccountSectionScreen = ({ route, navigation }: Props) => {
  const { companyId, accountType } = route.params;
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const ref = doc(db, 'companies', companyId, 'linkedAccounts', accountType);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBalance(data?.[`${accountType}Balance`] ?? 0);
        setTransactions(
          (data?.transactions ?? []).sort(
            (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      }
    });

    return unsubscribe;
  }, [companyId, accountType]);

  const filteredTransactions = transactions.slice(0, 3);

  const handleNavigateToFullHistory = () => {
    const screenMap: Record<string, { name: keyof RootStackParamList; params: { companyId: string } }> = {
      'airtel money': {
        name: 'AirtelMoneyEntrepriseDetailsScreen',
        params: { companyId },
      },
      'moov money': {
        name: 'MoovMoneyEntrepriseDetailsScreen',
        params: { companyId },
      },
      'compte bancaire': {
        name: 'CompteBancaireEntrepriseScreen',
        params: { companyId },
      },
    };

    const target = screenMap[accountType.toLowerCase()];
    if (accountType === 'airtel money') {
      navigation.navigate('AirtelMoneyEntrepriseDetailsScreen', { companyId });
    } else if (accountType === 'moov money') {
      navigation.navigate('MoovMoneyEntrepriseDetailsScreen', { companyId });
    } else if (accountType === 'compte bancaire') {
      navigation.navigate('CompteBancaireEntrepriseScreen', { companyId });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{accountType.toUpperCase()} - Solde</Text>
      <Text style={styles.balance}>
        {balance !== null ? `${balance.toLocaleString()} FCFA` : 'Chargement...'}
      </Text>

      {filteredTransactions.map((item) => {
        const isReceived = item.type?.toLowerCase().includes('reçu');
        const amountText = `${isReceived ? '+' : ''}${item.amount} FCFA`;
        return (
          <View key={item.reference} style={styles.transactionItem}>
            <Text style={styles.transactionType}>{item.type}</Text>
            <Text style={[styles.transactionAmount, { color: isReceived ? '#2E7D32' : '#000' }]}>
              {amountText}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(item.date).toLocaleString('fr-FR')}
            </Text>
          </View>
        );
      })}

      <TouchableOpacity onPress={handleNavigateToFullHistory} style={styles.toggleButton}>
        <Text style={styles.toggleText}>Voir tout l'historique {accountType}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LinkedAccountSectionScreen;

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 10,
  },
  balance: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  transactionItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  transactionType: {
    fontWeight: 'bold',
  },
  transactionAmount: {
    fontSize: 16,
  },
  transactionDate: {
    fontSize: 12,
    color: '#555',
  },
  toggleButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  toggleText: {
    color: '#00796B',
    fontWeight: 'bold',
  },
  });