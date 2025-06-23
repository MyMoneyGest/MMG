import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const EntrepriseDepensesScreen = () => {
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('');
  const [depenses, setDepenses] = useState<any[]>([]);

  const ajouterDepense = () => {
    if (!description || !montant || !categorie) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }

    const nouvelleDepense = {
      id: Date.now().toString(),
      description,
      montant: parseFloat(montant),
      categorie,
      date: new Date().toLocaleDateString('fr-FR'),
    };

    setDepenses([nouvelleDepense, ...depenses]);
    setDescription('');
    setMontant('');
    setCategorie('');
  };

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Dépenses professionnelles</Text>

          <View style={styles.inputGroup}>
            <TextInput
              placeholder="Description (ex: achat fournitures)"
              style={styles.input}
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              placeholder="Montant"
              keyboardType="numeric"
              style={styles.input}
              value={montant}
              onChangeText={setMontant}
            />
            <TextInput
              placeholder="Catégorie (ex: bureau, déplacement...)"
              style={styles.input}
              value={categorie}
              onChangeText={setCategorie}
            />
            <TouchableOpacity style={styles.button} onPress={ajouterDepense}>
              <Text style={styles.buttonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Historique des dépenses</Text>
          {depenses.length === 0 ? (
            <Text style={styles.emptyText}>Aucune dépense enregistrée.</Text>
          ) : (
            depenses.map((item) => (
              <View key={item.id} style={styles.depenseItem}>
                <Ionicons name="remove-circle-outline" size={20} color="#B71C1C" />
                <View style={styles.depenseInfo}>
                  <Text style={styles.depenseText}>{item.description}</Text>
                  <Text style={styles.depenseDetails}>
                    {item.montant.toLocaleString()} FCFA - {item.categorie} - {item.date}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EntrepriseDepensesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
    gap: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#fff',
  },
  depenseItem: {
    backgroundColor: '#ffffffee',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  depenseInfo: {
    marginLeft: 10,
  },
  depenseText: {
    fontWeight: 'bold',
    color: '#00796B',
  },
  depenseDetails: {
    fontSize: 12,
    color: '#333',
  },
});