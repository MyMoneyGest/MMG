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
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { Bell } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';

const AirtelMoneyScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AirtelMoney'>>();
  const [username, setUsername] = useState('');
  const [airtelTransactions, setAirtelTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [airtelBalance, setairtelBalance] = useState<number | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

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

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnread(!snapshot.empty);
    });

    return () => unsubscribe();
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
    .slice(0, 3);

  const [showOperations, setShowOperations] = useState(false);
  const [showVaults, setShowVaults] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);

  const insets = useSafeAreaInsets();
      
  return (
  <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')}>
            <View style={{ position: 'relative', padding: 10 }}>
              <Bell size={24} color="#333" />
              {hasUnread && <View style={styles.badge} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.welcome}>Bonjour {username}, bienvenue sur votre compte Airtel Money</Text>
          <Text style={styles.balanceLabel}>Solde actuel</Text>
          <Text
            style={[
              styles.balanceValue,
              airtelBalance !== null && airtelBalance > 0 && { color: '#2E7D32' },
              airtelBalance !== null && airtelBalance <= 0 && { color: '#000' },
            ]}
          >
            {airtelBalance !== null ? `${airtelBalance.toLocaleString()} FCFA` : 'Chargement...'}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par type, montant, date..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {filteredTransactions.map((item) => {
              const isReceived = item.type === 'Virement reçu';
              const amountText = `${isReceived ? '+' : ''}${item.amount} FCFA`;

              return (
                <View key={item.reference} style={styles.transactionItem}>
                  <Text style={styles.transactionType}>{item.type}</Text>
                  <Text style={[styles.transactionAmount, { color: isReceived ? '#2E7D32' : '#000' }]}>
                    {amountText}
                  </Text>
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
              );
            })}

            <TouchableOpacity onPress={handleNavigateToAirtelMoneyAllTransactions} style={styles.toggleButton}>
              <Text style={styles.toggleText}>Consulter tout l'historique</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Tabs */}
        <View style={styles.bottomTabs}>
          <TouchableOpacity onPress={() => setShowVaults(true)} style={styles.tabButton}>
            <Ionicons name="wallet" size={20} color="#fff" />
            <Text style={styles.tabLabel}>Coffres</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowOperations(true)} style={styles.tabButton}>
            <MaterialIcons name="compare-arrows" size={20} color="#fff" />
            <Text style={styles.tabLabel}>Opérations</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowManagement(true)} style={styles.tabButton}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.tabLabel}>Gestion</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowBeneficiaries(true)} style={styles.tabButton}>
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.tabLabel}>Bénéf.</Text>
          </TouchableOpacity>
        </View>

        {/* -------- Modals -------- */}
        {showVaults && (
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowVaults(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToVaults}>
              <Ionicons name="wallet" size={20} color="#fff" />
              <Text style={styles.buttonText}>Mes coffres</Text>
            </TouchableOpacity>
          </View>
        )}

        {showOperations && (
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowOperations(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleNavigateToSendMoney}>
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text style={styles.buttonText}>Envoyer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome name="money" size={20} color="#fff" />
              <Text style={styles.buttonText}>Demander</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Recharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <FontAwesome5 name="money-bill-wave" size={20} color="#fff" />
              <Text style={styles.buttonText}>Retirer</Text>
            </TouchableOpacity>
          </View>
        )}

        {showManagement && (
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowManagement(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
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
        )}

        {showBeneficiaries && (
          <View style={styles.modal}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowBeneficiaries(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNavigateToBeneficiaries} style={styles.actionButton}>
              <Ionicons name="folder" size={20} color="#fff" />
              <Text style={styles.buttonText}>Mes bénéficiaires</Text>
            </TouchableOpacity>
          </View>
        )}

          {/* Fond noir sous la barre de navigation */}
<View style={styles.bottomBackground} />

{/* Barre de navigation */}
<View style={styles.bottomTabs}>
  <TouchableOpacity onPress={() => setShowVaults(true)} style={styles.tabButton}>
    <Ionicons name="wallet" size={20} color="#fff" />
    <Text style={styles.tabLabel}>Coffres</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setShowOperations(true)} style={styles.tabButton}>
    <MaterialIcons name="compare-arrows" size={20} color="#fff" />
    <Text style={styles.tabLabel}>Opérations</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setShowManagement(true)} style={styles.tabButton}>
    <Ionicons name="settings-outline" size={20} color="#fff" />
    <Text style={styles.tabLabel}>Gestion</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setShowBeneficiaries(true)} style={styles.tabButton}>
    <Ionicons name="people" size={20} color="#fff" />
    <Text style={styles.tabLabel}>Bénéf.</Text>
  </TouchableOpacity>
</View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  </LinearGradient>
);
};

export default AirtelMoneyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
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
    paddingHorizontal: 40,
    paddingTop: 1,
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
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  headerInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  dropdownContent: {
    marginTop: 10,
  },
  tabButton: {
    alignItems: 'center',
  },
  tabLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffffee',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1000,
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalCloseText: {
    color: '#00796B',
    fontWeight: 'bold',
  },

  bottomBackground: {
  height: 40, // ou 40 si tu veux plus de marge
  backgroundColor: '#000', // ou une autre couleur foncée
  width: '100%',
  },

  bottomTabs: {
    position: 'absolute',
    bottom: 40, // correspond à la hauteur du fond noir
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#00796B',
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});