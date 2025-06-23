import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,

  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';


const screenWidth = Dimensions.get('window').width;

const sampleData = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  revenues: [5000, 6000, 5500, 7000, 6500, 7200],
  fixedExpenses: [2000, 2100, 1900, 2200, 2150, 2250],
  variableExpenses: [1000, 1300, 1200, 1400, 1250, 1500],
};

const RapportsScreen = () => {
  const [alertMessage, setAlertMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const totalRevenues = sampleData.revenues.reduce((a, b) => a + b, 0);
  const totalFixedExpenses = sampleData.fixedExpenses.reduce((a, b) => a + b, 0);
  const totalVariableExpenses = sampleData.variableExpenses.reduce((a, b) => a + b, 0);
  const totalExpenses = totalFixedExpenses + totalVariableExpenses;
  const netProfit = totalRevenues - totalExpenses;

  // Alert
  useEffect(() => {
    setAlertMessage(totalExpenses > totalRevenues ? "Attention : vos dépenses dépassent vos revenus !" : '');
  }, [totalExpenses, totalRevenues]);

  useEffect(() => {
    const avgVariable = totalVariableExpenses / sampleData.months.length;
    setSuggestions(avgVariable > 1300 ? ['Réduisez vos dépenses variables, par exemple sur la communication.'] : []);
  }, [totalVariableExpenses]);

  // PDF generation
  const generateHTML = () => `
    <html><head><meta charset="utf-8" />
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #00796B; }
        .profit { color: ${netProfit>=0?'green':'red'}; font-weight: bold; }
        table { width:100%; border-collapse: collapse; margin-top:10px; }
        th,td { border:1px solid #ccc; padding:6px; text-align:center; }
        th { background:#00796B; color:#fff; }
      </style>
    </head><body>
      <h1>Rapport financier</h1>
      <p>Total revenus : ${totalRevenues} FCFA</p>
      <p>Total dépenses : ${totalExpenses} FCFA</p>
      <p>Bénéfice net : <span class="profit">${netProfit} FCFA</span></p>
      <h2>Détail mensuel</h2><table>
        <tr><th>Mois</th><th>Rev.</th><th>Fixes</th><th>Variables</th></tr>
        ${sampleData.months
          .map((m,i) => `<tr><td>${m}</td><td>${sampleData.revenues[i]}</td><td>${sampleData.fixedExpenses[i]}</td><td>${sampleData.variableExpenses[i]}</td></tr>`)
          .join('')}
      </table>
    </body></html>
  `;

  // CSV converter
  const convertToCSV = (data: any[]) => {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    return `${header}\n${rows}`;
  };

  const handleExportPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      const fileName = 'rapport-financier.pdf';
      const newPath = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      await Sharing.shareAsync(newPath, { mimeType: 'application/pdf' });
      Alert.alert('Succès', `PDF enregistré dans le dossier local.`);
    } catch (error) {
      Alert.alert('Erreur', "Export PDF impossible.");
    }
  };


  const handleExportCSV = async () => {
    try {
      const data = sampleData.months.map((m, i) => ({
        Mois: m,
        Revenus: sampleData.revenues[i],
        'Dépenses fixes': sampleData.fixedExpenses[i],
        'Dépenses variables': sampleData.variableExpenses[i],
      }));
      const csv = convertToCSV(data);

      const fileName = 'rapport-financier.csv';
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
      Alert.alert('Succès', `CSV enregistré dans le dossier local.`);
    } catch (error) {
      Alert.alert('Erreur', "Export CSV impossible.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Rapports & Statistiques</Text>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Revenus : {totalRevenues} FCFA</Text>
        <Text style={styles.summaryText}>Dépenses : {totalExpenses} FCFA</Text>
        <Text style={[styles.summaryText, { color: netProfit>=0 ? 'green' : 'red' }]}>
          Bénéfice net : {netProfit} FCFA
        </Text>
      </View>
      {alertMessage ? <View style={styles.alertBox}><Text style={styles.alertText}>{alertMessage}</Text></View> : null}
      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((s, i) => <Text key={i} style={styles.suggestionText}>• {s}</Text>)}
        </View>
      )}
      <Text style={styles.chartTitle}>Revenus vs Dépenses fixes</Text>
      <LineChart
        data={{
          labels: sampleData.months,
          datasets: [
            { data: sampleData.revenues, color: o=>`rgba(0,121,107,${o})` },
            { data: sampleData.fixedExpenses, color: o=>`rgba(244,67,54,${o})` },
          ],
          legend:['Revenus','Dépenses fixes']
        }}
        width={screenWidth-32}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" FCFA"
        chartConfig={{
          backgroundGradientFrom: '#A8E6CF',
          backgroundGradientTo: '#00BCD4',
          decimalPlaces:0,
          color:o=>`rgba(0,121,107,${o})`,
          labelColor:()=>'#004D40',
          style:{borderRadius:16},
        }}
        bezier
        style={{ marginVertical:8, borderRadius:16 }}
      />
      <Text style={styles.chartTitle}>Dépenses variables</Text>
      <BarChart
        data={{
          labels: sampleData.months,
          datasets: [{ data: sampleData.variableExpenses }],
        }}
        width={screenWidth-32}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" FCFA"
        chartConfig={{
          backgroundGradientFrom: '#A8E6CF',
          backgroundGradientTo: '#00BCD4',
          decimalPlaces:0,
          color:o=>`rgba(244,67,54,${o})`,
          labelColor:()=>'#B71C1C',
          style:{borderRadius:16},
        }}
        style={{ marginVertical:8, borderRadius:16 }}
        verticalLabelRotation={30}
      />
      <TouchableOpacity style={styles.button} onPress={handleExportPDF}><Text style={styles.buttonText}>Exporter PDF</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleExportCSV}><Text style={styles.buttonText}>Exporter CSV</Text></TouchableOpacity>
    </ScrollView>
  );
};

export default RapportsScreen;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#e0f2f1' },
  title:{ fontSize:24,fontWeight:'bold',color:'#00796B',marginBottom:12,textAlign:'center' },
  summary:{ backgroundColor:'#fff',padding:12,borderRadius:8,marginBottom:12,alignItems:'center' },
  summaryText:{ fontSize:16 },
  alertBox:{ backgroundColor:'#ffcccc',padding:10,borderRadius:6,marginBottom:10 },
  alertText:{ color:'#cc0000',fontWeight:'bold',textAlign:'center' },
  suggestionBox:{ backgroundColor:'#e1f5fe',padding:10,borderRadius:6,marginBottom:12 },
  suggestionText:{ fontSize:14 },
  chartTitle:{ fontSize:18,fontWeight:'bold',color:'#004D40',marginTop:10,textAlign:'center' },
  button:{ backgroundColor:'#00796B',padding:12,borderRadius:8,marginVertical:6,marginHorizontal:40,alignItems:'center' },
  buttonText:{ color:'#fff',fontWeight:'bold' },
});