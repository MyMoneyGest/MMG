import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProp>();

  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 4,
      tension: 150,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 150,
    }).start();
  };

  // Exemple données wallet (à connecter à ton backend)
  const walletBalance = '1 250,75 €';
  const walletAccounts = 3;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyMoneyGest</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={36} color="#444" />
          <View style={styles.statusBadge} />
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.card}>
        <Text style={styles.welcomeText}>Bienvenue 👋</Text>
        <Text style={styles.description}>
          Gérez vos finances personnelles et professionnelles avec fluidité et élégance.
        </Text>

        {/* Message simple et bouton */}
        <View style={styles.infoBox}>
          <Ionicons name="notifications-outline" size={32} color="#5061FF" style={{marginBottom: 12}} />
          <Text style={styles.infoText}>
            Vous n’avez pas de notifications pour le moment.
          </Text>
        </View>

        {/* Boutons d’action */}
        <View style={styles.buttonsContainer}>
          <AnimatedTouchable
            onPress={() => navigation.navigate('Accounts')}
            style={[styles.button, { transform: [{ scale }] }]}
            activeOpacity={0.9}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Ionicons name="person-outline" size={20} color="#5061FF" style={styles.icon} />
            <Text style={styles.buttonText}>Je suis un particulier</Text>
          </AnimatedTouchable>

          <AnimatedTouchable
            onPress={() => navigation.navigate('GestionEntrepriseScreen')}
            style={[styles.button, styles.enterpriseButton, { transform: [{ scale }] }]}
            activeOpacity={0.9}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Ionicons name="business-outline" size={20} color="#2AC48A" style={styles.icon} />
            <Text style={[styles.buttonText, { color: '#2AC48A' }]}>
              Je gère une entreprise
            </Text>
          </AnimatedTouchable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: 1.2,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6E9F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2AC48A',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    fontWeight: '300',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 6,
  },
  walletContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 36,
    shadowColor: '#5061FF',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  walletIconContainer: {
    marginRight: 24,
    padding: 10,
    backgroundColor: '#D7E1FF',
    borderRadius: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletBalanceLabel: {
    color: '#5061FF',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: 0.7,
  },
  walletBalance: {
    color: '#1C1C1E',
    fontWeight: '700',
    fontSize: 28,
    marginBottom: 6,
    letterSpacing: 1,
  },
  walletAccounts: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#5061FF',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#5061FF',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  enterpriseButton: {
    borderColor: '#2AC48A',
    shadowColor: '#2AC48A',
  },
  icon: {
    marginRight: 14,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5061FF',
  },
  infoBox: {
  width: '100%',
  backgroundColor: '#E6F0FF',
  borderRadius: 16,
  paddingVertical: 24,
  paddingHorizontal: 20,
  marginBottom: 36,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#5061FF',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 6,
},
infoText: {
  fontSize: 16,
  color: '#5061FF',
  fontWeight: '500',
  textAlign: 'center',
  lineHeight: 22,
},
});