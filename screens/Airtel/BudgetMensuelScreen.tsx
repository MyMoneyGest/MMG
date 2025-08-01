// ✅ Version finale MVP - BudgetMensuelScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

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

type Depense = {
  id: string;
  nom: string;
  montant: number | null;
  type: 'Fixe' | 'Variable';
};

const BudgetMensuelScreen = () => {
  const [salaire, setSalaire] = useState('');
  const [autresRevenus, setAutresRevenus] = useState('');
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [showSuggestionsFixes, setShowSuggestionsFixes] = useState(false);
  const [showSuggestionsVariables, setShowSuggestionsVariables] = useState(false);

  const parseMontant = (str: string | number | null | undefined) => {
    if (!str) return 0;
    const stringValue = String(str);
    const cleaned = stringValue.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const fetchBudget = async () => {
      const currentUser = getAuth().currentUser;
      if (!currentUser) return;
      const ref = doc(db, 'users', currentUser.uid, 'budgets', 'current');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setSalaire(String(data.salaire || ''));
        setAutresRevenus(String(data.autresRevenus || ''));
        setDepenses(data.depenses || []);
      }
    };
    fetchBudget();
  }, []);

  const totalRevenus = parseMontant(salaire) + parseMontant(autresRevenus);
  const totalDepenses = depenses.reduce((acc, d) => acc + (d.montant ?? 0), 0);
  const solde = totalRevenus - totalDepenses;

  const ajouterDepense = (type: 'Fixe' | 'Variable') => {
    setDepenses((old) => [...old, { id: uuidv4(), nom: '', montant: null, type }]);
  };

  const modifierDepense = (id: string, champ: 'nom' | 'montant', valeur: string) => {
    setDepenses((old) =>
      old.map((d) =>
        d.id === id
          ? champ === 'nom'
            ? { ...d, nom: valeur }
            : { ...d, montant: valeur === '' ? null : parseMontant(valeur) }
          : d
      )
    );
  };

  const supprimerDepense = (id: string) => {
    setDepenses((old) => old.filter((d) => d.id !== id));
  };

  const ajouterSuggestion = (depense: Omit<Depense, 'id'>) => {
    const exists = depenses.some(
      (d) => d.nom.trim().toLowerCase() === depense.nom.trim().toLowerCase() && d.type === depense.type
    );
    if (exists) {
      Alert.alert('Info', 'Cette dépense est déjà ajoutée.');
      return;
    }
    setDepenses((old) => [...old, { ...depense, id: uuidv4() }]);
  };

  const validerBudget = async () => {
    if (totalRevenus <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir au moins un revenu valide.');
      return;
    }
    if (depenses.some(d => !d.nom.trim() || d.montant === null || d.montant <= 0)) {
      Alert.alert('Erreur', 'Veuillez remplir correctement toutes les dépenses (nom et montant > 0).');
      return;
    }

    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) return;

      const ref = doc(db, 'users', currentUser.uid, 'budgets', 'current');
      await setDoc(ref, {
        salaire,
        autresRevenus,
        depenses,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Succès', 'Budget enregistré avec succès !');
    } catch (error) {
      console.error('Erreur Firestore :', error);
      Alert.alert('Erreur', "Impossible d'enregistrer le budget.");
    }
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
        />
        <Text style={[styles.label, { marginTop: 16 }]}>Autres revenus (FCFA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ex: 50000"
          value={autresRevenus}
          onChangeText={setAutresRevenus}
        />
      </View>

      {/* DÉPENSES FIXES */}
      <View style={styles.section}>
        <Text style={styles.subTitle}>Dépenses fixes</Text>
        {depenses.filter(d => d.type === 'Fixe').map((d) => (
          <View key={d.id} style={styles.depenseRow}>
            <TextInput
              style={[styles.input, styles.depenseInputNom]}
              placeholder="Nom"
              value={d.nom}
              onChangeText={(text) => modifierDepense(d.id, 'nom', text)}
            />
            <TextInput
              style={[styles.input, styles.depenseInputMontant]}
              keyboardType="numeric"
              placeholder="Montant"
              value={d.montant !== null ? d.montant.toString() : ''}
              onChangeText={(text) => modifierDepense(d.id, 'montant', text)}
            />
            <TouchableOpacity onPress={() => supprimerDepense(d.id)} style={styles.deleteBtn}>
              <MaterialIcons name="delete" size={22} color="#e53935" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={() => ajouterDepense('Fixe')} style={styles.addButton}>
          <MaterialIcons name="add" size={20} color="#00796B" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSuggestionsFixes(!showSuggestionsFixes)}>
          <Text style={styles.suggestionToggle}>
            {showSuggestionsFixes ? 'Masquer' : 'Voir'} suggestions fixes
          </Text>
        </TouchableOpacity>
        {showSuggestionsFixes && (
          <View style={styles.suggestionList}>
            {suggestionsFixes.map((sugg) => (
              <TouchableOpacity
                key={sugg.nom}
                style={styles.suggestionBtn}
                onPress={() =>
                  ajouterSuggestion({ type: 'Fixe', nom: sugg.nom, montant: sugg.montant })
                }
              >
                <Text style={styles.suggestionText}>
                  {`${sugg.nom} - ${sugg.montant.toLocaleString()} FCFA`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* DÉPENSES VARIABLES */}
      <View style={styles.section}>
        <Text style={styles.subTitle}>Dépenses variables</Text>
        {depenses.filter(d => d.type === 'Variable').map((d) => (
          <View key={d.id} style={styles.depenseRow}>
            <TextInput
              style={[styles.input, styles.depenseInputNom]}
              placeholder="Nom"
              value={d.nom}
              onChangeText={(text) => modifierDepense(d.id, 'nom', text)}
            />
            <TextInput
              style={[styles.input, styles.depenseInputMontant]}
              keyboardType="numeric"
              placeholder="Montant"
              value={d.montant !== null ? d.montant.toString() : ''}
              onChangeText={(text) => modifierDepense(d.id, 'montant', text)}
            />
            <TouchableOpacity onPress={() => supprimerDepense(d.id)} style={styles.deleteBtn}>
              <MaterialIcons name="delete" size={22} color="#e53935" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={() => ajouterDepense('Variable')} style={styles.addButton}>
          <MaterialIcons name="add" size={20} color="#00796B" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSuggestionsVariables(!showSuggestionsVariables)}>
          <Text style={styles.suggestionToggle}>
            {showSuggestionsVariables ? 'Masquer' : 'Voir'} suggestions variables
          </Text>
        </TouchableOpacity>
        {showSuggestionsVariables && (
          <View style={styles.suggestionList}>
            {suggestionsVariables.map((sugg) => (
              <TouchableOpacity
                key={sugg.nom}
                style={styles.suggestionBtn}
                onPress={() =>
                  ajouterSuggestion({ type: 'Variable', nom: sugg.nom, montant: sugg.montant })
                }
              >
                <Text style={styles.suggestionText}>
                  {`${sugg.nom} - ${sugg.montant.toLocaleString()} FCFA`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* RÉSUMÉ */}
      {totalRevenus > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Revenus : {totalRevenus.toLocaleString()} FCFA</Text>
          <Text style={styles.summaryLabel}>Dépenses : {totalDepenses.toLocaleString()} FCFA</Text>
          <Text style={styles.summaryLabel}>Solde : {solde.toLocaleString()} FCFA</Text>
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={validerBudget}>
        <Text style={styles.submitText}>Enregistrer le budget</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BudgetMensuelScreen;

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 28, color: '#004D40' },
  section: { marginBottom: 30 },
  label: { fontWeight: '600', marginBottom: 10, fontSize: 16 },
  subTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, color: '#00796B' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    fontSize: 15,
    color: '#263238',
    marginBottom: 10,
  },
  depenseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  depenseInputNom: { flex: 2 },
  depenseInputMontant: { flex: 1, marginLeft: 8 },
  deleteBtn: { marginLeft: 8, backgroundColor: '#ffebee', padding: 6, borderRadius: 6 },
  addButton: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  addButtonText: { marginLeft: 8, fontWeight: '600', color: '#004D40' },
  suggestionToggle: { color: '#00796B', marginTop: 10, fontWeight: '600' },
  suggestionList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  suggestionBtn: {
    backgroundColor: '#c8e6c9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: { color: '#2e7d32', fontWeight: '600' },
  summaryContainer: { padding: 16, backgroundColor: '#e0f2f1', borderRadius: 16, marginBottom: 30 },
  summaryLabel: { fontSize: 16, fontWeight: '600', color: '#004D40', marginBottom: 6 },
  submitBtn: { backgroundColor: '#00796B', paddingVertical: 16, borderRadius: 20 },
  submitText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 17 },
});