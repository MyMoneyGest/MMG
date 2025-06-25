import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const EntrepriseFacturationScreen = () => {
  const [client, setClient] = useState('');
  const [produit, setProduit] = useState('');
  const [quantite, setQuantite] = useState('');
  const [prixUnitaire, setPrixUnitaire] = useState('');
  const [factures, setFactures] = useState<any[]>([]);

  const ajouterFacture = () => {
    if (!client || !produit || !quantite || !prixUnitaire) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }

    const total = parseFloat(quantite) * parseFloat(prixUnitaire);

    const nouvelleFacture = {
      id: Date.now().toString(),
      client,
      produit,
      quantite: parseFloat(quantite),
      prixUnitaire: parseFloat(prixUnitaire),
      total,
      date: new Date().toLocaleDateString('fr-FR'),
    };

    setFactures([nouvelleFacture, ...factures]);

    // Reset des champs
    setClient('');
    setProduit('');
    setQuantite('');
    setPrixUnitaire('');
  };

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Facturation</Text>

          <View style={styles.inputGroup}>
            <TextInput
              placeholder="Nom du client"
              style={styles.input}
              value={client}
              onChangeText={setClient}
            />
            <TextInput
              placeholder="Produit ou service"
              style={styles.input}
              value={produit}
              onChangeText={setProduit}
            />
            <TextInput
              placeholder="Quantité"
              style={styles.input}
              keyboardType="numeric"
              value={quantite}
              onChangeText={setQuantite}
            />
            <TextInput
              placeholder="Prix unitaire (FCFA)"
              style={styles.input}
              keyboardType="numeric"
              value={prixUnitaire}
              onChangeText={setPrixUnitaire}
            />

            <TouchableOpacity style={styles.button} onPress={ajouterFacture}>
              <Text style={styles.buttonText}>Créer facture</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Historique des factures</Text>
          {factures.length === 0 ? (
            <Text style={styles.emptyText}>Aucune facture enregistrée.</Text>
          ) : (
            factures.map((facture) => (
              <View key={facture.id} style={styles.factureItem}>
                <Text style={styles.factureText}>{facture.client}</Text>
                <Text style={styles.factureDetails}>
                  {facture.produit} - {facture.quantite} x {facture.prixUnitaire} FCFA
                </Text>
                <Text style={styles.factureTotal}>Total : {facture.total.toLocaleString()} FCFA</Text>
                <Text style={styles.factureDate}>Date : {facture.date}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EntrepriseFacturationScreen;

const styles = StyleSheet.create({
  container: {
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
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  emptyText: {
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  factureItem: {
    backgroundColor: '#ffffffee',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  factureText: {
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 2,
  },
  factureDetails: {
    color: '#333',
  },
  factureTotal: {
    fontWeight: 'bold',
    color: '#004D40',
    marginTop: 4,
  },
  factureDate: {
    fontSize: 12,
    color: '#777',
  },
});