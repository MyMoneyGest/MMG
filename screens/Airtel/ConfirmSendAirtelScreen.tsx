// src/screens/airtel/ConfirmSendAirtelScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { auth, db } from '../../services/firebaseConfig';

// Firestore (client)
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  doc as fsDoc,
  getDocs,
  query,
  where,
  limit,
  getDoc,
} from 'firebase/firestore';

// Auth (reauth)
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

type ConfirmSendRoute = RouteProp<RootStackParamList, 'ConfirmSendAirtelScreen'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Beneficiary = {
  name?: string;
  phone?: string;        // attendu en E.164 (+241...)
  linkedUid?: string;    // si déjà résolu côté bénéficiaires
};

const ConfirmSendAirtelScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ConfirmSendRoute>();
  const { beneficiary, amount, reason = '' } = route.params as {
    beneficiary: Beneficiary;
    amount: number | string;
    reason?: string;
  };

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [passwordError, setPasswordError] = useState('');

  // Référence pour pouvoir cleanup le listener à l’unmount
  const unsubRef = useRef<null | (() => void)>(null);
  const timeoutRef = useRef<null | NodeJS.Timeout>(null);

  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // (Optionnel) petite normalisation locale du numéro (basique)
  function normalizeGabonPhone(p: string) {
    const phone = (p || '').replace(/\s+/g, '');
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('00241')) return `+${phone.slice(2)}`;
    if (phone.startsWith('241')) return `+${phone}`;
    return phone;
  }

  // Résoudre un UID par téléphone via /phoneDirectory (id du doc = uid)
  const findUidByPhone = async (phoneE164: string): Promise<string | null> => {
    const q = query(
      collection(db, 'phoneDirectory'),
      where('phone', '==', phoneE164),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id; // id du doc = uid
  };

  const handleSend = async () => {
    if (isLoading) return; // évite le double-submit
    setPasswordError('');

    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
      return;
    }

    if (!password) {
      setPasswordError('Veuillez saisir votre mot de passe');
      return;
    }

    // Validation du montant (FCFA entier positif)
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      Alert.alert('Montant invalide', 'Le montant doit être un entier positif en FCFA.');
      return;
    }

    try {
      setIsLoading(true);

      // Re-auth
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setFailedAttempts(0);

      const senderUid = user.uid;

      // Résolution du receiverUid (linkedUid ou annuaire)
      let receiverUid: string | null = beneficiary?.linkedUid ?? null;
      if (!receiverUid) {
        const raw = beneficiary?.phone || '';
        const phone = normalizeGabonPhone(raw);
        if (!phone) {
          throw new Error("Le bénéficiaire n'a pas d'UID lié ni de numéro de téléphone.");
        }
        receiverUid = await findUidByPhone(phone);
      }

      if (!receiverUid) {
        throw new Error("Ce numéro n'est pas associé à un compte MyMoneyGest.");
      }
      if (receiverUid === senderUid) {
        throw new Error("Vous ne pouvez pas vous envoyer de l'argent à vous-même.");
      }

      // (Optionnel) Récupérer le nom de l'expéditeur pour affichage local
      let currentUserName = 'Vous';
      try {
        const userDoc = await getDoc(fsDoc(db, 'users', senderUid));
        if (userDoc.exists()) currentUserName = userDoc.data()?.name || 'Vous';
      } catch {
        // non-bloquant
      }

      // Création de la transaction 'pending' (Cloud Function fera le transfert)
      const txRef = await addDoc(collection(db, 'transactions'), {
        senderUid,
        receiverUid,
        amount: Math.trunc(numericAmount), // FCFA en entier
        note: reason ?? '',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Listener sur le doc de transaction pour suivre success/failed
      const unsub = onSnapshot(
        fsDoc(db, 'transactions', txRef.id),
        (s) => {
          const d = s.data();
          if (!d) return;

          if (d.status === 'success') {
            // cleanup
            unsub();
            unsubRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            // Aller vers le reçu / détails
            navigation.replace('TransactionDetail', {
              transaction: {
                id: txRef.id,
                reference: d.reference ?? `TX-${txRef.id}`,
                type: 'Virement émis',
                amount: -Math.trunc(numericAmount),
                date: new Date().toISOString(),
                sender: 'Vous',
                receiver: beneficiary?.name ?? 'Bénéficiaire',
                status: 'Réussi',
                reason,
              },
            });
          } else if (d.status === 'failed') {
            // cleanup
            unsub();
            unsubRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            Alert.alert('Échec du transfert', d.error ?? 'Erreur inconnue.');
            setIsLoading(false);
          }
        },
        (err) => {
          // Erreur du listener (permissions/connexion)
          console.error('onSnapshot error:', err);
          Alert.alert('Erreur de suivi', err.message);
          setIsLoading(false);
        }
      );
      unsubRef.current = unsub;

      // Timeout de sécurité si la Function tarde (30s)
      timeoutRef.current = setTimeout(() => {
        // si au bout de 30s on n’a pas de retour, on libère l’UI
        if (isLoading) {
          setIsLoading(false);
          Alert.alert(
            'Temps dépassé',
            "La confirmation prend plus de temps que prévu. Vérifiez l'historique plus tard ou réessayez."
          );
        }
      }, 30000);
    } catch (error: any) {
      if (__DEV__) console.error('Erreur lors de la transaction :', error);

      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      const isWrongPassword =
        error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password';

      if (isWrongPassword) {
        if (nextAttempts >= 5) {
          Alert.alert(
            'Trop de tentatives',
            'Vous allez être redirigé vers la réinitialisation du mot de passe.',
            [{ text: 'OK', onPress: () => navigation.navigate('ForgotPassword' as never) }]
          );
        } else {
          setPasswordError(`Mot de passe incorrect (tentative ${nextAttempts} sur 5)`);
        }
        setIsLoading(false);
        return;
      }

      // Messages métier spécifiques
      if (typeof error?.message === 'string') {
        if (error.message === 'SOLDE_INSUFFISANT') {
          Alert.alert('Erreur', 'Votre solde principal est insuffisant pour cette opération.');
        } else if (error.message === 'COFFRE_INSUFFISANT') {
          Alert.alert('Erreur', 'Le montant dépasse le solde disponible dans ce coffre.');
        } else {
          Alert.alert('Erreur', error.message);
        }
      } else {
        Alert.alert('Erreur', 'Une erreur inattendue est survenue. Veuillez réessayer.');
      }

      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmer l'envoi</Text>

      <Text style={styles.label}>Bénéficiaire :</Text>
      <Text style={styles.value}>
        {beneficiary?.name ?? 'Nom inconnu'} — {beneficiary?.phone ?? 'Téléphone inconnu'}
      </Text>

      <Text style={styles.label}>Montant :</Text>
      <Text style={styles.value}>
        {`${Number(amount).toLocaleString()} FCFA`}
      </Text>

      <Text style={styles.label}>Mot de passe :</Text>
      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Votre mot de passe"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (passwordError) setPasswordError('');
        }}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Envoi en cours...' : 'Envoyer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmSendAirtelScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 5,
  },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', marginTop: 5, fontSize: 14 },
  button: {
    backgroundColor: '#00796B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: '#004D40' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});