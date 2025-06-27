//EnterEntrepriseCodeScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { db, auth } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EntrepriseCodeScreen'>;

const EntrepriseCodeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidateCode = async () => {
    if (!code.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code.');
      return;
    }

    setLoading(true);

    try {
      const codeRef = doc(db, 'entrepriseCodes', code.trim());
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        Alert.alert('Code invalide', 'Ce code n’existe pas.');
        return;
      }

      const data = codeSnap.data();
      const now = new Date();

      if (data.used) {
        Alert.alert('Code expiré', 'Ce code a déjà été utilisé.');
        return;
      }

      if (data.expiresAt?.toDate && data.expiresAt.toDate() < now) {
        Alert.alert('Code expiré', 'Ce code n’est plus valide.');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté.');
        return;
      }

      // Associe l’utilisateur à l’entreprise
      await updateDoc(doc(db, 'users', user.uid), {
        entrepriseId: data.entrepriseId,
        type: 'entreprise',
      });

      // Marque le code comme utilisé (si usage unique)
      await updateDoc(codeRef, { used: true });

      Alert.alert('Succès', 'Vous avez rejoint votre entreprise !');
      navigation.replace('GestionEntrepriseScreen'); // Change selon ton écran entreprise
    } catch (error: any) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <Text style={styles.title}>Rejoindre une entreprise</Text>
        <Text style={styles.subtitle}>Entrez le code fourni par votre responsable</Text>

        <TextInput
          style={styles.input}
          placeholder="Code entreprise"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleValidateCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Valider</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <View style={styles.bottomBackground} />
    </LinearGradient>
  );
};

export default EntrepriseCodeScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f2f1',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  bottomBackground: {
    height: 30,
    backgroundColor: '#000',
    width: '100%',
  },
});