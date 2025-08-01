import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type MentionsLegalesScreenProp = NativeStackNavigationProp<RootStackParamList, 'MentionsLegales'>;

const MentionsLegalesScreen = () => {
  //const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const navigation = useNavigation<MentionsLegalesScreenProp>();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mentions légales – MyMoneyGest</Text>

      <Text style={styles.sectionTitle}>Éditeur de l’application</Text>
      <Text style={styles.paragraph}>
        MyMoneyGest est une application personnelle développée par Patrick NGOUALA, résidant en France.
      </Text>

      <Text style={styles.sectionTitle}>Contact</Text>
      <Text style={styles.paragraph}>Email : mymoneygest@gmail.com</Text>

      <Text style={styles.sectionTitle}>Statut</Text>
      <Text style={styles.paragraph}>
        Application en cours de développement, utilisée uniquement à des fins de test privé. Aucun usage commercial
        ni diffusion publique à ce jour.
      </Text>

      <Text style={styles.sectionTitle}>Hébergement</Text>
      <Text style={styles.paragraph}>
        Les données sont hébergées sur Firebase (Google), avec des règles de sécurité appliquées pour restreindre les accès.
      </Text>

      <Text style={styles.sectionTitle}>Responsabilité</Text>
      <Text style={styles.paragraph}>
        L’éditeur ne saurait être tenu responsable des conséquences liées à l’usage de l’application. Aucune transaction
        réelle n’est effectuée via MyMoneyGest(MMG).
      </Text>

      <Text style={styles.sectionTitle}>Données personnelles</Text>
      <View style={styles.linkContainer}>
      <Text style={styles.paragraph}>
        Voir la{' '}
        <Text style={styles.linkText} onPress={() => navigation.navigate('PolitiqueConfidentialite')}>
          politique de confidentialité
        </Text>{' '} pour les détails liés au traitement des données personnelles. L’utilisateur peut à tout moment demander la suppression de ses données via l’adresse de contact mentionnée ci-dessus.
      </Text>
    </View>
    </ScrollView>
  );
};

export default MentionsLegalesScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00796B',
    marginTop: 20,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  linkText: {
    color: '#00796B',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  linkContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
  },

});