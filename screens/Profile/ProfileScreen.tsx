import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform, Image, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture } from '../../services/firebaseStorage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

type ProfileScreenProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenProp>();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Timestamp | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const askPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissions requises', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setEmail(currentUser.email || '');
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserId(currentUser.uid);
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setBirthday(data.birthday || '');
          setLastUpdated(data.lastUpdated || null);
          setImageUri(data.photoURL || null);
          if (data.birthday) {
            setBirthDate(new Date(data.birthday));
          }
        }
      }
      setLoading(false);
    };

    const requestPermissionsAndFetch = async () => {
      await askPermissions();
      await fetchUser();
    };

    requestPermissionsAndFetch();
  }, []);

  const is24hPassed = () => {
    if (!lastUpdated) return true;
    const now = new Date();
    const last = lastUpdated.toDate();
    return now.getTime() - last.getTime() > 24 * 60 * 60 * 1000;
  };

  const getRemainingTime = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const last = lastUpdated.toDate();
    const diff = 24 * 60 * 60 * 1000 - (now.getTime() - last.getTime());
    if (diff <= 0) return '';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const disabled = !is24hPassed();

  const handleUpdate = async () => {
    if (!name || !phone || !address) {
      Alert.alert('Champs requis', 'Tous les champs doivent être remplis.');
      return;
    }

    if (!phone.startsWith('+241')) {
      Alert.alert('Format invalide', 'Le numéro doit commencer par +241.');
      return;
    }

    if (!is24hPassed()) {
      Alert.alert('Modification refusée', 'Vous devez attendre 24 heures après votre dernière modification.');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name,
        phone,
        address,
        birthday,
        lastUpdated: Timestamp.now(),
      });

      setLastUpdated(Timestamp.now());
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue pendant la mise à jour.');
    }
  };

  const goToChangePassword = () => navigation.navigate('ChangePassword');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se déconnecter.');
    }
  };

  const pickImage = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Utilisateur non identifié.");
      return;
    }

    const hasPermission = await askPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);

      try {
        setUploading(true);
        const downloadURL = await uploadProfilePicture(uri, userId);
        await updateDoc(doc(db, 'users', userId), { photoURL: downloadURL });
        Alert.alert('Succès', 'Photo de profil mise à jour.');
      } catch (error) {
        Alert.alert('Erreur', 'Échec du téléversement.');
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#00796B" />;

  return (
    <LinearGradient colors={['#A8E6CF', '#00BCD4']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.placeholder]}>
              <Ionicons name="person" size={64} color="#00796B" />
            </View>
          )}
          <TouchableOpacity style={styles.editPhotoBtn} onPress={pickImage} disabled={uploading}>
            <Text style={styles.editPhotoText}>{uploading ? 'Téléversement...' : 'Changer la photo'}</Text>
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Bienvenue, {name ? name.split(' ')[0] : 'Utilisateur'} 👋</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color="#00796B" style={styles.icon} />
            <TextInput style={[styles.input, styles.disabled]} value={email} editable={false} />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#00796B" style={styles.icon} />
            <TextInput
              style={[styles.input, disabled && styles.disabled]}
              value={name}
              onChangeText={setName}
              editable={!disabled}
              placeholder="Nom complet"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="call-outline" size={20} color="#00796B" style={styles.icon} />
            <TextInput
              style={[styles.input, disabled && styles.disabled]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!disabled}
              placeholder="+241 ..."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="location-outline" size={20} color="#00796B" style={styles.icon} />
            <TextInput
              style={[styles.input, disabled && styles.disabled]}
              value={address}
              onChangeText={setAddress}
              editable={!disabled}
              placeholder="Adresse"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="calendar-outline" size={20} color="#00796B" style={styles.icon} />
            <TouchableOpacity
              onPress={() => !disabled && setShowPicker(true)}
              style={[styles.input, disabled && styles.disabled]}
              disabled={disabled}
            >
              <Text style={{ color: birthDate ? '#000' : '#666' }}>
                {birthDate ? birthDate.toLocaleDateString('fr-FR') : 'Sélectionnez une date'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setBirthDate(selectedDate);
                  setBirthday(selectedDate.toISOString());
                }
              }}
              maximumDate={new Date()}
            />
          )}

          <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={handleUpdate} disabled={disabled}>
            <Text style={styles.buttonText}>Mettre à jour</Text>
          </TouchableOpacity>

          {disabled && (
            <Text style={styles.warningText}>
              Vous pourrez modifier vos informations dans {getRemainingTime()}.
            </Text>
          )}

          <TouchableOpacity style={styles.linkButton} onPress={goToChangePassword}>
            <Text style={styles.linkText}>Changer le mot de passe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBackground} />
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00796B',
    backgroundColor: '#dcedc8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoBtn: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#00796B',
    borderRadius: 20,
    alignSelf: 'center',
  },
  editPhotoText: {
    color: '#fff',
    fontWeight: '600',
  },
  welcomeText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '700',
    color: '#004D40',
  },
  form: {
    backgroundColor: '#ffffffdd',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderColor: '#00796B',
    paddingBottom: 6,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#004D40',
  },
  disabled: {
    backgroundColor: '#eee',
    color: '#999',
  },
  button: {
    backgroundColor: '#00796B',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  warningText: {
    marginTop: 12,
    color: '#d32f2f',
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#00796B',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  logoutButton: {
    marginTop: 35,
    alignItems: 'center',
  },
  logoutText: {
    color: '#d32f2f',
    fontSize: 17,
    fontWeight: '700',
  },
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    height: 50,
    width: '100%',
    backgroundColor: '#004D40',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});