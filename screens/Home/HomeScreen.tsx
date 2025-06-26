import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProp>();

  return (
    <LinearGradient colors={['#00bcd4', '#00838f']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.profileIconContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileButton}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={26} color="#00796B" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue 👋</Text>
          <Text style={styles.subtitle}>sur MyMoneyGest</Text>
          <Text style={styles.description}>
            Votre tableau de bord financier personnel et professionnel
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.individualBtn]}
              onPress={() => navigation.navigate('Accounts')}
              activeOpacity={0.85}
            >
              <Ionicons name="person" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Je suis un particulier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.enterpriseBtn]}
              onPress={() => navigation.navigate('GestionEntrepriseScreen')}
              activeOpacity={0.85}
            >
              <Ionicons name="business" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Je gère une entreprise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  profileIconContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '600',
    color: '#e0f2f1',
    marginTop: 5,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#ffffffcc',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  individualBtn: {
    backgroundColor: '#00796B',
  },
  enterpriseBtn: {
    backgroundColor: '#004D40',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },

});