//GestionEntreprise
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GestionEntrepriseScreen'>;

const EntrepriseScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [enterpriseName, setEnterpriseName] = useState('');

  const handleNavigateToEntrepriseRevenus = () => {
    navigation.navigate('EntrepriseRevenusScreen');
  };

  const handleNavigateToDepenseProfessionnelles = () => {
    navigation.navigate('DepenseProfessionnellesScreen');
  };

  const handleNavigateToFacturations = () => {
    navigation.navigate('FacturesScreen');
  };

  const handleNavigateToEntrepriseRapport = () => {
    navigation.navigate('EntrepriseRapportsScreen');
  };

  const handleNavigateToUserTypeSelection = () => {
    navigation.navigate('UserTypeSelectionScreen');
  };

  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchDataAndCheckAccess = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    if (!userData?.enterpriseId) {
      Alert.alert('Accès refusé', 'Vous devez rejoindre une entreprise pour accéder à cet espace.');
      navigation.navigate('UserTypeSelectionScreen');
      return;
    }

    const enterpriseDoc = await getDoc(doc(db, 'enterprises', userData.enterpriseId));
    setEnterpriseName(enterpriseDoc.data()?.name || 'Entreprise');

    setLoading(false);
  };

  fetchDataAndCheckAccess();
}, []);

if (loading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#00796B" />
    </View>
  );
}


  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.enterpriseName}>{enterpriseName}</Text>
          <Text style={styles.title}>Espace Entreprise</Text>
          <Text style={styles.subtitle}>Gérez vos finances professionnelles</Text>

          <TouchableOpacity style={styles.card} onPress={handleNavigateToEntrepriseRevenus}>
            <Ionicons name="cash-outline" size={24} color="#00796B"/>
            <Text style={styles.cardText}>Suivi des revenus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleNavigateToDepenseProfessionnelles}>
            <Ionicons name="card-outline" size={24} color="#00796B" />
            <Text style={styles.cardText}>Dépenses professionnelles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleNavigateToFacturations}>
            <Ionicons name="document-text-outline" size={24} color="#00796B" />
            <Text style={styles.cardText}>Facturation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <Ionicons name="people-outline" size={24} color="#00796B" />
            <Text style={styles.cardText}>Clients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleNavigateToEntrepriseRapport}>
            <Ionicons name="bar-chart-outline" size={24} color="#00796B" />
            <Text style={styles.cardText}>Rapports & statistiques</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EntrepriseScreen;

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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f7fa',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
  backgroundColor: '#ffffffee',
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
cardText: {
  fontSize: 17,
  fontWeight: '600',
  color: '#004D40',
},
enterpriseName: {
  fontSize: 20,
  fontWeight: '600',
  color: '#b2dfdb',
  textAlign: 'center',
  marginBottom: 4,
},
});