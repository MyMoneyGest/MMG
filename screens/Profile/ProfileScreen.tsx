import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform, Image,ScrollView,
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
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.disabled]} value={email} editable={false} />

        <Text style={styles.label}>Nom complet</Text>
        <TextInput style={[styles.input, disabled && styles.disabled]} value={name} onChangeText={setName} editable={!disabled} />

        <Text style={styles.label}>Téléphone (+241...)</Text>
        <TextInput style={[styles.input, disabled && styles.disabled]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!disabled} />

        <Text style={styles.label}>Adresse</Text>
        <TextInput style={[styles.input, disabled && styles.disabled]} value={address} onChangeText={setAddress} editable={!disabled} />

        <Text style={styles.label}>Date de naissance</Text>
        <TouchableOpacity
          onPress={() => !disabled && setShowPicker(true)}
          style={[styles.input, disabled && styles.disabled]}
          disabled={disabled}
        >
          <Text>{birthDate ? birthDate.toLocaleDateString('fr-FR') : 'Sélectionnez une date'}</Text>
        </TouchableOpacity>

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

        <TouchableOpacity style={[styles.button, disabled && { backgroundColor: '#aaa' }]} onPress={handleUpdate} disabled={disabled}>
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

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 15 }}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={pickImage} disabled={uploading}>
          <Text style={styles.buttonText}>
            {uploading ? 'Téléversement...' : 'Changer la photo de profil'}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </View>
      {/* ✅ Fond noir en bas */}
    <View style={styles.bottomBackground} />
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 2 },
  card: { backgroundColor: '#ffffffcc', padding: 5, borderRadius: 10 },
  label: { fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10 },
  disabled: { backgroundColor: '#e0e0e0' },
  scrollContent: { padding: 20 },
  button: {
    backgroundColor: '#00796B',
    marginTop: 10,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  linkButton: { marginTop: 15, alignItems: 'center' },
  linkText: { color: '#00796B', textDecorationLine: 'underline' },
  warningText: {
    marginTop: 15,
    color: '#ffeb3b',
    backgroundColor: '#263238',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#B71C1C',
    marginTop: 25,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomTabs: {
    position: 'absolute',
    bottom: 80, // correspond à la hauteur du fond noir
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#00796B',
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  bottomBackground: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 30, // tu peux ajuster cette valeur selon le visuel souhaité
  backgroundColor: '#000',
  zIndex: -1,
},
});