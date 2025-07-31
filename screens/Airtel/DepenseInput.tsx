// DepenseInput.tsx
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  depense: {
    id: string;
    nom: string;
    montant: number | null;
    type: 'Fixe' | 'Variable';
  };
  invalide: boolean;
  modifierDepense: (id: string, champ: 'nom' | 'montant', valeur: string) => void;
  supprimerDepense: (id: string) => void;
};

const DepenseInput = ({ depense, invalide, modifierDepense, supprimerDepense }: Props) => (
  <View style={styles.depenseRow}>
    <TextInput
      style={[styles.input, styles.depenseInputNom, invalide && styles.erreur]}
      placeholder="Nom"
      value={depense.nom}
      onChangeText={(text) => modifierDepense(depense.id, 'nom', text)}
      placeholderTextColor="#aaa"
    />
    <TextInput
      style={[styles.input, styles.depenseInputMontant, invalide && styles.erreur]}
      keyboardType="numeric"
      placeholder="Montant"
      value={depense.montant !== null ? depense.montant.toString() : ''}
      onChangeText={(text) => modifierDepense(depense.id, 'montant', text)}
      placeholderTextColor="#aaa"
    />
    <TouchableOpacity onPress={() => supprimerDepense(depense.id)} style={styles.deleteBtn}>
      <MaterialIcons name="delete" size={24} color="#e53935" />
    </TouchableOpacity>
  </View>
);

export default DepenseInput;

const styles = StyleSheet.create({
  depenseRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    fontSize: 16,
    color: '#263238',
    fontWeight: '600',
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
  erreur: {
    borderColor: '#e53935',
  },
});
