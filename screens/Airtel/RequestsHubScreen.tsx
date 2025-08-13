// screens/airtel/RequestsHubScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RequestsHubScreen'>;

export default function RequestsHubScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demandes</Text>

      <TouchableOpacity
        style={[styles.btn, styles.primary]}
        onPress={() => navigation.navigate('RequestPaymentScreen' as any)}
      >
        <Text style={styles.btnText}>Demander un paiement</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.secondary]}
        onPress={() => navigation.navigate('RequestsInboxScreen', { filter: 'received'})}
      >
        <Text style={styles.btnText}>Historique des demandes</Text>
        <Text style={styles.caption}>(reçues & envoyées)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:20, backgroundColor:'#F5F5F5'},
  title:{ fontSize:20, fontWeight:'bold', marginBottom:20 },
  btn:{ paddingVertical:14, borderRadius:8, alignItems:'center', marginBottom:12 },
  primary:{ backgroundColor:'#00796B' },
  secondary:{ backgroundColor:'#26A69A' },
  btnText:{ color:'#fff', fontWeight:'bold' },
  caption:{ color:'#fff', marginTop:4, fontSize:12, opacity:0.9 },
});
