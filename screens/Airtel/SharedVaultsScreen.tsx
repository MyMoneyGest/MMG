import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { MaterialIcons } from '@expo/vector-icons';

type Vault = {
  id: string;
  name: string;
  balance: number;
  adminName: string;
  userRole: 'admin' | 'editor' | 'viewer';
};

const getRoleLabel = (role: Vault['userRole']) => {
  switch (role) {
    case 'admin': return 'Administrateur';
    case 'editor': return 'Contributeur';
    case 'viewer': return 'Lecteur';
    default: return 'Membre';
  }
};

const SharedVaultsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = auth.currentUser;

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVaults = async () => {
  if (!user) return;

  try {
    const refsSnap = await getDocs(collection(db, 'users', user.uid, 'sharedVaultRefs'));
    const vaultsList: Vault[] = [];

    for (const refDoc of refsSnap.docs) {
      const vaultId = refDoc.id;
      const vaultSnap = await getDoc(doc(db, 'sharedVaults', vaultId));

      if (!vaultSnap.exists()) continue;

      const vaultData = vaultSnap.data();

      // Récupérer le rôle de l’utilisateur
      const memberSnap = await getDoc(doc(db, 'sharedVaults', vaultId, 'members', user.uid));
      const userRole = memberSnap.exists() ? memberSnap.data().role : 'viewer';

      // Récupérer nom de l'admin
      let adminName = 'Inconnu';
      if (vaultData.createdBy) {
        const adminSnap = await getDoc(doc(db, 'users', vaultData.createdBy));
        if (adminSnap.exists()) {
          const adminData = adminSnap.data();
          adminName = adminData.fullName || adminData.phoneNumber || 'Inconnu';
        }
      }

      vaultsList.push({
        id: vaultId,
        name: vaultData.name || 'Coffre sans nom',
        balance: vaultData.balance || 0,
        adminName,
        userRole,
      });
    }

    // Tri par nom
    const sorted = vaultsList.sort((a, b) =>
      a.name?.toLowerCase().localeCompare(b.name?.toLowerCase())
    );

    setVaults(sorted);
  } catch (err) {
    console.error('❌ Erreur de chargement des coffres partagés :', err);
  }
};

  useFocusEffect(
    useCallback(() => {
      fetchVaults();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVaults();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Coffres partagés</Text>

        {vaults.length === 0 ? (
          <Text style={styles.emptyText}>
            Vous ne participez à aucun coffre pour le moment.
          </Text>
        ) : (
          vaults.map((vault) => (
            <TouchableOpacity
              key={vault.id}
              style={styles.vaultCard}
              onPress={() => navigation.navigate('SharedVaultDetailScreen', { vaultId: vault.id })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {vault.name.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>

              <View style={styles.vaultInfo}>
                <Text style={styles.vaultName}>{vault.name}</Text>
                <Text style={styles.vaultBalance}>
                  💰 {vault.balance.toLocaleString()} FCFA
                </Text>
                <Text style={styles.adminText}>👤 Admin : {vault.adminName}</Text>
              </View>

              <View style={styles.roleTag}>
                <Text style={styles.roleText}>{getRoleLabel(vault.userRole)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSharedVaultScreen')}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default SharedVaultsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  avatar: {
    backgroundColor: '#00796B33',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796B',
  },
  vaultInfo: {
    flex: 1,
  },
  vaultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  vaultBalance: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  adminText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  roleTag: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00796B',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#00796B',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});