//AppNavigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Authentification/LoginScreen';
import RegisterScreen from '../screens/Authentification/RegisterScreen';
import RegisterCompteProScreen from '../screens/Authentification/RegisterCompteProScreen';
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
import SharedVaultsScreen from '../screens/Airtel/SharedVaultsScreen';
import SharedVaultDetailScreen from '../screens/Airtel/SharedVaultDetailScreen';
import AddSharedVaultMemberScreen from '../screens/Airtel/AddSharedVaultMemberScreen';
import CreateSharedVaultScreen from '../screens/Airtel/CreateSharedVaultScreen';
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
import RequestsInboxScreen from '../screens/Airtel/RequestsInboxScreen';
import PaymentRequestDetail from '../screens/Airtel/PaymentRequestDetail';
import RequestsHubScreen from '../screens/Airtel/RequestsHubScreen';
import GestionEntrepriseScreen from '../Entreprise/GestionEntrepriseScreen';
import EntrepriseRevenusScreen from '../Entreprise/EntrepriseRevenusScreen';
import DepenseProfessionnellesScreen from '../Entreprise/DepenseProfessionnellesScreen';
import FacturesScreen from '../Entreprise/FacturesScreen';
import EntrepriseRapportsScreen from '../Entreprise/EntrepriseRapportsScreen';
import UserTypeSelectionScreen from '../screens/Authentification/UserTypeSelectionScreen';
import EntrepriseCodeScreen from '../screens/Authentification/EntrepriseCodeScreen';
import CreerEntrepriseScreen from '../Entreprise/CreerEntrepriseScreen';
import SendConfirmationCodeScreen from '../screens/Authentification/SendConfirmationCodeScreen';
import DevisScreen from '../Entreprise/DevisScreen';
import DocumentsScreen from '../Entreprise/DocumentsScreen';
import ProjectsScreen from '../Entreprise/ProjectsScreen';
import ClientsScreen from '../Entreprise/ClientsScreen';
import SupportScreen from '../Entreprise/SupportScreen';
import EntrepriseInfoScreen from '../Entreprise/EntrepriseInfoScreen';
import CollaboratorsScreen from '../Entreprise/CollaboratorsScreen';
import AjouterCollaborateurScreen from '../Entreprise/AjouterCollaborateurScreen';
import LinkedAccountSectionScreen from '../Entreprise/LinkedAccountSectionScreen';
import CompanyAccountScreen from '../Entreprise/CompanyAccountScreen';
import AirtelMoneyEntrepriseScreen from '../Entreprise/AirtelMoneyEntrepriseScreen';
import AirtelMoneyEntrepriseDetailsScreen from '../Entreprise/AirtelMoneyEntrepriseDetailsScreen';
import MoovMoneyEntrepriseScreen from '../Entreprise/MoovMoneyEntrepriseScreen';
import MoovMoneyEntrepriseDetailsScreen from '../Entreprise/MoovMoneyEntrepriseDetailsScreen';
import MentionsLegalesScreen from '../screens/Authentification/MentionsLegalesScreen';
import CompteBancaireEntrepriseScreen from '../Entreprise/CompteBancaireEntrepriseScreen';
import CompteBancaireEntrepriseDetailsScreen from '../Entreprise/CompteBancaireEntrepriseDetailsScreen';
import BudgetMensuelScreen from '../screens/Airtel/BudgetMensuelScreen';
import MonthlyActivityScreen from '../screens/Airtel/MonthlyActivityScreen';
import StatementsScreen from '../screens/Airtel/StatementsScreen';
import AirtelRechargeScreen from '../screens/Airtel/AirtelRechargeScreen';
import AirtelWithdrawScreen from '../screens/Airtel/AirtelWithdrawScreen';
import PolitiqueConfidentialiteScreen from '../screens/Authentification/PolitiqueConfidentialiteScreen';
import AirtelSupportScreen from '../screens/Airtel/AirtelSupportScreen';


export type RootStackParamList = {

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
  RegisterCompteProScreen : undefined;
  HomeScreen: undefined;
  ForgotPassword: undefined;
  ChangePassword: undefined;
  AirtelMoney: undefined;
  AirtelWithdrawScreen : undefined;
  AirtelMoneyAllTransactions: undefined;
  Libertis: undefined;
  Profile: undefined;
  LibertisTransactions: undefined;
  TransactionDetail: { transaction: Transaction};
  VaultsScreen: undefined;
  SharedVaultsScreen: undefined;
  SharedVaultDetailScreen : {vaultId: string };
  AddSharedVaultMemberScreen : { vaultId: string};
  CreateSharedVaultScreen : undefined;
  LinkAirtelScreen: undefined;
  AirtelSendMoneyScreen : undefined;
  AirtelSupportScreen : undefined;
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

  GestionEntrepriseScreen : undefined;
  EnterSendAmountScreen : undefined;
  RequestPaymentScreen : undefined;
  RequestsInboxScreen: { filter?: 'received' | 'sent'; highlightId?: string } | undefined;
  RequestsHubScreen : undefined;
  PaymentRequestDetail : {requestId : string};
  BudgetMensuelScreen: undefined;
  EntrepriseRevenusScreen : undefined;
  DepenseProfessionnellesScreen : undefined;
  FacturesScreen : undefined;
  EntrepriseRapportsScreen : undefined;
  UserTypeSelectionScreen : undefined;
  EntrepriseCodeScreen : undefined;
  CreerEntrepriseScreen: { userId: string };
  SendConfirmationCodeScreen : undefined;
  ProjectsScreen: undefined;
  DevisScreen : undefined;
  DocumentsScreen : undefined;
  ClientsScreen : undefined;
  AjouterCollaborateurScreen : undefined;
  SupportScreen : undefined;
  EntrepriseInfoScreen : undefined;
  CollaboratorsScreen : undefined;
  MentionsLegales : undefined;
  PolitiqueConfidentialite : undefined;
  StatementsScreen : undefined;
  MonthlyActivityScreen : undefined;
  AirtelRechargeScreen : undefined;
  LinkedAccountSectionScreen: {
  companyId: string;
  accountType: 'airtel money' | 'moov money' | 'compte bancaire';
  };
  CompanyAccountScreen: { companyId: string };
  CompteBancaireEntrepriseScreen: { companyId: string };
  CompteBancaireEntrepriseDetailsScreen: { companyId: string };
  AirtelMoneyEntrepriseScreen: { companyId: string };
  AirtelMoneyEntrepriseDetailsScreen: { companyId: string };
  MoovMoneyEntrepriseScreen: { companyId: string };
  MoovMoneyEntrepriseDetailsScreen: { companyId: string };

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
  initialRoute?: keyof RootStackParamList;
};

const AppNavigator = ({ initialRoute }: AppNavigatorProps) => {
  return (
    <Stack.Navigator initialRouteName={initialRoute ?? 'Login'}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SharedVaultsScreen" component={SharedVaultsScreen}options={{ title: 'Coffres partagés' }}/>
      <Stack.Screen name="CreateSharedVaultScreen" component={CreateSharedVaultScreen} options={{ title: 'Créer coffre partagé' }}/>
      <Stack.Screen name="SharedVaultDetailScreen" component={SharedVaultDetailScreen} options={{ title: 'Détail du coffre partagé' }}/>
      <Stack.Screen name="AddSharedVaultMemberScreen" component={AddSharedVaultMemberScreen} options={{ title: 'Ajouter un membre' }}/>     
      <Stack.Screen name="AirtelRechargeScreen" component={AirtelRechargeScreen} />
      <Stack.Screen name="MonthlyActivityScreen" component={MonthlyActivityScreen} />
      <Stack.Screen name="StatementsScreen" component={StatementsScreen} />
      <Stack.Screen name="AirtelWithdrawScreen" component={AirtelWithdrawScreen} />
      <Stack.Screen name="Register" component={RegisterScreen}  />
      <Stack.Screen name="RegisterCompteProScreen" component={RegisterCompteProScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Acceuil' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Accounts" component={AccountsScreen} options={{ title: 'Comptes' }} />
      <Stack.Screen name="AirtelMoney" component={AirtelMoneyScreen} />
      <Stack.Screen name="AirtelMoneyAllTransactions" component={AirtelMoneyAllTransactionsScreen} />
      <Stack.Screen name="Libertis" component={LibertisScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="LibertisTransactions" component={LibertisTransactionsScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="VaultsScreen" component={VaultsScreen} />
      <Stack.Screen name="AirtelSupportScreen" component={AirtelSupportScreen} />
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
      <Stack.Screen name="RequestsInboxScreen" component={RequestsInboxScreen} />
      <Stack.Screen name="RequestsHubScreen" component={RequestsHubScreen} />
      <Stack.Screen name="PaymentRequestDetail" component={PaymentRequestDetail} />
      <Stack.Screen name="BudgetMensuelScreen" component={BudgetMensuelScreen} />
      <Stack.Screen name="SupportScreen" component={SupportScreen} />
      <Stack.Screen name="GestionEntrepriseScreen" component={GestionEntrepriseScreen} />
      <Stack.Screen name="EntrepriseRevenusScreen" component={EntrepriseRevenusScreen} />
      <Stack.Screen name="DepenseProfessionnellesScreen" component={DepenseProfessionnellesScreen} />
      <Stack.Screen name="FacturesScreen" component={FacturesScreen} />
      <Stack.Screen name="EntrepriseRapportsScreen" component={EntrepriseRapportsScreen} />
      <Stack.Screen name="UserTypeSelectionScreen" component={UserTypeSelectionScreen} />
      <Stack.Screen name="EntrepriseCodeScreen" component={EntrepriseCodeScreen} />
      <Stack.Screen name="SendConfirmationCodeScreen" component={SendConfirmationCodeScreen} />
      <Stack.Screen name="CreerEntrepriseScreen" component={CreerEntrepriseScreen} />
      <Stack.Screen name="ProjectsScreen" component={ProjectsScreen} />
      <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <Stack.Screen name="DevisScreen" component={DevisScreen} />
      <Stack.Screen name="ClientsScreen" component={ClientsScreen} />
      <Stack.Screen name="AjouterCollaborateurScreen" component={AjouterCollaborateurScreen} />
      <Stack.Screen name="EntrepriseInfoScreen" component={EntrepriseInfoScreen} />
      <Stack.Screen name="CollaboratorsScreen" component={CollaboratorsScreen} />
      <Stack.Screen name="CompanyAccountScreen" component={CompanyAccountScreen} />
      <Stack.Screen name="LinkedAccountSectionScreen" component={LinkedAccountSectionScreen} options={{ title: 'Compte lié' }}/>
      <Stack.Screen name="CompteBancaireEntrepriseScreen" component={CompteBancaireEntrepriseScreen} />
      <Stack.Screen name="AirtelMoneyEntrepriseScreen" component={AirtelMoneyEntrepriseScreen} />
      <Stack.Screen name="AirtelMoneyEntrepriseDetailsScreen" component={AirtelMoneyEntrepriseDetailsScreen} />
      <Stack.Screen name="MoovMoneyEntrepriseScreen" component={MoovMoneyEntrepriseScreen} />      
      <Stack.Screen name="MentionsLegales" component={MentionsLegalesScreen} options={{ title: 'Mentions légales' }} />
      <Stack.Screen name="PolitiqueConfidentialite" component={PolitiqueConfidentialiteScreen} options={{ title: 'Politique de confidentialité' }}/>
      <Stack.Screen name="MoovMoneyEntrepriseDetailsScreen" component={MoovMoneyEntrepriseDetailsScreen} />
      <Stack.Screen name="CompteBancaireEntrepriseDetailsScreen" component={CompteBancaireEntrepriseDetailsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;