import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const data = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  datasets: [
    {
      data: [120000, 95000, 130000, 110000, 140000, 100000], // Revenus
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      label: 'Revenus',
    },
    {
      data: [70000, 85000, 65000, 80000, 90000, 75000], // Dépenses
      color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
      label: 'Dépenses',
    },
  ],
};

const chartConfig = {
  backgroundGradientFrom: '#A8E6CF',
  backgroundGradientTo: '#00BCD4',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.5,
  style: {
    borderRadius: 16,
  },
};

const EntrepriseRapportsScreen = () => {
  const totalRevenus = data.datasets[0].data.reduce((a, b) => a + b, 0);
  const totalDepenses = data.datasets[1].data.reduce((a, b) => a + b, 0);
  const solde = totalRevenus - totalDepenses;

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Rapports & Statistiques</Text>

          <View style={styles.statsContainer}>
            <Text style={styles.statLine}>
              Total revenus : <Text style={styles.statValue}>{totalRevenus.toLocaleString()} FCFA</Text>
            </Text>
            <Text style={styles.statLine}>
              Total dépenses : <Text style={styles.statValue}>{totalDepenses.toLocaleString()} FCFA</Text>
            </Text>
            <Text style={styles.statLine}>
              Solde net :{' '}
              <Text style={[styles.statValue, { color: solde >= 0 ? '#2E7D32' : '#B71C1C' }]}>
                {solde.toLocaleString()} FCFA
              </Text>
            </Text>
          </View>

          <Text style={styles.chartTitle}>Évolution mensuelle</Text>
          <BarChart
            data={{
              labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
              datasets: [
                { data: [120000, 95000, 130000, 110000, 140000, 100000] }
              ],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" FCFA"
            fromZero={true}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={styles.chart}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EntrepriseRapportsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#ffffffee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statLine: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#00796B',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
  },
});