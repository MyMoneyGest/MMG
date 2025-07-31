import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const MonthlyActivityScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Activité Mensuelle</Text>

        {/* Liste simple */}
        <View style={styles.lineItem}>
          <Text style={styles.label}>Dépenses</Text>
          <Text style={styles.amount}>80 000 FCFA</Text>
        </View>
        <View style={styles.separator} />

        <View style={styles.lineItem}>
          <Text style={styles.label}>Recharges</Text>
          <Text style={styles.amount}>50 000 FCFA</Text>
        </View>
        <View style={styles.separator} />

        <View style={styles.lineItem}>
          <Text style={styles.label}>Virements</Text>
          <Text style={styles.amount}>30 000 FCFA</Text>
        </View>
        <View style={styles.separator} />

        {/* Section Graphique (facultatif) */}
        <View style={styles.chartSection}>
          <Text style={styles.chartHeader}>Graphique d'activité</Text>
          <View style={styles.chartBox}>
            <Text style={styles.chartPlaceholderText}>
              Graphique en cours de développement…
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => alert('Ajouter une activité - à implémenter')}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default MonthlyActivityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  content: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 28,
    textAlign: 'center',
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 16,
    color: '#004D40',
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796B',
  },
  separator: {
    height: 1,
    backgroundColor: '#B2DFDB',
    marginVertical: 4,
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  chartHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00796B',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#004D40',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 34,
    backgroundColor: '#00796B',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
});