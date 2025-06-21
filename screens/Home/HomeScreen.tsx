import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProp>();

  const goToAccounts = () => {
    navigation.navigate('Accounts');
  };

  const goToProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.profileIconContainer}>
          <TouchableOpacity style={styles.profileButton} onPress={goToProfile}>
            <Ionicons name="person" size={24} color="#00796B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Bienvenue sur MyMoneyGest</Text>
        <Text style={styles.subtitle}>Votre tableau de bord financier</Text>

        <TouchableOpacity style={styles.button} onPress={goToAccounts}>
          <Text style={styles.buttonText}>Accéder à mes comptes</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0f2f1',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#00796B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileIconContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});