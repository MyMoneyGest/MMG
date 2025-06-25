import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator'; // Assure-toi que c'est le bon chemin
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CreateEnterpriseScreenRouteProp = RouteProp<RootStackParamList, 'CreateEnterpriseScreen'>;

interface CreateEnterpriseScreenProps {
  route: CreateEnterpriseScreenRouteProp;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GestionEntrepriseScreen'>;

const CreateEnterpriseScreen: React.FC<CreateEnterpriseScreenProps> = ({ route }) => {
  const userId = route.params?.userId;

  if (!userId) {
    Alert.alert('Erreur', 'ID utilisateur manquant');
    return null;
  }

  const [name, setName] = useState('');
  const [siret, setSiret] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>(); // Correctement typé

  const createEnterprise = async () => {
    if (!name.trim() || !siret.trim()) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setLoading(true);

    try {
      const enterpriseRef = doc(db, 'enterprises', userId);

      // Création de l'entreprise dans Firestore
      await setDoc(enterpriseRef, {
        name,
        siret,
        createdAt: serverTimestamp(),
        ownerUid: user.uid,
      });

      // Mise à jour de l'utilisateur
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        enterpriseId: userId,
        accountType: 'enterprise',
        enterpriseName: name,
        enterpriseSiret: siret,
      }, { merge: true });

      // Redirige l'utilisateur vers l'écran de gestion de l'entreprise
      navigation.navigate('GestionEntrepriseScreen'); // Navigation vers l'écran entreprise
      Alert.alert('Succès', 'Entreprise créée avec succès !');
    } catch (error) {
      console.error('Erreur création entreprise:', error);
      Alert.alert('Erreur', 'Une erreur est survenue, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nom de l'entreprise"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="SIRET"
        value={siret}
        onChangeText={setSiret}
        style={styles.input}
      />
      <Button
        title={loading ? "Création..." : "Créer l'entreprise"}
        onPress={createEnterprise} // Appel à la fonction de création d'entreprise
        disabled={loading}
      />
    </View>
  );
};

export default CreateEnterpriseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  input: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});