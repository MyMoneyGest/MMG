import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Accounts'>;

const AccountsScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const accessFeature = (label: string) => {
    Alert.alert('Fonctionnalité à venir', `Accès à : ${label}`);
  };

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Mes comptes</Text>
        <Text style={styles.subtitle}>Choisissez un service à consulter</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => accessFeature('Compte bancaire')}
        >
          <Text style={styles.buttonText}>Compte bancaire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AirtelMoney')}
        >
          <Text style={styles.buttonText}>Airtel Money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Libertis')}
        >
          <Text style={styles.buttonText}>Libertis</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AccountsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f7fa',
    marginBottom: 30,
    textAlign: 'center',
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
});