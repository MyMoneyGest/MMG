import React, { useState, useEffect } from 'react';
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
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

type AirtelMoneyAllTransactionsAirtelProp = NativeStackNavigationProp<RootStackParamList, 'AirtelMoneyAllTransactions'>;

const AirtelMoneyAllTransactions = () => {
const [username, setUsername] = useState('');
const navigation = useNavigation<AirtelMoneyAllTransactionsAirtelProp>();
const [searchQuery, setSearchQuery] = useState('');
const [transactions, setTransactions] = useState<any[]>([]);
const insets = useSafeAreaInsets();

useEffect(() => {
const user = auth.currentUser;
if (!user) return;

const airtelRef = doc(db, 'users', user.uid, 'linkedAccounts', 'airtel');

const unsubscribe = onSnapshot(airtelRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    const txs = data.transactions || [];

    const sorted = [...txs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setTransactions(sorted);
  }
});

return () => unsubscribe();

}, []);

const filteredTransactions = transactions.filter((item) => {
const query = searchQuery.toLowerCase();
return (
item.type.toLowerCase().includes(query) ||
String(item.amount).toLowerCase().includes(query) ||
item.date?.includes(query) ||
(item.reference ?? '').toLowerCase().includes(query) ||
(item.status ?? '').toLowerCase().includes(query)
);
});

const renderItem = ({ item }: { item: typeof transactions[0] }) => {
const reference = item.reference
? item.reference
: item.generatedId
? `TXN${String(item.generatedId).padStart(5, '0')}`
: 'Réf-0000';

const typeLabel = item.type === 'Virement émis'
  ? `Virement à ${item.receiver}`
  : item.type === 'Virement reçu'
  ? `Virement de ${item.sender}`
  : item.type;

const sender = item.sender || { username };
const receiver = item.receiver || (item.vaultName ? `Coffre ${item.vaultName}` : 'Destinataire inconnu');

const completeTransaction = {
  ...item,
  reference,
  status: item.status ?? 'Succès',
  sender,
  receiver,
};

return (
  <TouchableOpacity
    style={styles.transactionItem}
    onPress={() =>
      navigation.navigate('TransactionDetail', { transaction: completeTransaction })
    }
  >
    <Text style={styles.transactionType}>{typeLabel}</Text>
    <Text style={styles.transactionAmount}>
      {typeof completeTransaction.amount === 'number'
        ? `${completeTransaction.amount.toLocaleString()} FCFA`
        : 'Montant inconnu'}
    </Text>
    <Text style={styles.transactionDate}>
      {completeTransaction.date
        ? new Date(completeTransaction.date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      : 'Date inconnue'}
</Text>

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
      keyExtractor={(item, index) => item.reference || `txn-${index}`}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />

  </SafeAreaView>

  );
  };

export default AirtelMoneyAllTransactions;

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