//CreateEntrepriseScreen
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';

import { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createEnterpriseUser } from '../services/enterpriseService'; // Nouveau import

type CreateEnterpriseScreenRouteProp = RouteProp<RootStackParamList, 'CreateEnterpriseScreen'>;

interface CreateEnterpriseScreenProps {
  route: CreateEnterpriseScreenRouteProp;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GestionEntrepriseScreen'>;

const CreateEnterpriseScreen: React.FC<CreateEnterpriseScreenProps> = ({ route }) => {
  // Récupère userId depuis route params
  const userId = route.params?.userId;

  if (!userId) {
    Alert.alert('Erreur', "ID utilisateur manquant");
    return null;
  }

  const [nom, setNom] = useState('');
  const [rccm, setRccm] = useState('');
  const [nif, setNif] = useState('');
  const [formeJuridique, setFormeJuridique] = useState('');
  const [secteur, setSecteur] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');

  // Données dirigeant (simplifié ici, mais tu peux ajouter un form complet)
  const [managerNom, setManagerNom] = useState('');
  const [managerFonction, setManagerFonction] = useState('');
  const [managerEmail, setManagerEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  // Simule la récupération de l'utilisateur connecté (typiquement via auth.currentUser)
  // Ici on passe userId via params donc on l’utilise directement
  // À adapter selon ta logique d'authentification réelle
  const user = {
    uid: userId,
    email: 'exemple@mail.com', // À récupérer dynamiquement en vrai
    displayName: managerNom || undefined,
  };

  const createEnterprise = async () => {
  // Vérification basique des champs obligatoires
  if (!nom.trim() || !rccm.trim() || !nif.trim() || !managerNom.trim() || !managerEmail.trim()) {
    Alert.alert('Erreur', 'Merci de remplir tous les champs obligatoires');
    return;
  }

  setLoading(true);

  try {
    // Prépare les objets enterpriseData et managerData
    const enterpriseData = { nom, rccm, nif, formeJuridique, secteur, adresse, telephone };
    const managerData = { nom: managerNom, fonction: managerFonction, email: managerEmail };

    await createEnterpriseUser(user, enterpriseData, managerData);

    Alert.alert('Succès', 'Entreprise créée avec succès !');
    navigation.navigate('GestionEntrepriseScreen');
  } catch (error: any) {
    console.error('Erreur création entreprise:', error);
    Alert.alert('Erreur', error.message || "La création de l'entreprise a échoué.");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <TextInput placeholder="Nom de l'entreprise *" value={nom} onChangeText={setNom} style={styles.input} />
      <TextInput placeholder="RCCM *" value={rccm} onChangeText={setRccm} style={styles.input} />
      <TextInput placeholder="NIF *" value={nif} onChangeText={setNif} style={styles.input} />
      <TextInput placeholder="Forme Juridique" value={formeJuridique} onChangeText={setFormeJuridique} style={styles.input} />
      <TextInput placeholder="Secteur" value={secteur} onChangeText={setSecteur} style={styles.input} />
      <TextInput placeholder="Adresse" value={adresse} onChangeText={setAdresse} style={styles.input} />
      <TextInput placeholder="Téléphone" value={telephone} onChangeText={setTelephone} style={styles.input} />

      <TextInput placeholder="Nom du dirigeant *" value={managerNom} onChangeText={setManagerNom} style={styles.input} />
      <TextInput placeholder="Fonction du dirigeant" value={managerFonction} onChangeText={setManagerFonction} style={styles.input} />
      <TextInput placeholder="Email du dirigeant *" value={managerEmail} onChangeText={setManagerEmail} style={styles.input} />

      <Button title={loading ? "Création..." : "Créer l'entreprise"} onPress={createEnterprise} disabled={loading} />
    </View>
  );
};

export default CreateEnterpriseScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  input: { marginBottom: 15, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, fontSize: 16, backgroundColor: '#fff' },
});