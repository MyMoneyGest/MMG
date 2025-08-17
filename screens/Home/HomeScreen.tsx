// HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';

const handleVerifyEmail = async () => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    try {
      await sendEmailVerification(user);
      Alert.alert("E-mail envoyé", "Vous allez recevoir un e-mail de validation.");
    } catch (error) {
      console.error("Erreur e-mail :", error);
      Alert.alert("Erreur", "Impossible d’envoyer l’e-mail.");
    }
  } else {
    Alert.alert("Info", "Votre adresse e-mail est déjà vérifiée.");
  }
};

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

interface VerificationStatus {
  identityVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  pinSet?: boolean;
  twoFAEnabled?: boolean;
}

interface UserData {
  name?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  accountType?: string;
  createdAt?: { toDate: () => Date };
  identityVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  pinDefined?: boolean;
  twoFAEnabled?: boolean;
}

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProp>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

const fetchUserData = async (uid: string) => {
  setLoading(true);
  try {
    await auth.currentUser?.reload();
    const refreshedUser = auth.currentUser;
    const snap = await getDoc(doc(db, 'users', uid));
    const verifSnap = await getDoc(doc(db, 'users', uid, 'verifications', 'status'));
    const verifData: VerificationStatus = verifSnap.exists() ? (verifSnap.data() as VerificationStatus) : {};

    if (snap.exists()) {
      const data = snap.data() as UserData;

      if (refreshedUser?.emailVerified && !data.emailVerified) {
        await setDoc(doc(db, 'users', uid), { emailVerified: true }, { merge: true });
      }

      setUserData({
        ...data,
        emailVerified: refreshedUser?.emailVerified,
        identityVerified: verifData.identityVerified === true,
        phoneVerified: verifData.phoneVerified === true,
        pinDefined: verifData.pinSet === true,
        twoFAEnabled: verifData.twoFAEnabled === true,
      });
    }
  } catch (error) {
    console.error('Erreur chargement (fetchUserData) :', error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.reload();
          const refreshedUser = auth.currentUser;
          const snap = await getDoc(doc(db, 'users', user.uid));

          const verifSnap = await getDoc(doc(db, 'users', user.uid, 'verifications', 'status'));
          const verifData: VerificationStatus = verifSnap.exists() ? (verifSnap.data() as VerificationStatus) : {};

          if (snap.exists()) {
            const data = snap.data() as UserData;

            // Mise à jour email vérifié dans Firestore
            if (refreshedUser?.emailVerified && !data.emailVerified) {
              await setDoc(doc(db, 'users', user.uid), { emailVerified: true }, { merge: true });
            }

            setUserData({
              ...data,
              emailVerified: refreshedUser?.emailVerified,
              identityVerified: verifData.identityVerified === true,
              phoneVerified: verifData.phoneVerified === true,
              pinDefined: verifData.pinSet === true,
              twoFAEnabled: verifData.twoFAEnabled === true,
            });
          }
        } catch (error) {
          console.error('Erreur chargement :', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      await fetchUserData(user.uid);
    } else {
      setLoading(false);
    }
  });

  const unsubscribeFocus = navigation.addListener('focus', async () => {
    const user = auth.currentUser;
    if (user) {
      await fetchUserData(user.uid);
    }
  });
  return () => {
    unsubscribeAuth();
    unsubscribeFocus();
  };
  }, []);


  const getInitials = (name?: string) => {
    if (!name) return '';
    const words = name.trim().split(' ');
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={{ marginTop: 12, textAlign: 'center' }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>Aucune donnée utilisateur trouvée.</Text>
      </SafeAreaView>
    );
  }

  const checks = [
    { label: "Pièce d'identité", completed: userData.identityVerified },
    { label: 'Numéro de téléphone', completed: userData.phoneVerified },
    { label: 'Email', completed: userData.emailVerified },
    { label: 'PIN', completed: userData.pinDefined },
    { label: 'Authentification 2FA', completed: userData.twoFAEnabled }
  ];
  const completed = checks.filter(c => c.completed).length;
  const percent = Math.round((completed / checks.length) * 100);

  let securityLevel = 'Faible';
  let bannerColor = '#fef2f2';
  let textColor = '#b91c1c';

  if (percent >= 80) {
    securityLevel = 'Fort';
    bannerColor = '#ecfdf5';
    textColor = '#047857';
  } else if (percent >= 50) {
    securityLevel = 'Moyen';
    bannerColor = '#fefce8';
    textColor = '#ca8a04';
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Bienvenue !</Text>
            <Text style={styles.headerSubtitle}>Vérifiez vos informations</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>


        <View style={styles.content}>

          {/* ✅ Profil utilisateur */}
          <View style={styles.card}>
            <View style={styles.profileRow}>
              {userData.avatar ? (
                <Image source={{ uri: userData.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(userData.name)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{userData.name || 'Utilisateur'}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="create-outline" size={14} color="#0f172a" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.textMuted}>{userData.phoneNumber}</Text>
                <Text style={styles.textMuted}>{userData.email}</Text>
              </View>
            </View>
          </View>

          {/* ✅ Bloc niveau de sécurité */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-outline" size={20} color="#000" />
              <Text style={styles.cardTitle}>Niveau de sécurité</Text>
            </View>
            {/* ✅ Banniere niveau de sécurité */}
          <View style={[styles.banner, { backgroundColor: bannerColor }]}>
            <Ionicons name="alert-circle-outline" size={18} color={textColor} />
            <Text style={[styles.bannerText, { color: textColor }]}> {securityLevel}
            </Text>
          </View>
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressRow}>
                <Text style={styles.textSmall}>Sécurité du compte</Text>
                <Text style={styles.textSmallBold}>{percent}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              {checks.map((check, i) => {
                const label =
                  check.label === 'Email' ? 'Valider' :
                  check.label === 'PIN' ? 'Définir' :
                  check.label === 'Numéro de téléphone' ? 'Confirmer' :
                  check.label === "Pièce d'identité" ? 'Vérifier' :
                  'Activer';

                const onPress =
                  check.label === 'Email' ? handleVerifyEmail :
                  check.label === 'PIN' ? () => navigation.navigate('SetPinScreen') :
                  () => {};

                return (
                  <View key={i} style={styles.checkRow}>
                    <Ionicons
                      name={check.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={check.completed ? '#22c55e' : '#9ca3af'}
                    />
                    <Text style={[styles.textSmall, !check.completed && { color: '#9ca3af' }]}>{check.label}</Text>
                    {!check.completed && (
                      <TouchableOpacity onPress={onPress}>
                        <Text style={styles.activateLink}>{label}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ✅ Infos compte */}
          <View style={styles.card}>
            <View style={styles.accountInfo}>
              <View style={styles.accountCol}>
                <Text style={styles.textSmallMuted}>Type de compte</Text>
                <Text style={styles.textMedium}>{userData.accountType || 'Standard'}</Text>
              </View>
              <View style={styles.accountCol}>
                <Text style={styles.textSmallMuted}>Membre depuis</Text>
                <Text style={styles.textMedium}>
                  {userData.createdAt?.toDate?.().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) || '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* ✅ Bouton principal */}
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.mainButtonText}>Accéder à mes comptes</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;


const styles = StyleSheet.create({
  
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#0f172a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#cbd5e1', fontSize: 12 },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600' },
  textMuted: { fontSize: 13, color: '#6b7280' },
  badge: {
    marginTop: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  badgeText: { fontSize: 12, color: '#374151' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 6
  },
  progressFill: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3
  },
  textSmall: { fontSize: 13 },
  textSmallBold: { fontSize: 13, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  activateLink: { fontSize: 12, color: '#0f172a', marginLeft: 'auto' },
  accountInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  accountCol: { alignItems: 'center', flex: 1 },
  textSmallMuted: { fontSize: 12, color: '#6b7280' },
  textMedium: { fontSize: 14, fontWeight: '600' },
  mainButton: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainButtonText: { color: '#fff', fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  outlineButtonText: { fontWeight: '500', color: '#000' },
  editLink: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    marginLeft: 8,
    textDecorationLine: 'underline'
  },
  initials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

});