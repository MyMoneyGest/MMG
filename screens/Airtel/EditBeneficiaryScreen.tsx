import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

type Beneficiary = {
  id: string;
  name: string;
  phone: string;
};

const EditBeneficiaryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const user = auth.currentUser;

  const { beneficiary } = route.params as { beneficiary: Beneficiary };

  const [name, setName] = useState(beneficiary?.name || '');
  const [phone, setPhone] = useState(beneficiary?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{8,15}$/; // adapte la regex selon ton besoin
    return phoneRegex.test(phone.trim());
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Erreur', 'Veuillez saisir un nom valide (au moins 2 caractères).');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone valide (8 à 15 chiffres).');
      return;
    }

    try {
      setIsSaving(true);
      const benRef = doc(db, 'users', user.uid, 'beneficiaries', beneficiary.id);
      await updateDoc(benRef, {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString(),
      });
      Alert.alert('Succès', 'Bénéficiaire mis à jour.');
      navigation.goBack();
    } catch (error) {
      console.error('Erreur mise à jour bénéficiaire:', error);
      Alert.alert('Erreur', "Échec de la mise à jour. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modifier le bénéficiaire</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nom du bénéficiaire"
          autoCapitalize="words"
          editable={!isSaving}
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Numéro de téléphone"
          keyboardType="phone-pad"
          maxLength={15}
          editable={!isSaving}
        />

        <TouchableOpacity
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditBeneficiaryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F0F0F0' },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: '#00796B',
    fontWeight: 'bold',
  },
  formGroup: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#00796B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#4B9A8B',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});