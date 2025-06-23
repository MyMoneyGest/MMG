import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { updatePassword, signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { MaterialIcons } from '@expo/vector-icons';

type ChangePasswordProp = NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;

const ChangePasswordScreen = () => {
  const navigation = useNavigation<ChangePasswordProp>();
  const user = auth.currentUser;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      if (user) {
        await updatePassword(user, newPassword);
        Alert.alert('Mot de passe mis à jour', 'Veuillez vous reconnecter.');
        await signOut(auth);
        navigation.navigate('Login');
      } else {
        Alert.alert('Erreur', 'Aucun utilisateur connecté.');
      }
    } catch (error: any) {
      Alert.alert('Erreur Firebase', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modifier le mot de passe</Text>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Nouveau mot de passe"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirmer le mot de passe"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <MaterialIcons
            name={showConfirm ? 'visibility' : 'visibility-off'}
            size={24}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handlePasswordChange}>
          <Text style={styles.buttonText}>Mettre à jour</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#00796B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});