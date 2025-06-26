// services/firebaseConfig.ts
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCl2Xp-LhXewBMYXJXvM7KAyTbQj6Xevqo",
  authDomain: "mymoneygest-f14d7.firebaseapp.com",
  projectId: "mymoneygest-f14d7",
  storageBucket: "mymoneygest-f14d7.appspot.com",
  messagingSenderId: "39240748405",
  appId: "1:39240748405:web:8b88b111efb3bd2dd8d73c",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);