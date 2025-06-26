//AirtelSendMoneyScreen
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebaseConfig';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AirtelSendMoneyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [airtelBalance, setAirtelBalance] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const beneficiariesRef = collection(db, 'users', user.uid, 'beneficiaries');

    const unsubscribe = onSnapshot(beneficiariesRef, (querySnapshot) => {
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBeneficiaries(fetched);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const airtelRef = doc(db, 'users', user.uid, 'linkedAccounts', 'airtel');

    const unsubscribe = onSnapshot(airtelRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAirtelBalance(data.airtelBalance || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectBeneficiary = (beneficiary: any) => {
    navigation.navigate('SendAmountAirtelScreen', { beneficiary });
  };

  const handleAddBeneficiary = () => {
    navigation.navigate('AirtelBeneficiairesScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Envoyer de l’argent</Text>
        <TouchableOpacity onPress={handleAddBeneficiary}>
          <Text style={styles.addButton}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Solde Airtel</Text>
          <Text style={styles.balanceValue}>{airtelBalance.toLocaleString()} FCFA</Text>
        </View>

        <Text style={styles.subtitle}>Choisissez un bénéficiaire</Text>

        {beneficiaries.length === 0 ? (
          <Text style={styles.emptyText}>Aucun bénéficiaire trouvé.</Text>
        ) : (
          beneficiaries.map((item, index) => (
            <TouchableOpacity
              key={`${item.phone}-${index}`}
              style={styles.beneficiaryCard}
              onPress={() => handleSelectBeneficiary(item)}
            >
              <Text style={styles.beneficiaryName}>{item.name}</Text>
              <Text style={styles.beneficiaryPhone}>{item.phone}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
    </SafeAreaView>
  );
};

export default AirtelSendMoneyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffffcc',
    borderBottomWidth: 1,
    borderBottomColor: '#00796B',
  },
  title: {
    fontSize: 20,
    color: '#00796B',
    fontWeight: 'bold',
  },
  addButton: {
    fontSize: 16,
    color: '#00796B',
    fontWeight: '600',
  },
  balanceBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#555',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004D40',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#004D40',
  },
  beneficiaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00796B',
  },
  beneficiaryPhone: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#999',
  },
  returnWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  returnButton: {
    backgroundColor: '#00796B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});