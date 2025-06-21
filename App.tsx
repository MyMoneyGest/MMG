import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import { ActivityIndicator, View, LogBox } from 'react-native';
import { setJSExceptionHandler } from 'react-native-exception-handler';

// Ignore les erreurs Firebase gênantes dans la console et l'écran rouge
LogBox.ignoreLogs([
  'Firebase: Error (auth/invalid-credential).',
  'Firebase: Error (auth/wrong-password).',
  // Ajoute d'autres si nécessaire
]);

// Gestionnaire global d'exceptions JS
setJSExceptionHandler((error, isFatal) => {
  if (__DEV__) {
    console.log('Exception attrapée:', error);
  }
  // Tu peux ici afficher une UI custom ou juste ignorer
}, true);

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('État utilisateur :', currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading || user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00796B" />
      </View>
    );
  }

  return (
    <NavigationContainer key={user ? 'auth' : 'guest'}>
      <AppNavigator initialRoute={user ? 'Home' : 'Login'} />
    </NavigationContainer>
  );
}