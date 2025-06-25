import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProjectsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projets & tâches</Text>
        <TouchableOpacity onPress={() => {}} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={28} color="#00796B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.placeholder}>Aucun projet pour le moment.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProjectsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#004D40',
  },
  addButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  placeholder: {
    textAlign: 'center',
    color: '#607D8B',
    fontSize: 16,
    marginTop: 60,
  },
});