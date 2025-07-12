// CompanyAccountScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CompanyAccountScreen'>;

const CompanyAccountScreen: React.FC<Props> = ({ route, navigation }) => {
  const { companyId } = route.params;

  if (!companyId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erreur : ID entreprise manquant.</Text>
      </View>
    );
  }

  // Typage strict : les écrans doivent exister dans RootStackParamList
type AccountScreens = 'CompteBancaireEntrepriseScreen' | 'AirtelMoneyEntrepriseScreen' | 'MoovMoneyEntrepriseScreen';

const accounts: { icon: string; label: string; screen: AccountScreens }[] = [
  { icon: 'card-outline', label: 'Compte bancaire', screen: 'CompteBancaireEntrepriseScreen' },
  { icon: 'card-outline', label: 'Airtel Money', screen: 'AirtelMoneyEntrepriseScreen' },
  { icon: 'card-outline', label: 'Moov Money', screen: 'MoovMoneyEntrepriseScreen' },
];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Comptes de l’entreprise</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {accounts.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun compte disponible</Text>
        ) : (
          accounts.map(({ icon, label, screen }) => (
            <TouchableOpacity
              key={screen}
              style={styles.card}
              onPress={() => navigation.navigate(screen, { companyId })}
            >
              <Ionicons name={icon as any} size={24} color="#004D40" />
              <Text style={styles.cardText}>{label}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompanyAccountScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F7FA' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004D40',
    padding: 16,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  cardText: {
    marginLeft: 16,
    fontSize: 18,
    color: '#004D40',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});