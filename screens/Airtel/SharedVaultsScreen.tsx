import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '@/services/firebaseConfig';
import {
  getDocs,
  getDoc,
  doc,
  collection
} from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

interface SharedVault {
  id: string;
  name: string;
  balance: number;
  role: string;
}

const SharedVaultsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [vaults, setVaults] = useState<SharedVault[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const fetchUserSharedVaults = async () => {
    if (!user) return;

    try {
      setLoading(true); // ← remet le loader pendant le refresh
      const vaultsData: SharedVault[] = [];

      const vaultsSnapshot = await getDocs(collection(db, 'sharedVaults'));

      for (const vaultDoc of vaultsSnapshot.docs) {
        const vaultId = vaultDoc.id;
        const memberRef = doc(db, 'sharedVaults', vaultId, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);

        if (memberSnap.exists()) {
          const memberData = memberSnap.data();
          const vaultData = vaultDoc.data();

          vaultsData.push({
            id: vaultId,
            name: vaultData.name,
            balance: vaultData.balance ?? 0,
            role: memberData.role ?? 'membre',
          });
        }
      }

      setVaults(vaultsData);
    } catch (error) {
      console.error('Erreur de chargement des coffres partagés :', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSharedVaults();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserSharedVaults();
    }, [])
  );

  const handleOpenVault = (vault: SharedVault) => {
    navigation.navigate('SharedVaultDetailScreen', { vaultId: vault.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Coffres partagés</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateSharedVaultScreen')}>
          <Text style={styles.addButton}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00796B" style={{ marginTop: 40 }} />
      ) : vaults.length === 0 ? (
        <Text style={styles.emptyText}>Aucun coffre partagé trouvé.</Text>
      ) : (
        <FlatList
          data={vaults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vaultCard}
              onPress={() => handleOpenVault(item)}
            >
              <Text style={styles.vaultName}>{item.name}</Text>
              <Text style={styles.balance}>💰 {item.balance.toLocaleString()} FCFA</Text>
              <Text style={styles.role}>Rôle : {item.role}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default SharedVaultsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8F6', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00796B',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796B',
  },
  emptyText: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
  vaultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004D40',
  },
  balance: {
    fontSize: 16,
    marginTop: 6,
    color: '#333',
  },
  role: {
    fontSize: 14,
    marginTop: 4,
    color: '#777',
  },
});