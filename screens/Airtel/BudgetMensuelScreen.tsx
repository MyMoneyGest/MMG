// BudgetMensuelScreen
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

  const totalRevenus =
    (parseFloat(salaire.replace(',', '.')) || 0) +
    (parseFloat(autresRevenus.replace(',', '.')) || 0);

  const totalDepenses = depenses.reduce(
    (acc, d) => acc + (d.montant || 0),
    0
  );

  const solde = totalRevenus - totalDepenses;

  const ajouterDepense = (type: 'Fixe' | 'Variable', nom = '', montant: number | null = null) => {
    setDepenses((old) => [
      ...old,
      { id: Date.now().toString(), nom, montant, type },
    ]);
  };

  const modifierDepense = (
    id: string,
    champ: 'nom' | 'montant',
    valeur: string
  ) => {
    setDepenses((old) =>
      old.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            [champ]:
              champ === 'montant'
                ? valeur === ''
                  ? null
                  : parseFloat(valeur.replace(',', '.'))
                : valeur,
          };
        }
        return d;
      })
    );
  };

  const supprimerDepense = (id: string) => {
    setDepenses((old) => old.filter((d) => d.id !== id));
  };

  const ajouterSuggestion = (depense: Omit<Depense, 'id'>) => {
    setDepenses((old) => [
      ...old,
      { ...depense, id: Date.now().toString() },
    ]);
  };

  const validerBudget = () => {
    if (totalRevenus <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir au moins un revenu valide.');
      return;
    }
    if (
      depenses.some(
        (d) => !d.nom || d.montant === null || d.montant <= 0
      )
    ) {
      Alert.alert('Erreur', 'Veuillez remplir correctement toutes les dépenses.');
      return;
    }
    Alert.alert('Succès', 'Budget enregistré (exemple) !');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Mon Budget Mensuel</Text>

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
          <MaterialIcons name="add-circle-outline" size={20} color="#00796B" />
          <Text style={styles.addButtonText}>Ajouter dépense fixe</Text>
        </TouchableOpacity>

        <Text style={styles.suggestionTitle}>Suggestions fixes :</Text>
        <View style={styles.suggestionList}>
          {suggestionsFixes.map((sugg) => (
            <TouchableOpacity
              key={sugg.nom}
              style={styles.suggestionBtn}
              onPress={() =>
                ajouterSuggestion({ type: 'Fixe', nom: sugg.nom, montant: sugg.montant })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{`${sugg.nom} - ${sugg.montant.toLocaleString()} FCFA`}</Text>
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
          <MaterialIcons name="add-circle-outline" size={20} color="#00796B" />
          <Text style={styles.addButtonText}>Ajouter dépense variable</Text>
        </TouchableOpacity>

        <Text style={styles.suggestionTitle}>Suggestions variables :</Text>
        <View style={styles.suggestionList}>
          {suggestionsVariables.map((sugg) => (
            <TouchableOpacity
              key={sugg.nom}
              style={styles.suggestionBtn}
              onPress={() =>
                ajouterSuggestion({ type: 'Variable', nom: sugg.nom, montant: sugg.montant })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{`${sugg.nom} - ${sugg.montant.toLocaleString()} FCFA`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Résumé */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#e6f4ea' }]}>
          <MaterialIcons name="attach-money" size={28} color="#388e3c" />
          <Text style={[styles.summaryLabel, { color: '#388e3c' }]}>Total revenus</Text>
          <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
            {totalRevenus.toLocaleString()} FCFA
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#fdecea' }]}>
          <MaterialIcons name="money-off" size={28} color="#d32f2f" />
          <Text style={[styles.summaryLabel, { color: '#d32f2f' }]}>Total dépenses</Text>
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

      <TouchableOpacity style={styles.submitBtn} onPress={validerBudget} activeOpacity={0.85}>
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
    borderRadius: 20,
    marginTop: 10,
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#00796B',
    fontWeight: '700',
    fontSize: 16,
  },
  suggestionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontWeight: '700',
    fontSize: 16,
    color: '#004D40',
  },
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionBtn: {
    backgroundColor: '#e0f2f1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  suggestionText: {
    color: '#00796B',
    fontWeight: '600',
  },
  summaryContainer: {
    marginBottom: 30,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#004D40',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#004D40',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});