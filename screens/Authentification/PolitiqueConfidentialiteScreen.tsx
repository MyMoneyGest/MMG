import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Mail } from 'lucide-react-native';

const PolitiqueConfidentialiteScreen = () => {
  const navigation = useNavigation();

  const handleEmailClick = () => Linking.openURL('mailto:mymoneygest@gmail.com');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Shield size={16} color="#555" />
            <Text style={styles.cardTitle}>Politique de confidentialité - MyMoneyGest</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.sectionTitle}>1. Données collectées</Text>
            <Text style={styles.sectionText}>
              Nous collectons les données suivantes : nom, prénom, numéro de téléphone, photo de
              profil (optionnelle), et historique de transactions simulées. Ces données sont utilisées
              uniquement pour le bon fonctionnement de l'application.
            </Text>

            <Text style={styles.sectionTitle}>2. Stockage et sécurité</Text>
            <Text style={styles.sectionText}>
              Les données sont stockées sur Firebase (Google). Des règles de sécurité sont appliquées
              pour restreindre l'accès aux seules personnes autorisées.
            </Text>

            <Text style={styles.sectionTitle}>3. Durée de conservation</Text>
            <Text style={styles.sectionText}>
              Les données sont conservées tant que l'utilisateur utilise l'application. Il peut à tout
              moment demander la suppression de ses données via :
            </Text>
            <TouchableOpacity onPress={handleEmailClick} style={[styles.button, styles.secondaryButton]}>
              <Mail size={14} color="#fff" />
              <Text style={[styles.buttonText, { marginLeft: 6 }]}>mymoneygest@gmail.com</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>4. Droits des utilisateurs</Text>
            <Text style={styles.sectionText}>
              Conformément au RGPD et à la loi gabonaise n°001/2011, l'utilisateur dispose d'un droit
              d'accès, de rectification, d'opposition et de suppression de ses données personnelles.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default PolitiqueConfidentialiteScreen;

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: { marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // pas de gap pour compatibilité large
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  cardContent: { marginTop: 8 },
  sectionTitle: { fontWeight: '600', fontSize: 15, marginTop: 12, color: '#1f2937' },
  sectionText: { fontSize: 14, color: '#374151', marginTop: 4 },
  button: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: { backgroundColor: '#00796B' },
  buttonText: { color: '#fff', fontWeight: '600' },
});