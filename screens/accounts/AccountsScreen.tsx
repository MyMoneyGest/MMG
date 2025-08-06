import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Accounts'>;

const AccountsScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const scaleAirtel = useRef(new Animated.Value(1)).current;
  const scaleMoov = useRef(new Animated.Value(1)).current;
  const scaleBank = useRef(new Animated.Value(1)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const onPressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handleAirtelAccess = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const airtelRef = doc(db, 'users', currentUser.uid, 'linkedAccounts', 'airtel');
      const docSnap = await getDoc(airtelRef);

      if (docSnap.exists()) {
        navigation.navigate('AirtelMoney');
      } else {
        navigation.navigate('LinkAirtelScreen');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du compte Airtel :', error);
      alert("Impossible d'accéder aux données Airtel.");
    }
  };

  const handleBankAccess = () => alert('Fonctionnalité Compte bancaire à venir');
  const handleMoovAccess = () => alert('Fonctionnalité Moov Money à venir');

  return (
    <LinearGradient colors={['#F0F4F8', '#D9E6F2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Mes comptes</Text>
        <Text style={styles.subtitle}>Suivez vos transactions et votre solde en temps réel.</Text>

        {/* Compte bancaire */}
        <TouchableWithoutFeedback
          onPress={handleBankAccess}
          onPressIn={() => onPressIn(scaleBank)}
          onPressOut={() => onPressOut(scaleBank)}
        >
          <Animated.View
            style={[
              styles.card,
              styles.bankCard,
              {
                transform: [{ scale: scaleBank }],
                opacity: fadeAnim,
                translateY: slideAnim,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="wallet-outline" size={22} color="#3A86FF" />
              <Text style={[styles.cardTitle, { color: '#3A86FF' }]}>Compte bancaire</Text>
            </View>
            <Text style={[styles.cardBalance, { color: '#0D3B66' }]}>•••• 1234</Text>
            <Text style={styles.moovDetails}>Solde: 8 430,50 FCFA</Text>
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Airtel Money */}
        <TouchableWithoutFeedback
          onPress={handleAirtelAccess}
          onPressIn={() => onPressIn(scaleAirtel)}
          onPressOut={() => onPressOut(scaleAirtel)}
        >
          <Animated.View
            style={[
              styles.card,
              styles.airtelCard,
              {
                transform: [{ scale: scaleAirtel }],
                opacity: fadeAnim,
                translateY: slideAnim,
              },
            ]}
          >
            <View style={styles.airtelHeader}>
              <Ionicons name="wallet-outline" size={22} color="#FFF" />
              <Text style={styles.airtelTitle}>Airtel Money</Text>
            </View>
            <View style={styles.airtelContent}>
              <Text style={styles.airtelBalance}>•••• 5678</Text>
              <Text style={styles.airtelDetails}>Solde: 8 430,50 FCFA</Text>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Moov Money */}
        <TouchableWithoutFeedback
          onPress={handleMoovAccess}
          onPressIn={() => onPressIn(scaleMoov)}
          onPressOut={() => onPressOut(scaleMoov)}
        >
          <Animated.View
            style={[
              styles.card,
              styles.moovCard,
              {
                transform: [{ scale: scaleMoov }],
                opacity: fadeAnim,
                translateY: slideAnim,
              },
            ]}
          >
            <View style={styles.moovHeader}>
              <Ionicons name="cash-outline" size={22} color="#FFF" />
              <Text style={styles.moovTitle}>Moov Money</Text>
            </View>
            <View style={styles.moovContent}>
              <Text style={styles.moovBalance}>•••• 9012</Text>
              <Text style={styles.moovDetails}>Solde: 3 200,00 FCFA</Text>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AccountsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 5,
    justifyContent: 'center',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#1B262C',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#3A86FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  bankCard: {
    backgroundColor: '#E8F0FE',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  cardBalance: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },

  airtelCard: {
    backgroundColor: '#D80000',
    shadowColor: '#9B0000',
  },
  airtelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  airtelTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 12,
    letterSpacing: 1,
  },
  airtelContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  airtelBalance: {
    color: '#D80000',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 2,
  },
  airtelDetails: {
    color: '#9B0000',
    fontWeight: '700',
    fontSize: 14,
  },

  moovCard: {
    backgroundColor: '#005BBB', // bleu Moov
    shadowColor: '#003974',
    overflow: 'hidden',
  },
  moovHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  moovTitle: {
    color: '#FFA500', // orange Moov
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 12,
    letterSpacing: 1,
  },
  moovContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  moovBalance: {
    color: '#005BBB',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 2,
  },
  moovDetails: {
    color: '#003974',
    fontWeight: '700',
    fontSize: 14,
  },
});