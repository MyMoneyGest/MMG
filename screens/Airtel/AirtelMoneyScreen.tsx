import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

const AirtelMoneyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AirtelMoney'>>();
  const [username, setUsername] = useState('');
  const [airtelTransactions, setAirtelTransactions] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [airtelBalance, setairtelBalance] = useState<number | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUsername(currentUser.displayName || 'Utilisateur');

    const airtelRef = doc(db, 'users', currentUser.uid, 'linkedAccounts', 'airtel');
    const unsubscribeAirtel = onSnapshot(airtelRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setairtelBalance(data.airtelBalance || 0);
        setAirtelTransactions((data.transactions || []).sort(
          (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    });

    return () => unsubscribeAirtel();
  }, []);

  const handleNavigateToAirtelMoneyAllTransactions = () => {
    navigation.navigate('AirtelMoneyAllTransactions');
  };

  const handleNavigateToVaults = () => {
    navigation.navigate('VaultsScreen');
  };

  const handleNavigateToBeneficiaries = () => {
    navigation.navigate('AirtelBeneficiairesScreen');
  };

  const handleNavigateToSendMoney = () => {
    navigation.navigate('AirtelSendMoneyScreen');
  };


  const filteredTransactions = airtelTransactions
    .filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.type.toLowerCase().includes(query) ||
        item.amount.toString().toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query)
      );
    })
    .slice(0, 3); // Affiche uniquement les 3 plus récentes

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.contentWrapper}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.welcome}>Bonjour {username}, bienvenue sur votre compte Airtel Money</Text>
              <Text style={styles.balanceLabel}>Solde actuel</Text>
              <Text style={styles.balanceValue}>
                {airtelBalance !== null ? `${airtelBalance.toLocaleString()} FCFA` : 'Chargement...'}
              </Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transactions récentes</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par type, montant, date..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {filteredTransactions.map((item) => (
                  <View key={item.reference} style={styles.transactionItem}>
                    <Text style={styles.transactionType}>{item.type}</Text>
                    <Text style={styles.transactionAmount}>{item.amount}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(item.date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity onPress={handleNavigateToAirtelMoneyAllTransactions} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>Consulter tout l'historique</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>Coffres</Text>
                <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToVaults}>
                  <Ionicons name="wallet" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mes coffres</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mes opérations</Text>
                <View style={styles.row}>

                  <TouchableOpacity onPress={handleNavigateToSendMoney} style={styles.actionButton}>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Envoyer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.operationButton}>
                    <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Recharger</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.operationButton}>
                    <FontAwesome5 name="money-bill-wave" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gestion</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="analytics" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Activité mensuelle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="document-text-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Voir mes relevés</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="people" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Contacts Airtel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}> 
                <Text style={styles.sectionTitle}>Bénéficiaires</Text>

                <TouchableOpacity onPress={handleNavigateToBeneficiaries} style={styles.actionButton}>
                  <Ionicons name="folder" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mes bénéficiaires</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={[styles.returnButtonWrapper, { paddingBottom: insets.bottom }]}>
              <TouchableOpacity style={styles.returnButton} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>Retour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AirtelMoneyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrapper: { flex: 1, flexDirection: 'column' },
  scrollContent: { padding: 20 },
  welcome: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#ffffffcc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 10,
  },
  transactionItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  transactionType: { fontWeight: 'bold' },
  transactionAmount: { fontSize: 16 },
  transactionDate: { fontSize: 12, color: '#555' },
  actionButton: {
    backgroundColor: '#00796B',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 10,
  },
  operationButton: {
    flex: 1,
    backgroundColor: '#009688',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  returnButtonWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  returnButton: {
    backgroundColor: '#B71C1C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  toggleText: {
    color: '#00796B',
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
});