import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DevisScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Devis</Text>
        <TouchableOpacity onPress={() => {}} style={styles.addButton}>
          <Ionicons name="create-outline" size={28} color="#00796B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.placeholder}>Aucun devis enregistré.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DevisScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#33691E',
  },
  addButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  placeholder: {
    textAlign: 'center',
    color: '#789262',
    fontSize: 16,
    marginTop: 60,
  },
});