import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type LibertisTransactionsScreenProp = NativeStackNavigationProp<RootStackParamList,'LibertisTransactions'>;

const sampleTransactions = [
  {
    id: '1',
    type: 'Envoi',
    amount: '-5 000 FCFA',
    date: '2025-06-01',
    reference: 'TX123456',
    status: 'Réussie',
    sender: 'Jean Dupont',
    receiver: 'Marie Koffi',
  },
  {
    id: '2',
    type: 'Réception',
    amount: '+10 000 FCFA',
    date: '2025-05-30',
    reference: 'TX123457',
    status: 'Réussie',
    sender: 'Brenda',
    receiver: 'Mitachi',
  },
  { id: '1', type: 'Envoi', amount: '-5 000 FCFA', date: '2025-06-01', reference: 'TXN001', status: 'Réussi' },
  { id: '2', type: 'Réception', amount: '+10 000 FCFA', date: '2025-05-30', reference: 'TXN002', status: 'Réussi' },
  { id: '3', type: 'Retrait', amount: '-3 000 FCFA', date: '2025-05-29', reference: 'TXN003', status: 'Échoué' },
  { id: '4', type: 'Paiement', amount: '-2 000 FCFA', date: '2025-05-28', reference: 'TXN004', status: 'En attente' },
  { id: '5', type: 'Envoi', amount: '-6 000 FCFA', date: '2025-06-02', reference: 'TXN005', status: 'Réussi' },
  { id: '6', type: 'Réception', amount: '+4 000 FCFA', date: '2025-05-27', reference: 'TXN006', status: 'Réussi' },
];

const LibertisTransactions = () => {
  const navigation = useNavigation<LibertisTransactionsScreenProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filteredTransactions = sampleTransactions.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.type.toLowerCase().includes(query) ||
      item.amount.toLowerCase().includes(query) ||
      item.date.includes(query) ||
      item.reference.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  });

  const renderItem = ({ item }: { item: typeof sampleTransactions[0] }) => {
  const completeTransaction = {
    ...item,
    reference: item.reference ?? 'Réf-0000',
    status: item.status ?? 'Succès',
    sender: item.sender ?? 'Vous',
    receiver: item.receiver ?? 'Destinataire inconnu',
  };

  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => navigation.navigate('TransactionDetailLibertis', { transaction: completeTransaction })}
    >
      <Text style={styles.transactionType}>{item.type}</Text>
      <Text style={styles.transactionAmount}>{item.amount}</Text>
      <Text style={styles.transactionDate}>{item.date}</Text>
    </TouchableOpacity>
  );
};


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique complet</Text>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par type, montant, date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('TransactionDetailLibertis', {
            transaction: {
              ...item,
              sender: item.sender ?? 'Inconnu',
              receiver: item.receiver ?? 'Inconnu',
              reference: item.reference ?? 'Aucune référence',
              status: item.status ?? 'Inconnu',
            },
          })
        }

      >
      <View style={styles.transactionItem}>
        <Text style={styles.transactionType}>{item.type}</Text>
        <Text style={styles.transactionAmount}>{item.amount}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  )}
  contentContainerStyle={styles.listContent}
  showsVerticalScrollIndicator={false}
/>


      <View style={[styles.returnButtonWrapper, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.returnButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LibertisTransactions;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#ffffffcc',
    borderBottomWidth: 1,
    borderBottomColor: '#00796B',
  },
  title: {
    fontSize: 20,
    color: '#00796B',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffffaa',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderColor: '#00796B',
    borderWidth: 1,
  },
  listContent: {
    padding: 20,
  },
  transactionItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  transactionType: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#004D40',
  },
  transactionAmount: {
    fontSize: 16,
    marginTop: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  returnButtonWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  returnButton: {
    backgroundColor: '#B71C1C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});