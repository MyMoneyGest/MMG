import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Authentification/LoginScreen';
import RegisterScreen from '../screens/Authentification/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ForgotPasswordScreen from '../screens/Authentification/ForgotPasswordScreen';
import ChangePasswordScreen from '../screens/Authentification/ChangePasswordScreen';
import AccountsScreen from '../screens/accounts/AccountsScreen';
import AirtelMoneyScreen from '../screens/Airtel/AirtelMoneyScreen';
import LibertisScreen from '../screens/Libertis/LibertisScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import LibertisTransactionsScreen from '../screens/Libertis/LibertisTransactionsScreen';
import AirtelMoneyAllTransactionsScreen from '../screens/Airtel/AirtelMoneyAllTransactionsScreen';
import TransactionDetailLibertisScreen from '../screens/Libertis/TransactionDetailLibertisScreen';
import VaultsScreen from '../screens/Airtel/VaultsScreen';
import LinkAirtelScreen from '../screens/Airtel/LinkAirtelScreen';
import VaultDetailsScreen from '../screens/Airtel/VaultDetailsScreen';
import ConfirmSendAirtelScreen from '../screens/Airtel/ConfirmSendAirtelScreen';
import SendAmountAirtelScreen from '../screens/Airtel/SendAmountAirtelScreen';
import AirtelSendMoneyScreen from '../screens/Airtel/AirtelSendMoneyScreen';
import AirtelBeneficiairesScreen from '../screens/Airtel/AirtelBeneficiairesScreen';
import EnterSendAmountScreen from '../screens/Airtel/EnterSendAmountScreen';
import TransactionDetailScreen from '../screens/Airtel/TransactionDetailScreen';

export type RootStackParamList = {
  // ...autres écrans
  VaultDetails: {
  
  vault: {
    id: string;
    name: string;
    balance: number;
    goal?: number;
    createdAt: Date;
    type: 'standard' | 'locked';
    lockedUntil?: string; // 🔧 ajouté
    uid: string;          // 🔧 ajouté

  };
  };

  Accounts: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  ChangePassword: undefined;
  AirtelMoney: undefined;
  AirtelMoneyAllTransactions: undefined;
  Libertis: undefined;
  Profile: undefined;
  LibertisTransactions: undefined;
  TransactionDetail: { transaction: Transaction };
  VaultsScreen: undefined;
  LinkAirtelScreen: undefined;
  AirtelSendMoneyScreen : undefined;
  AirtelBeneficiairesScreen: undefined ;
  TransactionDetailLibertis: { transaction: Transaction };
  ConfirmSendAirtelScreen: {
  beneficiary: any; // ou un type spécifique comme { name: string; phone: string }
  amount: number;
  reason?: string;
  };

  SendAmountAirtelScreen: {
    beneficiary: {
      name: string;
      phone: string;
      // autres champs si besoin
    };
  };

  EnterSendAmountScreen : undefined;
};

export type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  reference: string;
  status: string;
  sender: string;         // 👈 nouvel attribut
  receiver: string;       // 👈 nouvel attribut
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  initialRoute: keyof RootStackParamList;
};

const AppNavigator = ({ initialRoute }: AppNavigatorProps) => {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Accounts" component={AccountsScreen} />
      <Stack.Screen name="AirtelMoney" component={AirtelMoneyScreen} />
      <Stack.Screen name="AirtelMoneyAllTransactions" component={AirtelMoneyAllTransactionsScreen} />
      <Stack.Screen name="Libertis" component={LibertisScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="LibertisTransactions" component={LibertisTransactionsScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="VaultsScreen" component={VaultsScreen} />
      <Stack.Screen name="VaultDetails" component={VaultDetailsScreen} />
      <Stack.Screen name="LinkAirtelScreen" component={LinkAirtelScreen} />
      <Stack.Screen name="AirtelSendMoneyScreen" component={AirtelSendMoneyScreen} />
      <Stack.Screen name="TransactionDetailLibertis" component={TransactionDetailLibertisScreen} />
      <Stack.Screen name="ConfirmSendAirtelScreen" component={ConfirmSendAirtelScreen} />
      <Stack.Screen name="SendAmountAirtelScreen" component={SendAmountAirtelScreen} />
      <Stack.Screen name="EnterSendAmountScreen" component={EnterSendAmountScreen} />
      <Stack.Screen name="AirtelBeneficiairesScreen" component={AirtelBeneficiairesScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;