//PolitiqueConfidentialiteScreen
import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';

const PolitiqueConfidentialiteScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Politique de confidentialité – MyMoneyGest</Text>

      <Text style={styles.sectionTitle}>1. Données collectées</Text>
      <Text style={styles.paragraph}>
        Nous collectons les données suivantes : nom, prénom, numéro de téléphone, photo de profil (optionnelle), et
        historique de transactions simulées. Ces données sont utilisées uniquement pour le bon fonctionnement
        de l’application.
      </Text>

      <Text style={styles.sectionTitle}>2. Stockage et sécurité</Text>
      <Text style={styles.paragraph}>
        Les données sont stockées sur Firebase (Google). Des règles de sécurité sont appliquées pour restreindre l'accès
        aux seules personnes autorisées.
      </Text>

      <Text style={styles.sectionTitle}>3. Durée de conservation</Text>
      <Text style={styles.paragraph}>
        Les données sont conservées tant que l’utilisateur utilise l’application. Il peut à tout moment demander la
        suppression de ses données via l'adresse mymoneygest@gmail.com.
      </Text>

      <Text style={styles.sectionTitle}>4. Droits des utilisateurs</Text>
      <Text style={styles.paragraph}>
        Conformément au RGPD et à la loi gabonaise n°001/2011, l’utilisateur dispose d’un droit d’accès, de
        rectification, d’opposition et de suppression de ses données personnelles.
      </Text>
    </ScrollView>
  );
};

export default PolitiqueConfidentialiteScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00796B',
    marginTop: 20,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});