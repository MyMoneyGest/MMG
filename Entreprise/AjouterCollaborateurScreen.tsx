import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Clipboard,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../services/firebaseConfig';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AjouterCollaborateurScreen'>;

function generateCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for(let i=0; i<length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

type CodeType = {
  id: string;
  entrepriseId: string;
  createdBy: string;
  createdAt: any;
  used: boolean;
  expiresAt: any | null;
  disabled?: boolean;
};

const AjouterCollaborateurScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<CodeType[]>([]);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [expiration, setExpiration] = useState<string>(''); // YYYY-MM-DD

  useEffect(() => {
    const fetchCodes = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Utilisateur non connecté");
        navigation.goBack();
        return;
      }
      const entrepriseId = user.uid;

      const codesQuery = query(
        collection(db, 'entrepriseCodes'),
        where('entrepriseId', '==', entrepriseId)
      );

      const unsubscribe = onSnapshot(codesQuery, snapshot => {
        const list: CodeType[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        setCodes(list);
      }, error => {
        console.error('Erreur récupération codes:', error);
        Alert.alert('Erreur', 'Impossible de récupérer les codes.');
      });

      return unsubscribe;
    };

    fetchCodes();
  }, [navigation]);

  const handleGenerateCode = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté.");

      const entrepriseId = user.uid;

      const codeGenerated = generateCode(8);

      let expiresAt = null;
      if (expiration) {
        const date = new Date(expiration);
        if (isNaN(date.getTime())) {
          Alert.alert('Date invalide', 'Merci d\'entrer une date valide au format YYYY-MM-DD.');
          setLoading(false);
          return;
        }
        expiresAt = date;
      }

      await setDoc(doc(db, 'entrepriseCodes', codeGenerated), {
        entrepriseId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        used: false,
        expiresAt,
        disabled: false,
      });

      setNewCode(codeGenerated);
      Alert.alert('Code généré', `Le code d’invitation est : ${codeGenerated}`);
      setExpiration('');
    } catch (error: any) {
      console.error('Erreur génération code :', error);
      Alert.alert('Erreur', error.message || "Impossible de générer le code.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copié', 'Code copié dans le presse-papiers.');
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Supprimer le code',
      'Êtes-vous sûr de vouloir supprimer ce code ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'entrepriseCodes', id));
              Alert.alert('Succès', 'Code supprimé.');
            } catch (error) {
              console.error('Erreur suppression code:', error);
              Alert.alert('Erreur', "Impossible de supprimer le code.");
            }
          },
        },
      ]
    );
  };

  const toggleDisable = async (code: CodeType) => {
    try {
      await updateDoc(doc(db, 'entrepriseCodes', code.id), {
        disabled: !code.disabled,
      });
      Alert.alert('Succès', `Code ${code.disabled ? 'activé' : 'désactivé'}.`);
    } catch (error) {
      console.error('Erreur modification statut:', error);
      Alert.alert('Erreur', "Impossible de modifier le statut du code.");
    }
  };

  const renderItem = ({ item }: { item: CodeType }) => {
    const isExpired = item.expiresAt ? item.expiresAt.toDate() < new Date() : false;
    return (
      <View style={styles.codeItem}>
        <Text style={[styles.codeText, item.disabled && { textDecorationLine: 'line-through' }]}>
          {item.id}
        </Text>
        <Text style={styles.statusText}>
          {item.used ? 'Utilisé' : isExpired ? 'Expiré' : item.disabled ? 'Désactivé' : 'Actif'}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => copyToClipboard(item.id)} style={styles.actionBtn}>
            <Text style={styles.actionText}>Copier</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleDisable(item)} style={styles.actionBtn}>
            <Text style={styles.actionText}>{item.disabled ? 'Activer' : 'Désactiver'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtnDelete}>
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={codes}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={{ alignSelf: 'center' }}>Aucun code généré.</Text>}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Ajouter un collaborateur & gérer les codes</Text>

          <TextInput
            placeholder="Date d'expiration (YYYY-MM-DD)"
            style={styles.input}
            value={expiration}
            onChangeText={setExpiration}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#00796B" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleGenerateCode}>
              <Text style={styles.buttonText}>Générer un code d’invitation</Text>
            </TouchableOpacity>
          )}

          {newCode && (
            <>
              <Text style={styles.newCode}>{newCode}</Text>
              <TouchableOpacity style={styles.button} onPress={() => copyToClipboard(newCode)}>
                <Text style={styles.buttonText}>Copier le code</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.listTitle}>Codes d’invitation existants :</Text>
        </View>
      }
      contentContainerStyle={styles.container}
    />
  );

};

export default AjouterCollaborateurScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#00796B',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    width: '100%',
  },
  button: {
    backgroundColor: '#00796B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    width: 200,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  newCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004d40',
    marginVertical: 10,
    textAlign: 'center',
    letterSpacing: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  codeItem: {
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '100%',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004d40',
  },
  statusText: {
    fontSize: 14,
    color: '#00796B',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    backgroundColor: '#00796B',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  actionBtnDelete: {
    backgroundColor: '#d32f2f',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },

  headerContainer: {
    width: '100%',
    alignItems: 'center',
  }

});