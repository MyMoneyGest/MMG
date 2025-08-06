import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
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
  const { vaultId } = route.params;
  const user = auth.currentUser;

  const [vault, setVault] = useState<any>(null);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchVault = async () => {
      const vaultRef = doc(db, 'sharedVaults', vaultId);
      const snap = await getDoc(vaultRef);
      if (snap.exists()) {
        setVault(snap.data());
      } else {
        Alert.alert('Erreur', 'Coffre introuvable.');
      }
    };

    const fetchMembers = async () => {
      const membersRef = collection(db, 'sharedVaults', vaultId, 'members');
      const snap = await getDocs(membersRef);
      const list: VaultMember[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          role: data.role,
          displayName: data.displayName,
          email: data.email,
          joinedAt: data.joinedAt,
        };
      });

      setMembers(list);

      if (user) {
        const current = list.find(m => m.uid === user.uid);
        setUserRole(current?.role ?? null);
      }
    };

    fetchVault();
    fetchMembers();
  }, [vaultId]);

  const getRoleLabel = (role: VaultMember['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'editor':
        return 'Contributeur';
      case 'viewer':
        return 'Lecteur';
      default:
        return role;
    }
  };

  const formatDate = (ts?: Timestamp) => {
    if (!ts || !ts.toDate) return '';
    return `Ajouté le ${ts.toDate().toLocaleDateString('fr-FR')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {vault && (
          <>
            <Text style={styles.title}>{vault.name}</Text>
            <Text style={styles.balance}>
              Solde : {vault.balance?.toLocaleString() ?? 0} FCFA
            </Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Membres</Text>

        {members.map(member => (
          <View key={member.uid} style={styles.memberItem}>
            <View>
              <Text style={styles.memberText}>
                {member.displayName ?? member.email ?? member.uid}
              </Text>
              {member.joinedAt && (
                <Text style={styles.dateText}>{formatDate(member.joinedAt)}</Text>
              )}
            </View>
            <Text style={styles.role}>{getRoleLabel(member.role)}</Text>
          </View>
        ))}

        {userRole === 'admin' && (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('AddSharedVaultMemberScreen', { vaultId })
            }
          >
            <Text style={styles.buttonText}>+ Ajouter un membre</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SharedVaultDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 8,
  },
  balance: { fontSize: 18, marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  memberItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberText: { fontSize: 16, fontWeight: '500' },
  dateText: { fontSize: 12, color: '#777' },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00796B',
  },
  button: {
    backgroundColor: '#00796B',
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});