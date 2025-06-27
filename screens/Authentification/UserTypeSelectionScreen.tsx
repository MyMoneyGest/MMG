import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type UserTypeScreenProp = NativeStackNavigationProp<RootStackParamList, 'UserTypeSelectionScreen'>;



const UserTypeSelectionScreen = () => {
  const navigation = useNavigation<UserTypeScreenProp>();

const handleNavigateToEntrepriseCodeScreen = () => {
    navigation.navigate('EntrepriseCodeScreen');
  };

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Image
          source={require('../../assets/logo_mymoneygest.jpg')}
          style={styles.logo}
        />

        <Text style={styles.title}>Bienvenue 👋</Text>
        <Text style={styles.subtitle}>Quel type de compte voulez-vous gérer ?</Text>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate('Accounts')}
        >
          <Ionicons name="person" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.optionText}>Je suis un particulier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.entrepriseButton]}
          onPress={() => navigation.navigate('EntrepriseCodeScreen')}
        >
          <Ionicons name="business" size={24} color="#fff" style={styles.icon} />
          <Text style={styles.optionText}>Je rejoins une entreprise</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.bottomBackground} />
    </LinearGradient>
  );
};

export default UserTypeSelectionScreen;

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
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
    borderRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0f2f1',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  entrepriseButton: {
    backgroundColor: '#004D40',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  icon: {
    marginRight: 8,
  },
  bottomBackground: {
    height: 30,
    backgroundColor: '#000',
    width: '100%',
  },
});