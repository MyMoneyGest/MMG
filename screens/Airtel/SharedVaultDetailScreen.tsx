import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/services/firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

type VaultMember = {
  uid: string;
  role: 'admin' | 'editor' | 'viewer';
  displayName?: string;
  email?: string;
  joinedAt?: Timestamp;
};

const SharedVaultDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const vaultId = route?.params?.vaultId;
  const user = auth.currentUser;

  const [vault, setVault] = useState<any>(null);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [airtelBalance, setAirtelBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vaultId || !user) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVault(), fetchMembers(), fetchAirtelBalance()]);
      setLoading(false);
    };

    loadData();
  }, [vaultId]);

  const fetchVault = async () => {
    try {
      const snap = await getDoc(doc(db, 'sharedVaults', vaultId));
      if (snap.exists()) setVault(snap.data());
      else Alert.alert('Erreur', 'Coffre introuvable.');
    } catch (e) {
      console.error('Erreur coffre :', e);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'sharedVaults', vaultId, 'members'));
      const membersData: VaultMember[] = [];

      for (const docSnap of membersSnapshot.docs) {
        const memberUid = docSnap.id;
        const memberData = docSnap.data();
        let displayName = memberUid;

        try {
          const userSnap = await getDoc(doc(db, 'users', memberUid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            displayName = userData.fullName || userData.phoneNumber || memberUid;
          }
        } catch {}

        membersData.push({
          uid: memberUid,
          role: memberData.role,
          displayName,
          email: memberData.email,
          joinedAt: memberData.joinedAt,
        });

        if (user && memberUid === user.uid) {
        setUserRole(memberData.role);
        }

      }

      setMembers(membersData);
    } catch (e) {
      console.error('Erreur membres :', e);
    }
  };

  const fetchAirtelBalance = async () => {
  if (!auth.currentUser) return;
  try {
    const balSnap = await getDoc(doc(db, 'airtelBalances', auth.currentUser.uid));
    if (balSnap.exists()) {
      setAirtelBalance(balSnap.data().balance || 0);
    }
  } catch (e) {
    console.warn('Erreur de récupération du solde Airtel:', e);
  }
};

  const getRoleLabel = (role: VaultMember['role']) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'editor': return 'Contributeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const formatDate = (ts?: Timestamp) =>
    ts?.toDate ? `Ajouté le ${ts.toDate().toLocaleDateString('fr-FR')}` : '';

  const renderActions = () => (
    <>
      {userRole === 'admin' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddSharedVaultMemberScreen', { vaultId })}
        >
          <Text style={styles.actionButtonText}>👥 Ajouter un membre</Text>
        </TouchableOpacity>
      )}
      {(userRole === 'admin' || userRole === 'editor') && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('AddSharedVaultMoneyScreen', { vaultId })}
        >
          <Text style={styles.actionButtonText}>💰 Gérer les fonds</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (!vaultId) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>⚠️ vaultId est manquant</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00796B" />
        <Text style={{ marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        {vault && (
          <View style={styles.header}>
            <Text style={styles.title}>{vault.name}</Text>
            <Text style={styles.vaultBalance}>
              💼 Solde du coffre : {vault.balance?.toLocaleString() ?? 0} FCFA
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Votre solde Airtel</Text>
          <Text style={styles.infoValue}>{airtelBalance.toLocaleString()} FCFA</Text>
        </View>

        {/* MEMBRES */}
        <Text style={styles.sectionTitle}>👥 Membres</Text>
        {members.map(member => (
          <View key={member.uid} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.displayName ?? member.email ?? member.uid}
              </Text>
              {member.joinedAt && (
                <Text style={styles.memberDate}>{formatDate(member.joinedAt)}</Text>
              )}
            </View>
            <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
          </View>
        ))}

        {/* ACTIONS */}
        <View style={{ marginTop: 30 }}>{renderActions()}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SharedVaultDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  scroll: { padding: 20 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00796B',
  },
  vaultBalance: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
    color: '#333',
  },

  // Airtel balance card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    marginBottom: 25,
  },
  infoLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  // Members
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  memberDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  memberRole: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00796B',
    marginLeft: 10,
  },

  // Buttons
  actionButton: {
    backgroundColor: '#00796B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});