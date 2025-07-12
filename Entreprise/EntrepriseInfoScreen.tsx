import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

const EntrepriseInfoScreen = () => {
  const [info, setInfo] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser!;
        const udoc = await getDoc(doc(db, 'users', user.uid));
        const userData = udoc.data();
        if (!userData?.entrepriseId) {
          setInfo(null);
          setLoading(false);
          return;
        }

        const entrepriseRef = doc(db, 'entreprises', userData.entrepriseId);
        const entrepriseDoc = await getDoc(entrepriseRef);
        if (!entrepriseDoc.exists()) {
          setInfo(null);
          setLoading(false);
          return;
        }

        const entrepriseData = entrepriseDoc.data();
        entrepriseData.id = entrepriseDoc.id; // pour updateDoc plus tard

        setInfo(entrepriseData);
        setForm(entrepriseData);

        const isOwner = entrepriseData.createdBy === user.uid;
        setIsCreator(isOwner);

        // Vérifie si la dernière modif remonte à +24h
        const lastUpdated = entrepriseData.lastUpdated?.toDate?.() || entrepriseData.createdAt?.toDate?.();
        if (isOwner && lastUpdated) {
          const diffHours = dayjs().diff(dayjs(lastUpdated), 'hour');
          setCanEdit(diffHours >= 24);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement entreprise:', error);
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveChanges = async () => {
    if (!info) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'entreprises', info.id), {
        ...form,
        lastUpdated: serverTimestamp(), // pour limiter modif toutes les 24h
      });
      setInfo({ ...form, id: info.id });
      setEditing(false);
      setCanEdit(false);
      Alert.alert('Succès', 'Informations mises à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#00796B" />;
  }

  if (!info) {
    return (
      <View style={styles.container}>
        <Text style={styles.noInfo}>Aucune information entreprise trouvée.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Infos Entreprise</Text>

      {Object.entries(form).map(([key, val]) => {
        // Exclure les champs non utiles
        if (['createdBy', 'id', 'createdAt', 'lastUpdated'].includes(key)) return null;

        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>
              {key.charAt(0).toUpperCase() + key.slice(1)} :
            </Text>
            {isCreator && editing ? (
              <TextInput
                style={styles.input}
                value={String(val)}
                onChangeText={(text) => handleChange(key, text)}
              />
            ) : (
              <Text style={styles.value}>{String(val)}</Text>
            )}
          </View>
        );
      })}

      {isCreator && (
        <View style={styles.btnContainer}>
          {editing ? (
            <>
              <TouchableOpacity style={styles.btnSave} onPress={saveChanges}>
                <Text style={styles.btnText}>Sauvegarder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setForm(info!);
                  setEditing(false);
                }}
              >
                <Text style={styles.btnText}>Annuler</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.btnEdit, { backgroundColor: canEdit ? '#00796B' : '#9E9E9E' }]}
                onPress={() => canEdit ? setEditing(true) : null}
                disabled={!canEdit}
              >
                <Text style={styles.btnText}>Modifier</Text>
              </TouchableOpacity>
              {!canEdit && (
                <Text style={styles.note}>
                  Vous pouvez modifier les informations une fois toutes les 24 heures.
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default EntrepriseInfoScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#004D40',
    marginBottom: 25,
    textAlign: 'center',
  },
  row: {
    marginBottom: 18,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontWeight: '700',
    color: '#00796B',
    fontSize: 16,
  },
  value: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  input: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#00796B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: '#004D40',
    backgroundColor: '#e0f2f1',
  },
  btnContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  btnEdit: {
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  btnSave: {
    backgroundColor: '#004D40',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  btnCancel: {
    backgroundColor: '#b0bec5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  noInfo: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
  },
  note: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});