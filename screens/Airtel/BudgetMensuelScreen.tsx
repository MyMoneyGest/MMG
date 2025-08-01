import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';


type Depense = {
  id: string;
  nom: string;
  montant: number | null;
  type: 'Fixe' | 'Variable';
};

const suggestionsFixes = [
  { nom: 'Loyer', montant: 100000 },
  { nom: 'Electricité', montant: 20000 },
  { nom: 'Eau', montant: 15000 },
];
const suggestionsVariables = [
  { nom: 'Transport', montant: 25000 },
  { nom: 'Nourriture', montant: 40000 },
  { nom: 'Loisirs', montant: 15000 },
];

const BudgetMensuelScreen = () => {
  const [salaire, setSalaire] = useState<string>('');
  const [autresRevenus, setAutresRevenus] = useState<string>('');
  const [depenses, setDepenses] = useState<Depense[]>([]);

  // Fonction sécurisée pour convertir string en nombre (float) ou 0 si invalide
  const parseMontant = (str: string) => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalRevenus = parseMontant(salaire) + parseMontant(autresRevenus);

  const totalDepenses = depenses.reduce(
    (acc, d) => acc + (d.montant ?? 0),
    0
  );

  const solde = totalRevenus - totalDepenses;

  // Ajouter une nouvelle dépense vide
  const ajouterDepense = (type: 'Fixe' | 'Variable') => {
    setDepenses((old) => [
      ...old,
      { id: uuidv4(), nom: '', montant: null, type },
    ]);
  };

  // Modifier nom ou montant d'une dépense
  const modifierDepense = (
    id: string,
    champ: 'nom' | 'montant',
    valeur: string
  ) => {
    setDepenses((old) =>
      old.map((d) => {
        if (d.id === id) {
          if (champ === 'nom') {
            return { ...d, nom: valeur };
          } else {
            // nettoyage et conversion montant
            const montantParsed = parseMontant(valeur);
            return {
              ...d,
              montant: valeur === '' ? null : montantParsed,
            };
          }
        }
        return d;
      })
    );
  };

  // Supprimer une dépense
  const supprimerDepense = (id: string) => {
    setDepenses((old) => old.filter((d) => d.id !== id));
  };

  // Ajouter suggestion avec anti doublon (nom + type)
  const ajouterSuggestion = (depense: Omit<Depense, 'id'>) => {
    const exists = depenses.some(
      (d) =>
        d.nom.trim().toLowerCase() === depense.nom.trim().toLowerCase() &&
        d.type === depense.type
    );
    if (exists) {
      Alert.alert('Info', 'Cette dépense est déjà ajoutée.');
      return;
    }
    setDepenses((old) => [...old, { ...depense, id: uuidv4() }]);
  };

  // Validation avant enregistrement
  const validerBudget = () => {
    if (totalRevenus <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir au moins un revenu valide.');
      return;
    }
    if (
      depenses.some(
        (d) =>
          !d.nom.trim() ||
          d.montant === null ||
          d.montant <= 0
      )
    ) {
      Alert.alert(
        'Erreur',
        'Veuillez remplir correctement toutes les dépenses (nom et montant > 0).'
      );
      return;
    }
    Alert.alert('Succès', 'Budget enregistré avec succès !');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Mon Budget Mensuel</Text>

      {/* Revenus */}
      <View style={styles.section}>
        <Text style={styles.label}>Salaire mensuel (FCFA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ex: 250000"
          value={salaire}
          onChangeText={setSalaire}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Autres revenus (FCFA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ex: 50000"
          value={autresRevenus}
          onChangeText={setAutresRevenus}
          placeholderTextColor="#999"
        />
      </View>

      {/* Dépenses fixes */}
      <View style={styles.section}>
        <Text style={styles.subTitle}>Dépenses fixes</Text>
        {depenses
          .filter((d) => d.type === 'Fixe')
          .map((d) => (
            <View key={d.id} style={styles.depenseRow}>
              <TextInput
                style={[styles.input, styles.depenseInputNom]}
                placeholder="Nom dépense"
                value={d.nom}
                onChangeText={(text) => modifierDepense(d.id, 'nom', text)}
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={[styles.input, styles.depenseInputMontant]}
                keyboardType="numeric"
                placeholder="Montant"
                value={d.montant !== null ? d.montant.toString() : ''}
                onChangeText={(text) => modifierDepense(d.id, 'montant', text)}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                onPress={() => supprimerDepense(d.id)}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete" size={24} color="#e53935" />
              </TouchableOpacity>
            </View>
          ))}
        <TouchableOpacity
          onPress={() => ajouterDepense('Fixe')}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="add-circle-outline"
            size={20}
            color="#00796B"
          />
          <Text style={styles.addButtonText}>Ajouter dépense fixe</Text>
        </TouchableOpacity>

        <Text style={styles.suggestionTitle}>Suggestions fixes :</Text>
        <View style={styles.suggestionList}>
          {suggestionsFixes.map((sugg) => (
            <TouchableOpacity
              key={sugg.nom}
              style={styles.suggestionBtn}
              onPress={() =>
                ajouterSuggestion({
                  type: 'Fixe',
                  nom: sugg.nom,
                  montant: sugg.montant,
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>
                {`${sugg.nom} - ${sugg.montant.toLocaleString()} FCFA`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dépenses variables */}
      <View style={styles.section}>
        <Text style={styles.subTitle}>Dépenses variables</Text>
        {depenses
          .filter((d) => d.type === 'Variable')
          .map((d) => (
            <View key={d.id} style={styles.depenseRow}>
              <TextInput
                style={[styles.input, styles.depenseInputNom]}
                placeholder="Nom dépense"
                value={d.nom}
                onChangeText={(text) => modifierDepense(d.id, 'nom', text)}
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={[styles.input, styles.depenseInputMontant]}
                keyboardType="numeric"
                placeholder="Montant"
                value={d.montant !== null ? d.montant.toString() : ''}
                onChangeText={(text) => modifierDepense(d.id, 'montant', text)}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity
                onPress={() => supprimerDepense(d.id)}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete" size={24} color="#e53935" />
              </TouchableOpacity>
            </View>
          ))}
        <TouchableOpacity
          onPress={() => ajouterDepense('Variable')}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="add-circle-outline"
            size={20}
            color="#00796B"
          />
          <Text style={styles.addButtonText}>Ajouter dépense variable</Text>
        </TouchableOpacity>

        <Text style={styles.suggestionTitle}>Suggestions variables :</Text>
        <View style={styles.suggestionList}>
          {suggestionsVariables.map((sugg) => (
            <TouchableOpacity
              key={sugg.nom}
              style={styles.suggestionBtn}
              onPress={() =>
                ajouterSuggestion({
                  type: 'Variable',
                  nom: sugg.nom,
                  montant: sugg.montant,
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>
                {`${sugg.nom} - ${sugg.montant.toLocaleString()} FCFA`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Résumé */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#e6f4ea' }]}>
          <MaterialIcons name="attach-money" size={28} color="#388e3c" />
          <Text style={[styles.summaryLabel, { color: '#388e3c' }]}>
            Total revenus
          </Text>
          <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
            {totalRevenus.toLocaleString()} FCFA
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#fdecea' }]}>
          <MaterialIcons name="money-off" size={28} color="#d32f2f" />
          <Text style={[styles.summaryLabel, { color: '#d32f2f' }]}>
            Total dépenses
          </Text>
          <Text style={[styles.summaryValue, { color: '#c62828' }]}>
            {totalDepenses.toLocaleString()} FCFA
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: solde >= 0 ? '#e0f2f1' : '#ffebee',
            },
          ]}
        >
          <MaterialIcons
            name={solde >= 0 ? 'trending-up' : 'trending-down'}
            size={28}
            color={solde >= 0 ? '#00796b' : '#d32f2f'}
          />
          <Text
            style={[
              styles.summaryLabel,
              { color: solde >= 0 ? '#00796b' : '#d32f2f' },
            ]}
          >
            Solde restant
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: solde >= 0 ? '#00796b' : '#d32f2f', fontWeight: 'bold' },
            ]}
          >
            {solde.toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={validerBudget}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>Enregistrer le budget</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BudgetMensuelScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 80,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 28,
    textAlign: 'center',
    color: '#00695C',
    fontFamily: 'System',
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontWeight: '700',
    marginBottom: 10,
    fontSize: 17,
    color: '#004D40',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    color: '#00796B',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    color: '#263238',
    fontWeight: '600',
  },
  depenseRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  depenseInputNom: {
    flex: 2,
  },
  depenseInputMontant: {
    flex: 1,
    marginLeft: 12,
  },
  deleteBtn: {
    marginLeft: 14,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b2dfdb',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    color: '#004D40',
    fontWeight: '700',
    fontSize: 15,
  },
  suggestionTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#00796B',
    fontWeight: '700',
  },
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionBtn: {
    backgroundColor: '#c8e6c9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 10,
    borderRadius: 16,
  },
  suggestionText: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  summaryCard: {
    width: '30%',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
  },
  submitBtn: {
    backgroundColor: '#00796B',
    paddingVertical: 18,
    borderRadius: 24,
  },
  submitText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 19,
    textAlign: 'center',
  },
});