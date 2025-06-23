import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Revenu = {
  id: string;
  description: string;
  amount: number;
};

const EntrepriseRevenusScreen = () => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [revenus, setRevenus] = useState<Revenu[]>([]);

  const addRevenu = () => {
    if (!description || !amount) return;

    const newRevenu: Revenu = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
    };

    setRevenus((prev) => [...prev, newRevenu]);
    setDescription('');
    setAmount('');
  };

  const total = revenus.reduce((sum, r) => sum + r.amount, 0);

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Revenus de l'entreprise</Text>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Description (ex : Vente produit)"
            style={styles.input}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            placeholder="Montant"
            keyboardType="numeric"
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity style={styles.button} onPress={addRevenu}>
            <Text style={styles.buttonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={revenus}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun revenu ajouté</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.description}</Text>
              <Text style={styles.amountText}>{item.amount.toLocaleString()} FCFA</Text>
            </View>
          )}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total :</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} FCFA</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EntrepriseRevenusScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: { marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  item: {
    backgroundColor: '#ffffffcc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: { fontWeight: '500' },
  amountText: { fontWeight: 'bold', color: '#2E7D32' },
  totalContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#ffffffaa',
  },
});