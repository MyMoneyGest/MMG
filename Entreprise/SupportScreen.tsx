import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SupportScreen'>;

const SupportScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      return Alert.alert('Erreur', 'Veuillez décrire votre problème.');
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'supportRequests'), {
        userId: user?.uid,
        message,
        createdAt: serverTimestamp(),
        status: 'open',
      });
      Alert.alert('Envoyé', 'Votre demande a bien été envoyée.');
      navigation.goBack();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d’envoyer la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Support & Aide</Text>
      <TextInput
        style={styles.input}
        placeholder="Décrivez votre demande"
        multiline
        numberOfLines={4}
        value={message}
        onChangeText={setMessage}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#00796B" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Text style={styles.buttonText}>Envoyer</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#004D40', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', marginBottom: 20, textAlignVertical: 'top' },
  button: { backgroundColor: '#00796B', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});