// screens/airtel/PaymentRequestDetail.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import {
  doc, onSnapshot, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';

type R = RouteProp<RootStackParamList, 'PaymentRequestDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'PaymentRequestDetail'>;

const PaymentRequestDetail = () => {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { requestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<any | null>(null);

  const user = auth.currentUser;

  const isTarget = !!(user && req && req.targetUid === user.uid);
  const isRequester = !!(user && req && req.requesterUid === user.uid);
  const isPending = req?.status === 'pending';

  useEffect(() => {
    const ref = doc(db, 'paymentRequests', requestId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          Alert.alert('Erreur', 'Demande introuvable.');
          navigation.goBack();
          return;
        }
        setReq({ id: snap.id, ...snap.data() });
        setLoading(false);
      },
      (e) => {
        console.error(e);
        Alert.alert('Erreur', 'Impossible de charger la demande.');
        navigation.goBack();
      }
    );
    return () => unsub();
  }, [requestId]);

  const accept = async () => {
    if (!user || !req) return;
    if (!isTarget || !isPending) {
      Alert.alert('Info', "Vous ne pouvez pas accepter cette demande.");
      return;
    }

    try {
      // Création d'une transaction 'pending' liée à la demande
      await addDoc(collection(db, 'transactions'), {
        senderUid: user.uid,           // ✅ payeur = cible de la demande
        receiverUid: req.requesterUid, // ✅ le demandeur sera crédité
        amount: Number(req.amount),
        note: req.note ?? 'Règlement demande',
        status: 'pending',
        paymentRequestId: req.id,      // ✅ important
        createdAt: serverTimestamp(),
      });

      Alert.alert('Succès', 'Demande acceptée. Paiement en cours.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible d'accepter la demande.");
    }
  };

  const decline = async () => {
    if (!user || !req) return;
    if (!isTarget || !isPending) {
      Alert.alert('Info', "Vous ne pouvez pas refuser cette demande.");
      return;
    }

    try {
      // On crée une décision 'declined' : la Function mettra la demande à declined + notifs
      await addDoc(collection(db, 'paymentRequests', req.id, 'decisions'), {
        actorUid: user.uid,
        decision: 'declined',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Info', 'Demande refusée.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "Impossible de refuser la demande.");
    }
  };

  if (loading || !req) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demande de paiement</Text>
      <Text style={styles.line}>De : {req.requesterName ?? 'Utilisateur'}</Text>
      <Text style={styles.line}>Montant : {Number(req.amount).toLocaleString()} FCFA</Text>
      {req.note ? <Text style={styles.line}>Motif : {req.note}</Text> : null}
      <Text style={styles.line}>Statut : {req.status}</Text>

      {/* Boutons visibles seulement pour la cible et si pending */}
      {isTarget && isPending ? (
        <>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#2E7D32' }]} onPress={accept}>
            <Text style={styles.btnText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#B71C1C' }]} onPress={decline}>
            <Text style={styles.btnText}>Refuser</Text>
          </TouchableOpacity>
        </>
      ) : isRequester && isPending ? (
        <Text style={{ marginTop: 16, color: '#00796B' }}>
          En attente d’action de la personne sollicitée.
        </Text>
      ) : (
        <Text style={{ marginTop: 16, color: '#00796B' }}>
          Cette demande est {req.status}.
        </Text>
      )}
    </View>
  );
};

export default PaymentRequestDetail;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  line: { fontSize: 16, marginVertical: 4 },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: 'bold' },
});