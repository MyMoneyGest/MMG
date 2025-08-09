// screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  TextInput, ActivityIndicator, SafeAreaView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  bg: '#f9fafb',
  header: '#0f172a',
  white: '#ffffff',
  muted: '#6b7280',
  border: '#e5e7eb',
  border2: '#d1d5db',
  text: '#000000',
  primary: '#0f172a',
  progress: '#0f172a',
  success: '#22c55e',
  slate: '#cbd5e1',
};

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  // Données profil (branche-les à Firestore/Auth si besoin)
  const [name, setName] = useState('Jean Kouassi');
  const [email] = useState('jean.kouassi@email.com');
  const [phone, setPhone] = useState('+241 06 00 00 00');
  const [address, setAddress] = useState('Libreville, Gabon');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>('https://randomuser.me/api/portraits/men/75.jpg');

  // Sécurité (changement mdp inline)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ current:false, next:false, confirm:false });

  // Erreurs inline
  const [errors, setErrors] = useState<{[k:string]: string}>({});

  const validate = () => {
    const e: {[k:string]: string} = {};
    if (!name.trim()) e.name = 'Le nom est requis';
    if (!phone.startsWith('+241')) e.phone = 'Le numéro doit commencer par +241';
    if (!address.trim()) e.address = 'Adresse requise';

    if (newPassword || confirmPassword) {
      if (!currentPassword) e.currentPassword = 'Mot de passe actuel requis';
      if ((newPassword || '').length < 6) e.newPassword = 'Min. 6 caractères';
      if (newPassword !== confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: branche ici la mise à jour Firestore + updatePassword si nécessaire
      setTimeout(() => {
        setLoading(false);
        alert('Modifications enregistrées ✅');
      }, 800);
    } catch {
      setLoading(false);
      alert('Une erreur est survenue.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert("Autorisez l'accès aux photos pour changer l'avatar.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.length) {
      setImageUri(res.assets[0].uri);
      // TODO: upload Storage + maj Firestore
    }
  };

  const securityLevel = 85;
  const checks = [
    { label: 'Identité vérifiée', completed: true },
    { label: 'Numéro confirmé', completed: true },
    { label: 'Email validé', completed: true },
    { label: 'Code PIN défini', completed: true },
    { label: 'Authentification 2FA', completed: false },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Modifier le profil</Text>
            <Text style={styles.headerSubtitle}>Mettez à jour vos informations personnelles</Text>
          </View>
          <Ionicons name="shield-outline" size={22} color="#fff" />
        </View>

        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.card}>
          <Text style={styles.photoTitle}>
            <Ionicons name="camera-outline" size={16} color="#1e293b" /> Photo de profil
          </Text>

          <View style={styles.photoContainer}>
            <Image
              source={{ uri: imageUri || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
              <Ionicons name="camera-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.photoInfo}>JPG, PNG jusqu'à 5MB</Text>
        </View>

          {/* Informations personnelles */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Votre nom complet"
                placeholderTextColor={COLORS.muted}
              />
              {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                style={[styles.input, { color: '#8A8F98' }]}
                value={email}
                editable={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Numéro de téléphone</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+241 XX XX XX XX"
                placeholderTextColor={COLORS.muted}
              />
              {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={address}
                onChangeText={setAddress}
                placeholder="Votre adresse"
                placeholderTextColor={COLORS.muted}
              />
              {!!errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <Text style={styles.label}>Date de naissance</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.dateText}>
                {birthDate ? birthDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={birthDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (selectedDate) setBirthDate(selectedDate);
                }}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Sécurité du compte */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-outline" size={20} color={COLORS.text} />
              <Text style={styles.cardTitle}>Sécurité du compte</Text>
            </View>

            <Text style={styles.smallHint}>Laissez vide si vous ne souhaitez pas changer votre mot de passe</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.inputFlex, errors.currentPassword && styles.inputError]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showPass.current}
                  placeholder="Votre mot de passe actuel"
                  placeholderTextColor={COLORS.muted}
                />
                <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, current: !s.current }))}>
                  <Ionicons name={showPass.current ? 'eye-off' : 'eye'} size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {!!errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.inputFlex, errors.newPassword && styles.inputError]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPass.next}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor={COLORS.muted}
                />
                <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, next: !s.next }))}>
                  <Ionicons name={showPass.next ? 'eye-off' : 'eye'} size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {!!errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.inputFlex, errors.confirmPassword && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPass.confirm}
                  placeholder="Répétez le nouveau mot de passe"
                  placeholderTextColor={COLORS.muted}
                />
                <TouchableOpacity onPress={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))}>
                  <Ionicons name={showPass.confirm ? 'eye-off' : 'eye'} size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Niveau de sécurité */}
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressRow}>
                <Text style={styles.textSmall}>Sécurité du compte</Text>
                <Text style={styles.textSmallBold}>{securityLevel}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${securityLevel}%` }]} />
              </View>
              <View style={{ marginTop: 12 }}>
                {checks.map((check, i) => (
                  <View key={i} style={styles.checkRow}>
                    <Ionicons
                      name={check.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={check.completed ? COLORS.success : '#9ca3af'}
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
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.mainButton} onPress={handleSave} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Text style={styles.mainButtonText}>Sauvegarder les modifications</Text>
                  <Ionicons name="save-outline" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </>
              )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="close-outline" size={18} color={COLORS.text} />
            <Text style={styles.outlineButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.header,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: COLORS.slate, fontSize: 12 },

  content: { padding: 16, gap: 16 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600' },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600' },
  textMuted: { fontSize: 13, color: COLORS.muted },

  badge: {
    marginTop: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  badgeText: { fontSize: 12, color: '#374151' },

  field: { marginTop: 12 },
  label: { fontSize: 13, color: COLORS.text, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text
  },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 6 },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6
  },
  dateText: { color: COLORS.text },

  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  inputFlex: { flex: 1, color: COLORS.text },

  smallHint: { fontSize: 12, color: COLORS.muted, marginTop: 6 },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 6 },
  progressFill: { height: 6, backgroundColor: COLORS.progress, borderRadius: 3 },

  textSmall: { fontSize: 13 },
  textSmallBold: { fontSize: 13, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  activateLink: { fontSize: 12, color: COLORS.primary, marginLeft: 'auto' },

  mainButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainButtonText: { color: '#fff', fontWeight: '600' },

  outlineButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border2,
    marginTop: 10
  },
  outlineButtonText: { fontWeight: '500', color: COLORS.text },

  profileCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  paddingVertical: 20,
  paddingHorizontal: 16,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
},
photoTitle: {
  fontSize: 14,
  color: '#1e293b',
  fontWeight: '500',
  marginBottom: 16,
  textAlign: 'center', // centrage
},
photoContainer: {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
},
profileImage: {
  width: 96,
  height: 96,
  borderRadius: 48,
},
cameraBtn: {
  position: 'absolute',
  bottom: 0,
  right: '35%',
  backgroundColor: '#1e293b',
  borderRadius: 16,
  padding: 6,
},
photoInfo: {
  marginTop: 10,
  fontSize: 12,
  color: '#64748b',
  backgroundColor: '#f1f5f9',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
  textAlign: 'center', // centrage
  alignSelf: 'center', // centre dans le parent
}

});