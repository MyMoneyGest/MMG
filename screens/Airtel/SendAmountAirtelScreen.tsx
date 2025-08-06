import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SendAmountAirtelScreen'>;

const SendAmountAirtelScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const [airtelBalance, setAirtelBalance] = useState<number | null>(null);

  const { beneficiary } = route.params as any;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const airtelRef = doc(db, 'users', user.uid, 'linkedAccounts', 'airtel');
      const snapshot = await getDoc(airtelRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAirtelBalance(data.airtelBalance);
      }
    };

    fetchBalance();
  }, []);

  const handleSendMoney = async () => {
    const amountValue = parseInt(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    if (airtelBalance !== null && amountValue > airtelBalance) {
      Alert.alert('Erreur', 'Solde insuffisant.');
      return;
    }
    const user = auth.currentUser;
    const senderUid = user?.uid;
    const receiverPhone = beneficiary.phone;

    if (!senderUid || !receiverPhone) {
      Alert.alert('Erreur', 'Informations incomplètes.');
      return;
    }

    let linkedUid: string | null = null;

    try {
      // Vérifie si le destinataire est inscrit à MMG
      const q = query(
        collection(db, 'phoneDirectory'),
        where('phone', '==', receiverPhone)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        linkedUid = snap.docs[0].data().uid;
      }

      // Crée la transaction Airtel, même si le destinataire n'est pas inscrit
      await addDoc(collection(db, 'transactions'), {
        senderUid: senderUid,
        receiverUid: linkedUid ?? null,
        receiverPhone: receiverPhone,
        amount: amountValue,
        note: reason ?? '',
        status: 'pending',
        source: 'airtel',
        createdAt: serverTimestamp(),
      });

      if (!linkedUid) {
        Alert.alert(
          'Bénéficiaire non inscrit',
          'Ce numéro n’a pas encore de compte MMG. Une invitation lui sera envoyée.',
          [
            {
              text: 'OK',
              onPress: async () => {
                const invitationRef = doc(db, 'pendingInvitations', receiverPhone.replace('+', ''));

                await setDoc(invitationRef, {
                  phone: receiverPhone,
                  senderUid: senderUid,
                  senderName: auth.currentUser?.displayName ?? 'Utilisateur MMG',
                  reason: reason ?? '',
                  createdAt: serverTimestamp(),
                });

                console.log('Invitation enregistrée');
              },
            },
          ],
          { cancelable: false }
        );
      }

      Alert.alert('Succès', 'Virement envoyé avec succès.');
      navigation.goBack(); // ou navigation.navigate('TransactionDetail', { ... })
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible d'envoyer l'argent.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        {airtelBalance !== null && (
          <Text style={styles.balanceSmall}>
            💰 {airtelBalance.toLocaleString()} FCFA
          </Text>
        )}
      </View>

      <Text style={styles.title}>
        {`Envoyer à ${beneficiary.name ?? 'Nom inconnu'}`}
      </Text>

      <TextInput
        placeholder="Montant"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      <TextInput
        placeholder="Motif (facultatif)"
        value={reason}
        onChangeText={setReason}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, !amount && styles.disabledButton]}
        onPress={handleSendMoney}
        disabled={!amount}
      >
        <Text style={styles.buttonText}>Envoyer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SendAmountAirtelScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  balanceSmall: {
    fontSize: 14,
    color: '#00796B',
    fontWeight: '600',
  },
});