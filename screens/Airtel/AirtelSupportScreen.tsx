import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';

const AirtelSupportScreen = () => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:mymoneygest@gmail.com');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Support MyMoneyGest</Text>

      <View style={styles.section}>
        <Text style={styles.label}>📍 Adresse</Text>
        <Text style={styles.text}>Paris, France</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>✉️ Contact Email</Text>
        <TouchableOpacity onPress={handleEmailPress}>
          <Text style={styles.link}>mymoneygest@gmail.com</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>ℹ️ À propos</Text>
        <Text style={styles.text}>
          L'application MyMoneyGest vous permet de gérer vos bénéficiaires, vos finances et vos transferts en toute sécurité.
          Pour toute question ou problème technique, n'hésitez pas à nous contacter.
        </Text>
      </View>
    </ScrollView>
  );
};

export default AirtelSupportScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E0F2F1',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#004D40',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    color: '#00796B',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});