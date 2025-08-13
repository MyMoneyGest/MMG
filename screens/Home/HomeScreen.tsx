import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProp>();

  const user = {
    name: 'Jean Kouassi',
    phone: '+225 07 12 34 56 78',
    email: 'jean.kouassi@email.com',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    memberSince: 'Mars 2024',
    accountType: 'Standard',
    securityLevel: 85,
    checks: [
      { label: 'Identité vérifiée', completed: true },
      { label: 'Numéro confirmé', completed: true },
      { label: 'Email validé', completed: true },
      { label: 'Code PIN défini', completed: true },
      { label: 'Authentification 2FA', completed: false },
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <Text style={styles.headerSubtitle}>Vérifiez vos informations</Text>
          </View>
          <Ionicons name="shield-outline" size={22} color="#fff" />
        </View>

        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{user.name}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="create-outline" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.textMuted}>{user.phone}</Text>
                <Text style={styles.textMuted}>{user.email}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Compte vérifié</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Security Level */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-outline" size={20} color="#000" />
              <Text style={styles.cardTitle}>Niveau de sécurité</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressRow}>
                <Text style={styles.textSmall}>Sécurité du compte</Text>
                <Text style={styles.textSmallBold}>{user.securityLevel}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${user.securityLevel}%` }]} />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              {user.checks.map((check, index) => (
                <View key={index} style={styles.checkRow}>
                  <Ionicons
                    name={check.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={check.completed ? '#22c55e' : '#9ca3af'}
                  />
                  <Text style={[styles.textSmall, !check.completed && { color: '#9ca3af' }]}>
                    {check.label}
                  </Text>
                  {!check.completed && (
                    <TouchableOpacity>
                      <Text style={styles.activateLink}>Activer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Account Info */}
          <View style={styles.card}>
            <View style={styles.accountInfo}>
              <View style={styles.accountCol}>
                <Text style={styles.textSmallMuted}>Type de compte</Text>
                <Text style={styles.textMedium}>{user.accountType}</Text>
              </View>
              <View style={styles.accountCol}>
                <Text style={styles.textSmallMuted}>Membre depuis</Text>
                <Text style={styles.textMedium}>{user.memberSince}</Text>
              </View>
            </View>
          </View>

          {/* Main Button */}
          <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.mainButtonText}>Accéder à mes comptes</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="create-outline" size={16} color="#000" />
              <Text style={styles.outlineButtonText}>Modifier profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('SettingsScreen')}> 
              <Ionicons name="settings-outline" size={16} color="#000" />
              <Text style={styles.outlineButtonText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
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
  outlineButtonText: { fontWeight: '500', color: '#000' }
});