// screens/Airtel/AirtelRechargeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const AirtelRechargeScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<'bank' | 'card'>('bank');
  const [password, setPassword] = useState('');

  const handleRecharge = () => {
    const value = Number(amount);
    if (!amount || isNaN(value) || value <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Erreur', 'Mot de passe requis.');
      return;
    }

    Alert.alert('✅ Recharge réussie', `Vous avez rechargé ${value.toLocaleString()} FCFA.`);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={['#E0F7FA', '#B2EBF2']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.title}>Recharger Compte Airtel Money</Text>

              {/* Montant */}
              <Text style={styles.label}>Montant</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color="#00796B" />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ex: 5000"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Source de fond */}
              <Text style={styles.label}>Source de fonds</Text>
              <View style={styles.sourceSelector}>
                <TouchableOpacity
                  style={[styles.sourceButton, source === 'bank' && styles.selectedSource]}
                  onPress={() => setSource('bank')}
                >
                  <Ionicons name="business" size={18} color="#fff" />
                  <Text style={styles.sourceText}>Compte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sourceButton, source === 'card' && styles.selectedSource]}
                  onPress={() => setSource('card')}
                >
                  <Ionicons name="card" size={18} color="#fff" />
                  <Text style={styles.sourceText}>Carte</Text>
                </TouchableOpacity>
              </View>

              {/* Mot de passe */}
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed" size={20} color="#00796B" />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Valider */}
              <TouchableOpacity style={styles.rechargeButton} onPress={handleRecharge}>
                <Text style={styles.rechargeButtonText}>Valider la recharge</Text>
              </TouchableOpacity>
            </View>

            {/* Retour */}
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.returnText}>Retour</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AirtelRechargeScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#004D40',
  },
  label: {
    fontSize: 14,
    color: '#00796B',
    marginBottom: 8,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  sourceSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    marginTop: 4,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B2DFDB',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    flex: 1,
    justifyContent: 'center',
  },
  selectedSource: {
    backgroundColor: '#00796B',
  },
  sourceText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  rechargeButton: {
    backgroundColor: '#004D40',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  rechargeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  returnButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  returnText: {
    color: '#004D40',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});