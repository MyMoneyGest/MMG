//GestionEntrepriseScreen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GestionEntrepriseScreen'>;

// === Composant Menu Dropdown ===
type MenuDropdownProps = {
  isAdmin: boolean;
  onNavigate: (key: MenuKey) => void;
};

type MenuKey = 
  | 'infos'
  | 'collaborateurs'
  | 'ajout-collaborateur'
  | 'devis'
  | 'documents'
  | 'projets'
  | 'support';

const MenuDropdown: React.FC<MenuDropdownProps> = ({ isAdmin, onNavigate }) => {
  const menuItems = [
    { key: 'infos', label: 'Informations entreprise' },
    ...(isAdmin
      ? [
          { key: 'collaborateurs', label: 'Collaborateurs' },
          { key: 'ajout-collaborateur', label: 'Ajouter un collaborateur' },
        ]
      : []),
    { key: 'devis', label: 'Devis' },
    { key: 'documents', label: 'Documents partagés' },
    { key: 'projets', label: 'Projets & tâches' },
    { key: 'support', label: 'Support & aide' },
  ];

  return (
    <FlatList
      data={menuItems}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onNavigate(item.key as MenuKey)}
        >
          <Text style={styles.menuItemText}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

// === Composant Header avec menu et notifications ===
type HeaderProps = {
  isAdmin: boolean;
  navigation: NavigationProp;
  notificationCount: number;
  enterpriseName: string;
};

const HeaderWithMenuAndNotif: React.FC<HeaderProps> = ({
  isAdmin,
  navigation,
  notificationCount,
  enterpriseName,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleNavigate = (key: MenuKey) => {
    setMenuVisible(false);
    switch (key) {
      case 'ajout-collaborateur':
        navigation.navigate('AjouterCollaborateurScreen');
        break;
      case 'devis':
        navigation.navigate('DevisScreen');
        break;
      case 'documents':
        navigation.navigate('DocumentsScreen');
        break;
      case 'projets':
        navigation.navigate('ProjectsScreen');
        break;
      case 'collaborateurs':
        navigation.navigate('CollaboratorsScreen');
        break;
      case 'infos':
        navigation.navigate('EnterpriseInfoScreen');
        break;
      case 'support':
        navigation.navigate('SupportScreen');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Ionicons name="menu-outline" size={28} color="#004D40" />
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <MenuDropdown isAdmin={isAdmin} onNavigate={handleNavigate} />
          </View>
        </TouchableOpacity>
      </Modal>

      <Text style={styles.headerTitle}>Espace Entreprise</Text>
      <Text style={styles.enterpriseNameHeader}>{enterpriseName}</Text>

      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => navigation.navigate('NotificationsScreen')}
      >
        <Ionicons name="notifications-outline" size={28} color="#004D40" />
        {notificationCount > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{notificationCount}</Text></View>
        )}
      </TouchableOpacity>
    </View>
  );
};


// === Écran principal ===
const EntrepriseScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [enterpriseName, setEnterpriseName] = useState('Entreprise');
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
  const fetchDataAndCheckAccess = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace('UserTypeSelectionScreen');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('✅ userDoc data raw:', userDoc.data());

      const userData = userDoc.data();
      console.log('🛠️ Données utilisateur:', userData); // 🔍 vérifie ici ce que Firestore retourne

      if (!userData || userData.type !== 'enterprise') {
        Alert.alert(
          'Accès restreint',
          'Seuls les comptes entreprise peuvent accéder à cet espace.',
          [{ text: 'OK', onPress: () => navigation.replace('UserTypeSelectionScreen') }],
          { cancelable: false }
        );
        return;
      }

      // Récupère les données de l’entreprise depuis la collection enterprises
      const enterpriseDoc = await getDoc(doc(db, 'enterprises', userData.enterpriseId));
      console.log('✅ enterpriseDoc data raw:', enterpriseDoc.data);
      if (!enterpriseDoc.exists()) {
        Alert.alert(
          'Erreur',
          "L'entreprise associée à votre compte n'a pas été trouvée.",
          [{ text: 'OK', onPress: () => navigation.replace('UserTypeSelectionScreen') }],
          { cancelable: false }
        );
        return;
      }

      const entreprise = enterpriseDoc.data();
      console.log('🏢 Données entreprise:', entreprise);


      setEnterpriseName(entreprise?.nom || 'Entreprise');
      setIsAdmin(entreprise?.createdBy === user.uid);
      setNotificationCount(3); // Exemple temporaire ou mettre ta logique ici

    } catch (error) {
      console.error('Erreur de chargement:', error); // Pour debug
      Alert.alert('Erreur', "Impossible de charger les données de l’entreprise.");
      navigation.replace('UserTypeSelectionScreen');
    } finally {
      setLoading(false);
    }
  };

  fetchDataAndCheckAccess();
}, [navigation]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    const unsubscribeNotifications = onSnapshot(
      notificationsRef,
      snapshot => {
        const unread = snapshot.docs.filter(doc => !doc.data().opened).length;
        setNotificationCount(unread);
      },
      err => console.error('Erreur notifications:', err)
    );

    return () => unsubscribeNotifications();
  }, []);

  
  // Gestion du bouton retour
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Quitter',
        'Voulez-vous vraiment quitter cet espace entreprise ?',
        [
          { text: 'Non', style: 'cancel' },
          { text: 'Oui', onPress: () => navigation.replace('HomeScreen') },
        ],
        { cancelable: true }
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription.remove();
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00796B" />
      </View>
    );
  }


  return (
  <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER avec menu + notifications */}
      <HeaderWithMenuAndNotif
        isAdmin={isAdmin}
        navigation={navigation}
        notificationCount={notificationCount}
        enterpriseName={enterpriseName}
      />


      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Ici tu peux ajouter le dashboard rapide si tu veux */}

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('EntrepriseRevenusScreen')}
        >
          <Ionicons name="cash-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Suivi des revenus</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DepenseProfessionnellesScreen')}
        >
          <Ionicons name="card-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Dépenses professionnelles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('FacturesScreen')}
        >
          <Ionicons name="document-text-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Facturation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        style={styles.card}        
        onPress={() => navigation.navigate('ClientsScreen')}
        >
          <Ionicons name="people-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Clients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('EntrepriseRapportsScreen')}
        >
          <Ionicons name="bar-chart-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Rapports & statistiques</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DevisScreen')}
        >
          <Ionicons name="document-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Devis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DocumentsScreen')}
        >
          <Ionicons name="folder-open-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Documents partagés</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ProjectsScreen')}
        >
          <Ionicons name="clipboard-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Projets & tâches</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Alert.alert(
              'Rafraîchir',
              'Voulez-vous actualiser les données ?',
              [{ text: 'Actualiser', onPress: () => navigation.replace('GestionEntrepriseScreen') }, { text: 'Annuler', style: 'cancel' }]
            );
          }}
        >
          <Ionicons name="refresh-outline" size={24} color="#00796B" />
          <Text style={styles.cardText}>Actualiser les données</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  </LinearGradient>
);
};

export default EntrepriseScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: { padding: 20, paddingTop: 10 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f7fa',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffffee',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#004D40',
    marginLeft: 10,
  },
  enterpriseName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#b2dfdb',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Styles pour menu dropdown et header
  headerContainer: {
    height: 56,
    backgroundColor: '#A8E6CF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    elevation: 3,
  },
  menuButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004D40',
  },
  notificationButton: {
    padding: 6,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 5,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000033',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 56,
    marginLeft: 10,
    borderRadius: 8,
    elevation: 5,
    paddingVertical: 8,
    width: 220,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#004D40',
  },
  enterpriseNameHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004D40',
    marginTop: 2,
  },

});