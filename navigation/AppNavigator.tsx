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
import EnterSendAmountScreen from '../screens/Airtel/EnterSendAmountScreen';
import TransactionDetailScreen from '../screens/Airtel/TransactionDetailScreen';
import AirtelBeneficiairesScreen from '../screens/Airtel/AirtelBeneficiairesScreen';
import EditBeneficiaryScreen from '../screens/Airtel/EditBeneficiaryScreen';
import NotificationsScreen from '../screens/Airtel/NotificationsScreen';
import RequestPaymentScreen from '../screens/Airtel/RequestPaymentScreen';
import GestionEntrepriseScreen from '../Entreprise/GestionEntrepriseScreen';
import EntrepriseRevenusScreen from '../Entreprise/EntrepriseRevenusScreen';
import BudgetMensuelScreen from '../screens/Airtel/BudgetMensuelScreen';
import DepenseProfessionnellesScreen from '../Entreprise/DepenseProfessionnellesScreen';
import FacturesScreen from '../Entreprise/FacturesScreen';
import EntrepriseRapportsScreen from '../Entreprise/EntrepriseRapportsScreen';
import UserTypeSelectionScreen from '../screens/Authentification/UserTypeSelectionScreen';
import EnterEnterpriseCodeScreen from '../screens/Authentification/EnterEnterpriseCodeScreen';

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
  NotificationsScreen : undefined;
  EditBeneficiaryScreen: {
  beneficiary: {
    id: string;
    name: string;
    phone: string;
    [key: string]: any;
  };
};
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
  RequestPaymentScreen : undefined;
  BudgetMensuelScreen: undefined;
  GestionEntrepriseScreen : undefined;
  EntrepriseRevenusScreen : undefined;
  DepenseProfessionnellesScreen : undefined;
  FacturesScreen : undefined;
  EntrepriseRapportsScreen : undefined;
  UserTypeSelectionScreen : undefined;
  EnterEnterpriseCodeScreen : undefined;
};

export type Transaction = {
  id: string;
  type: string;
  amount: number;
  date: string;
  reference: string;
  status: string;
  sender: string;         // 👈 nouvel attribut
  receiver: string;       // 👈 nouvel attribut
  reason?: string;
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

      <Stack.Screen name="AirtelBeneficiairesScreen" component={AirtelBeneficiairesScreen} />
      <Stack.Screen name="EnterSendAmountScreen" component={EnterSendAmountScreen} />
      <Stack.Screen name="EditBeneficiaryScreen" component={EditBeneficiaryScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="RequestPaymentScreen" component={RequestPaymentScreen} />
      <Stack.Screen name="BudgetMensuelScreen" component={BudgetMensuelScreen} />
      <Stack.Screen name="GestionEntrepriseScreen" component={GestionEntrepriseScreen} />
      <Stack.Screen name="EntrepriseRevenusScreen" component={EntrepriseRevenusScreen} />
      <Stack.Screen name="DepenseProfessionnellesScreen" component={DepenseProfessionnellesScreen} />
      <Stack.Screen name="FacturesScreen" component={FacturesScreen} />
      <Stack.Screen name="EntrepriseRapportsScreen" component={EntrepriseRapportsScreen} />
      <Stack.Screen name="UserTypeSelectionScreen" component={UserTypeSelectionScreen} />
      <Stack.Screen name="EnterEnterpriseCodeScreen" component={EnterEnterpriseCodeScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;