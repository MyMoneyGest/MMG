import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { sendConfirmationCode } from '../../services/functions';

export default function ConfirmationCodeScreen() {
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return;
    }

    try {
      const res = await sendConfirmationCode(email);
      Alert.alert(res.success ? 'Succès' : 'Erreur', res.message);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Échec de l’envoi du code.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 6,
          marginBottom: 20,
        }}
      />
      <Button title="Envoyer le code" onPress={handleSend} />
    </View>
  );
}