// En haut du fichier
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GestionEntrepriseScreen'>;

const GestionEntrepriseScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [entrepriseName, setEntrepriseName] = useState('Entreprise');
  const [notificationCount, setNotificationCount] = useState(0);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return navigation.replace('UserTypeSelectionScreen');

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (!userData) throw new Error('Données utilisateur manquantes.');

        if (userData.type !== 'entreprise') {
          Alert.alert('Accès restreint', 'Cette section est réservée aux entreprises.');
          return navigation.replace('UserTypeSelectionScreen');
        }

        if (!userData.entrepriseId) {
          Alert.alert("Erreur", "Votre compte n'est lié à aucune entreprise.");
          return navigation.replace('UserTypeSelectionScreen');
        }

        const entrepriseSnap = await getDoc(doc(db, 'entreprises', userData.entrepriseId));
        const entreprise = entrepriseSnap.data();

        if (!entreprise) throw new Error('Entreprise non trouvée.');

        setIsAdmin(entreprise.createdBy === user.uid);
        setEntrepriseName(entreprise.nom || 'Entreprise');
        setCompanyId(userData.entrepriseId);  // ← ici on sauvegarde l’ID

      } catch (error) {
        console.error(error);
        Alert.alert('Erreur', 'Impossible de charger les données.');
        navigation.replace('UserTypeSelectionScreen');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigation]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    return onSnapshot(notificationsRef, snap => {
      const unread = snap.docs.filter(doc => !doc.data().opened).length;
      setNotificationCount(unread);
    });
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Quitter', 'Retourner à l’accueil ?', [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', onPress: () => navigation.replace('HomeScreen') },
      ]);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00796B" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#E0F7FA', '#B2EBF2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏢 {entrepriseName}</Text>
          <Text style={styles.roleTag}>{isAdmin ? 'Administrateur' : 'Collaborateur'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>🎯 Actions rapides</Text>

          {/* Boutons classiques */}
          {[
            { icon: 'cash-outline', label: 'Suivi des revenus', screen: 'EntrepriseRevenusScreen' },
            { icon: 'card-outline', label: 'Dépenses', screen: 'DepenseProfessionnellesScreen' },
            { icon: 'document-text-outline', label: 'Facturation', screen: 'FacturesScreen' },
            { icon: 'people-outline', label: 'Clients', screen: 'ClientsScreen' },
            { icon: 'bar-chart-outline', label: 'Rapports', screen: 'EntrepriseRapportsScreen' },
            { icon: 'folder-open-outline', label: 'Documents partagés', screen: 'DocumentsScreen' },
            { icon: 'clipboard-outline', label: 'Projets & tâches', screen: 'ProjectsScreen' },
          ].map(({ icon, label, screen }) => (
            <TouchableOpacity key={screen} style={styles.card} onPress={() => navigation.navigate(screen)}>
              <Ionicons name={icon as any} size={22} color="#004D40" />
              <Text style={styles.cardText}>{label}</Text>
            </TouchableOpacity>
          ))}

          {/* Bouton Comptes, uniquement si companyId défini */}
          {companyId && (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CompanyAccountScreen', { companyId })}
            >
              <Ionicons name="wallet-outline" size={22} color="#004D40" />
              <Text style={styles.cardText}>Comptes</Text>
            </TouchableOpacity>
          )}

          {/* Section Admin */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>🔧 Administration</Text>

              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CollaboratorsScreen')}
              >
                <Ionicons name="person-outline" size={22} color="#004D40" />
                <Text style={styles.cardText}>Collaborateurs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AjouterCollaborateurScreen')}
              >
                <Ionicons name="person-add-outline" size={22} color="#004D40" />
                <Text style={styles.cardText}>Ajouter un collaborateur</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => navigation.replace('GestionEntrepriseScreen')}
          >
            <Ionicons name="refresh-outline" size={20} color="#004D40" />
            <Text style={styles.refreshText}>Actualiser</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default GestionEntrepriseScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 20 },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomColor: '#B2DFDB',
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#004D40' },
  roleTag: {
    backgroundColor: '#004D40',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    fontSize: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00796B',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  cardText: { marginLeft: 12, fontSize: 16, fontWeight: '500', color: '#004D40' },
  refreshButton: {
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#004D40',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  refreshText: { color: '#004D40', marginLeft: 6 },
});