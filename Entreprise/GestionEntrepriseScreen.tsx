import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GestionEntrepriseScreen'>;

const EntrepriseScreen = () => {
  const navigation = useNavigation<NavigationProp>();

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

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00796B',
  },
});