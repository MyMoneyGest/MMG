// screens/OperationsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OperationsScreen'>;

type Props = {
  onSendMoney?: () => void;         // facultatif: si non fourni on navigue via routes existantes
  onRequestToPay?: () => void;
  onMobileRecharge?: () => void;
  onMerchantPayment?: () => void;
};

const OperationsScreen: React.FC<Props> = ({
  onSendMoney,
  onRequestToPay,
  onMobileRecharge,
  onMerchantPayment,
}) => {
  const navigation = useNavigation<Nav>();

  // Fallback vers routes actuelles si callbacks non passés
  const goSend    = onSendMoney       || (() => navigation.navigate('AirtelSendMoneyScreen'));
  const goRequest = onRequestToPay    || (() => navigation.navigate('RequestsHubScreen'));
  const goRecharge= onMobileRecharge  || (() => navigation.navigate('AirtelRechargeScreen'));
  const goMerchant= onMerchantPayment || (() => navigation.navigate('MerchantPaymentScreen' as never));

  const quickActions = [
    { icon: 'paper-plane-outline' as const, label: 'Dernier envoi',      sub: 'Marie K. • 15 000 XOF', onPress: goSend },
    { icon: 'phone-portrait-outline' as const, label: 'Recharge rapide', sub: '1 000 XOF crédit',      onPress: goRecharge },
    { icon: 'qr-code-outline' as const, label: 'Dernier marchand',       sub: 'Supermarché ABC',       onPress: goMerchant },
  ];

  const operations = [
    { iconBg: '#3B82F6', icon: 'paper-plane-outline' as const, title: "Envoyer de l'argent",  sub: 'Transfert vers un contact ou un numéro', onPress: goSend },
    { iconBg: '#22C55E', icon: 'cash-outline' as const,       title: 'Demande de paiement',  sub: "Recevoir de l'argent d'un contact",     onPress: goRequest },
    { iconBg: '#8B5CF6', icon: 'phone-portrait-outline' as const, title: 'Recharge mobile', sub: "Crédit d'appel et forfaits internet",     onPress: goRecharge },
    { iconBg: '#F97316', icon: 'qr-code-outline' as const,    title: 'Paiement marchand',    sub: 'Scanner QR code ou saisir code marchand', onPress: goMerchant },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#0b1220']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headTitle}>Opérations</Text>
            <Text style={styles.headSub}>Transferts et paiements</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Actions rapides */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions rapides</Text>
          <View style={{ marginTop: 8 }}>
            {quickActions.map((a, i) => (
              <TouchableOpacity key={i} style={styles.quickRow} onPress={a.onPress}>
                <View style={styles.quickLeft}>
                  <View style={styles.quickIconWrap}>
                    <Ionicons name={a.icon} size={18} color="#0f172a" />
                  </View>
                  <View>
                    <Text style={styles.quickLabel}>{a.label}</Text>
                    <Text style={styles.quickSub}>{a.sub}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={a.onPress} style={styles.repeatBtn}>
                  <Text style={styles.repeatTxt}>Répéter</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Toutes les opérations */}
        <Text style={styles.sectionTitle}>Toutes les opérations</Text>
        {operations.map((op, i) => (
          <TouchableOpacity key={i} style={styles.opCard} onPress={op.onPress}>
            <View style={[styles.opIcon, { backgroundColor: op.iconBg }]}>
              <Ionicons name={op.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.opTitle}>{op.title}</Text>
              <Text style={styles.opSub}>{op.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Tip */}
        <View style={[styles.card, { marginTop: 12, backgroundColor: '#F3F4F680' }]}>
          <View style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <Ionicons name="people-outline" size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Conseil MyMoneyGest</Text>
              <Text style={styles.tipText}>
                Ajoutez vos contacts fréquents dans « Bénéficiaires » pour des transferts plus rapides.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OperationsScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 8, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  content: { padding: 16, paddingBottom: 32 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  quickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 12, backgroundColor: '#F3F4F6', marginTop: 8 },
  quickLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontWeight: '600', color: '#0f172a', fontSize: 13 },
  quickSub: { color: '#6B7280', fontSize: 12 },
  repeatBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#E5E7EB' },
  repeatTxt: { color: '#0f172a', fontWeight: '700', fontSize: 12 },

  sectionTitle: { marginTop: 18, marginBottom: 8, fontWeight: '700', color: '#0f172a' },

  opCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  opIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  opTitle: { fontWeight: '700', color: '#0f172a' },
  opSub: { color: '#6B7280', fontSize: 12 },

  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontWeight: '700', color: '#0f172a', fontSize: 13 },
  tipText: { color: '#475569', fontSize: 12, marginTop: 2 },
});