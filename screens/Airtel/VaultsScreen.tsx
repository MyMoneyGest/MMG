import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Vault {
  id: string;
  name: string;
  balance: number;
  goal?: number;
  createdAt: Date;
  type: 'standard' | 'locked';
  lockedUntil?: string;
  uid: string;
}

const VaultsScreen = () => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [vaultGoal, setVaultGoal] = useState('');
  const [lockDuration, setLockDuration] = useState('');
  const [selectedType, setSelectedType] = useState<'standard' | 'locked'>('standard');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'vaults'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVaults: Vault[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        balance: doc.data().balance,
        goal: doc.data().goal,
        createdAt: doc.data().createdAt.toDate(),
        type: doc.data().type || 'standard',
        lockedUntil: doc.data().lockedUntil,
        uid: user.uid,
      }));

      setVaults(fetchedVaults);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateVault = async () => {
    if (!vaultName.trim()) return;

    const existingSameName = vaults.some(v => v.name.toLowerCase() === vaultName.trim().toLowerCase());
    if (existingSameName) {
      setErrorMessage('Un coffre avec ce nom existe déjà.');
      return;
    }

    const sameTypeVaultsCount = vaults.filter(v => v.type === selectedType).length;
    if (sameTypeVaultsCount >= 10) {
      setErrorMessage('Limite atteinte : vous ne pouvez pas créer plus de 10 coffres pour ce type.');
      return;
    }

    try {
      const vaultData: any = {
        name: vaultName.trim(),
        balance: 0,
        goal: vaultGoal ? parseInt(vaultGoal) : null,
        createdAt: new Date(),
        type: selectedType,
        uid: user!.uid,
      };

      if (selectedType === 'locked' && lockDuration) {
        const days = parseInt(lockDuration);
        if (!isNaN(days)) {
          const unlockDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          vaultData.lockedUntil = unlockDate.toISOString();
        }
      }

      await addDoc(collection(db, 'users', user!.uid, 'vaults'), vaultData);

      setVaultName('');
      setVaultGoal('');
      setLockDuration('');
      setSelectedType('standard');
      setModalVisible(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Erreur lors de la création du coffre :', error);
    }
  };

  const standardVaults = vaults.filter(v => v.type === 'standard');
  const lockedVaults = vaults.filter(v => v.type === 'locked');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mes Coffres</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Créer un coffre</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Coffres standards</Text>
            {standardVaults.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate('VaultDetails', { vault: item })}
                style={styles.vaultCard}
              >
                <Text style={styles.vaultName}>{item.name}</Text>
                <Text>Solde : {item.balance.toLocaleString()} FCFA</Text>
                {item.goal && <Text>Objectif : {item.goal.toLocaleString()} FCFA</Text>}
                <Text style={styles.date}>Créé le {format(item.createdAt, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Coffres bloqués</Text>
            {lockedVaults.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate('VaultDetails', { vault: item })}
                style={[styles.vaultCard, { opacity: 0.6 }]}
              >
                <Text style={styles.vaultName}>{item.name} 🔒</Text>
                <Text>Solde : {item.balance.toLocaleString()} FCFA</Text>
                {item.goal && <Text>Objectif : {item.goal.toLocaleString()} FCFA</Text>}
                {item.lockedUntil && (
                  <Text>Débloqué le : {format(new Date(item.lockedUntil), 'dd/MM/yyyy')}</Text>
                )}
                <Text style={styles.date}>Créé le {format(item.createdAt, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Créer un coffre</Text>

              {errorMessage ? (
                <Text style={{ color: 'red', marginBottom: 10 }}>{errorMessage}</Text>
              ) : null}

              <TextInput
                placeholder="Nom du coffre"
                value={vaultName}
                onChangeText={setVaultName}
                style={styles.input}
              />
              <TextInput
                placeholder="Objectif (optionnel)"
                value={vaultGoal}
                onChangeText={setVaultGoal}
                style={styles.input}
                keyboardType="numeric"
              />
              {selectedType === 'locked' && (
                <TextInput
                  placeholder="Durée de blocage (en jours)"
                  value={lockDuration}
                  onChangeText={setLockDuration}
                  style={styles.input}
                  keyboardType="numeric"
                />
              )}

              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, selectedType === 'standard' && styles.typeSelected]}
                  onPress={() => setSelectedType('standard')}
                >
                  <Text>Standard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, selectedType === 'locked' && styles.typeSelected]}
                  onPress={() => setSelectedType('locked')}
                >
                  <Text>Bloqué</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={handleCreateVault}>
                <Text style={styles.modalButtonText}>Valider</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: 'red', marginTop: 10 }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <View style={[styles.returnButtonWrapper, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.returnButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
};

export default VaultsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F4F6F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3F51B5',
    marginTop: 20,
    marginBottom: 10,
  },
  vaultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    marginTop: 5,
    fontStyle: 'italic',
    color: '#777',
  },
  addButton: {
    backgroundColor: '#005CE6',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000088',
  },
  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 5,
  },
  modalButton: {
    backgroundColor: '#005CE6',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  typeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  typeSelected: {
    backgroundColor: '#C5CAE9',
    borderColor: '#3F51B5',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  returnButtonWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  returnButton: {
    backgroundColor: '#B71C1C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});