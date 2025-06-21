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
import { auth } from '../../services/firebaseConfig';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LibertisScreenProp = NativeStackNavigationProp<RootStackParamList, 'Libertis'>;

const sampleTransactions = [
  { id: '1', type: 'Envoi', amount: '-5 000 FCFA', date: '2025-06-01' },
  { id: '2', type: 'Réception', amount: '+10 000 FCFA', date: '2025-05-30' },
  { id: '3', type: 'Retrait', amount: '-3 000 FCFA', date: '2025-05-29' },
  { id: '4', type: 'Envoi', amount: '-5 000 FCFA', date: '2025-06-01' },
  { id: '5', type: 'Réception', amount: '+10 000 FCFA', date: '2025-05-30' },
  { id: '6', type: 'Retrait', amount: '-3 000 FCFA', date: '2025-05-29' },
];

const LibertisScreen = () => {
  const navigation = useNavigation<LibertisScreenProp>();
  const [username, setUsername] = useState('');
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUsername(currentUser.displayName || 'Utilisateur');
    }
  }, []);

  const handleNavigateToLibertisTransaction = () => {
    try {
      console.log('Navigation LibertisTransaction démarrée');
      navigation.navigate('LibertisTransactions');
    } catch (err) {
      console.error('Erreur navigation LibertisTransaction', err);
    }
  };

  const filteredTransactions = sampleTransactions.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.type.toLowerCase().includes(query) ||
      item.amount.toLowerCase().includes(query) ||
      item.date.includes(query)
    );
  });

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.contentWrapper}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.welcome}>
                Bonjour {username}, bienvenue sur votre compte Libertis
              </Text>

              <Text style={styles.balanceLabel}>Solde actuel</Text>
              <Text style={styles.balanceValue}>15 000 FCFA</Text>

              {/* Transactions récentes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transactions récentes</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher une transaction"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {filteredTransactions.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.transactionItem}>
                    <Text style={styles.transactionType}>{item.type}</Text>
                    <Text style={styles.transactionAmount}>{item.amount}</Text>
                    <Text style={styles.transactionDate}>{item.date}</Text>
                  </View>
                ))}

                {sampleTransactions.length > 3 && (
                  <TouchableOpacity
                    onPress={handleNavigateToLibertisTransaction}
                    style={styles.toggleButton}
                  >
                    <Text style={styles.toggleText}>Consulter tout l'historique</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Mes coffres */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mes coffres</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="wallet" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Coffres standards</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="wallet" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Coffres bloqués</Text>
                </TouchableOpacity>
              </View>

              {/* Mes opérations */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mes opérations</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.operationButton}>
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

              {/* Gestion */}
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
                  <Text style={styles.buttonText}>Contacts Libertis</Text>
                </TouchableOpacity>
              </View>

              {/* Bénéficiaires */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bénéficiaires</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="folder" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Mes bénéficiaires</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Ajouter un bénéficiaire</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LibertisScreen;

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