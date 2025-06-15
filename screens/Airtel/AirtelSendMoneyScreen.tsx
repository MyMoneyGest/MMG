import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

const AirtelSendMoneyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = auth.currentUser;
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [airtelBalance, setAirtelBalance] = useState<number>(0);

  useEffect(() => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);

  const unsubscribe = onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      setAirtelBalance(data.linkedAccounts?.airtelBalance || 0); // si tu veux aussi afficher le solde
      setBeneficiaries(data.beneficiaries || []);
    } else {
      setBeneficiaries([]);
    }
  });

  return () => unsubscribe();
}, []);


  const handleSelectBeneficiary = (beneficiary: any) => {
    navigation.navigate('SendAmountAirtelScreen', { beneficiary });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Envoyer de l’argent</Text>
      </View>

      <Text style={styles.balance}>Solde Airtel : {airtelBalance.toLocaleString()} FCFA</Text>

      <Text style={styles.subtitle}>Choisissez un bénéficiaire :</Text>

      <FlatList
        data={beneficiaries}
        keyExtractor={(item, index) => `${item.phone}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.beneficiaryItem}
            onPress={() => handleSelectBeneficiary(item)}
          >
            <Text style={styles.beneficiaryText}>
              {item.name} ({item.phone})
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
            Aucun bénéficiaire trouvé.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default AirtelSendMoneyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F0F0F0' },
  balance: { fontSize: 16, marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: '600', marginVertical: 10 },
  beneficiaryItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  beneficiaryText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#ffffffcc',
    borderBottomWidth: 1,
    borderBottomColor: '#00796B',
  },
  title: {
    fontSize: 20,
    color: '#00796B',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});