import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Opt = { value: string; label: string; icon?: string };

const COLORS = {
  headerTop: '#172033',
  headerBottom: '#243247',
  headerText: '#FFFFFF',
  headerSub: '#cbd5e1',
  bg: '#f1f5f9',
  card: '#FFFFFF',
  cardShadow: '#000',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e5e7eb',
  greenBg: '#eafff1',
  green: '#16a34a',
  blueBg: '#eaf2ff',
  blue: '#2563eb',
  divider: '#e7eaf0',
  red: '#dc2626',
};

export default function SettingsScreen({ navigation, route }: any) {
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: false,
      sms: true,
      transactions: true,
      marketing: false,
    },
    security: {
      biometric: true,
      twoFactorAuth: false,
      autoLock: true,
      autoLockTimer: '5', // minutes
    },
    preferences: {
      language: 'fr',
      currency: 'XAF',
      theme: 'light',
    },
  });

  // ---------- options ----------
  const languages: Opt[] = useMemo(
    () => [
      { value: 'fr', label: 'Français' },
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
    ],
    []
  );

  const currencies: Opt[] = useMemo(
    () => [
      { value: 'XAF', label: 'Franc CFA CEMAC' },
      { value: 'XOF', label: 'Franc CFA UEMOA' },
      { value: 'EUR', label: 'Euro' },
      { value: 'USD', label: 'Dollar US' },
      { value: 'GHS', label: 'Cedi Ghanéen' },
    ],
    []
  );

  const lockDelays: Opt[] = useMemo(
    () => [
      { value: '1', label: '1 minute' },
      { value: '5', label: '5 minutes' },
      { value: '15', label: '15 minutes' },
      { value: '30', label: '30 minutes' },
      { value: 'never', label: 'Jamais' },
    ],
    []
  );

  // ---------- picker modal ----------
  const [picker, setPicker] = useState<{
    visible: boolean;
    title: string;
    options: Opt[];
    onSelect: (v: string) => void;
    value: string;
  }>({ visible: false, title: '', options: [], onSelect: () => {}, value: '' });

  const openPicker = (title: string, options: Opt[], value: string, onSelect: (v: string) => void) =>
    setPicker({ visible: true, title, options, onSelect, value });

  const closePicker = () => setPicker((p) => ({ ...p, visible: false }));

  // ---------- handlers ----------
  const setNotif = (key: keyof typeof settings.notifications, val: boolean) =>
    setSettings((s) => ({ ...s, notifications: { ...s.notifications, [key]: val } }));

  const setSec = (key: keyof typeof settings.security, val: boolean | string) =>
    setSettings((s) => ({ ...s, security: { ...s.security, [key]: val } }));

  const setPref = (key: keyof typeof settings.preferences, val: string) =>
    setSettings((s) => ({ ...s, preferences: { ...s.preferences, [key]: val } }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.headerText} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <Text style={styles.headerSubtitle}>Configurez votre application</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 20 }}>
        {/* ----------------- Notifications ----------------- */}
        <Card>
          <CardTitle icon="notifications-outline" title="Notifications" />
          <RowSwitch
            title="Notifications push"
            subtitle="Recevoir des notifications sur votre appareil"
            value={settings.notifications.push}
            onValueChange={(v) => setNotif('push', v)}
          />
          <Divider />
          <RowSwitch
            title="Email"
            subtitle="Recevoir des emails importants"
            value={settings.notifications.email}
            onValueChange={(v) => setNotif('email', v)}
          />
          <RowSwitch
            title="SMS"
            subtitle="Recevoir des SMS pour les transactions"
            value={settings.notifications.sms}
            onValueChange={(v) => setNotif('sms', v)}
          />
          <RowSwitch
            title="Alertes de transaction"
            subtitle="Être notifié de toutes les transactions"
            value={settings.notifications.transactions}
            onValueChange={(v) => setNotif('transactions', v)}
          />
          <RowSwitch
            title="Marketing"
            subtitle="Offres spéciales et promotions"
            value={settings.notifications.marketing}
            onValueChange={(v) => setNotif('marketing', v)}
          />
        </Card>

        {/* ----------------- Sécurité ----------------- */}
        <Card>
          <CardTitle icon="shield-outline" title="Sécurité" />
          <RowSwitch
            leftIcon={<IconBadge bg={COLORS.greenBg} color={COLORS.green} name="finger-print-outline" />}
            title="Authentification biométrique"
            subtitle="Empreinte digitale ou Face ID"
            value={settings.security.biometric}
            onValueChange={(v) => setSec('biometric', v)}
          />
          <Divider />
          <RowSwitch
            leftIcon={<IconBadge bg={COLORS.blueBg} color={COLORS.blue} name="lock-closed-outline" />}
            title="Authentification à deux facteurs"
            subtitle="Sécurité renforcée avec 2FA"
            value={settings.security.twoFactorAuth}
            onValueChange={(v) => setSec('twoFactorAuth', v)}
            rightExtra={
              !settings.security.twoFactorAuth ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Recommandé</Text>
                </View>
              ) : null
            }
          />
          <Divider />
          <RowSwitch
            title="Verrouillage automatique"
            subtitle="Verrouiller l'app après inactivité"
            value={settings.security.autoLock}
            onValueChange={(v) => setSec('autoLock', v)}
          />

          {settings.security.autoLock && (
            <SelectRow
              label="Délai de verrouillage"
              valueLabel={lockDelays.find((o) => o.value === settings.security.autoLockTimer)?.label || ''}
              onPress={() =>
                openPicker('Délai de verrouillage', lockDelays, settings.security.autoLockTimer, (v) =>
                  setSec('autoLockTimer', v)
                )
              }
            />
          )}
        </Card>

        {/* ----------------- Préférences ----------------- */}
        <Card>
          <CardTitle icon="globe-outline" title="Préférences" />
          <SelectRow
            label="Langue"
            valueLabel={languages.find((l) => l.value === settings.preferences.language)?.label || ''}
            onPress={() =>
              openPicker('Langue', languages, settings.preferences.language, (v) => setPref('language', v))
            }
            prefixTag={settings.preferences.language.toUpperCase()}
          />
        <SelectRow
            label="Devise par défaut"
            valueLabel={currencies.find((c) => c.value === settings.preferences.currency)?.label || ''}
            onPress={() =>
              openPicker('Devise par défaut', currencies, settings.preferences.currency, (v) =>
                setPref('currency', v)
              )
            }
            prefixTag={settings.preferences.currency}
          />
          <SelectRow
            label="Thème"
            valueLabel={
              settings.preferences.theme === 'light'
                ? 'Clair'
                : settings.preferences.theme === 'dark'
                ? 'Sombre'
                : 'Automatique'
            }
            onPress={() =>
              openPicker(
                'Thème',
                [
                  { value: 'light', label: 'Clair' },
                  { value: 'dark', label: 'Sombre' },
                  { value: 'auto', label: 'Automatique' },
                ],
                settings.preferences.theme,
                (v) => setPref('theme', v)
              )
            }
          />
        </Card>

        {/* ----------------- Actions rapides ----------------- */}
        <Card>
          <CardTitle icon="phone-portrait-outline" title="Actions rapides" />
          <ActionRow icon="card-outline" label="Gérer les comptes liés" onPress={() => {}} />
          <ActionRow icon="eye-outline" label="Historique de connexion" onPress={() => {}} />
          <ActionRow icon="help-circle-outline" label="Centre d'aide" onPress={() => navigation.navigate('ChatBotScreen')} />
        </Card>

        {/* ----------------- Version + déconnexion ----------------- */}
        <Card>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>MyMoneyGest</Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>Version 2.0.0 • Build 20250109</Text>
          </View>
          <Divider />
          <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'Login' }] })}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Picker modal */}
      <Modal visible={picker.visible} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable style={styles.modalBackdrop} onPress={closePicker}>
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{picker.title}</Text>
            <FlatList
              data={picker.options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const selected = item.value === picker.value;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => {
                      picker.onSelect(item.value);
                      closePicker();
                    }}
                  >
                    <Text style={[styles.optionLabel, selected && { color: COLORS.text, fontWeight: '600' }]}>
                      {item.label}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={18} color={COLORS.text} />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.modalClose} onPress={closePicker}>
              <Text style={{ color: COLORS.text, fontWeight: '600' }}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------- Sub components -------------------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

function CardTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Ionicons name={icon} size={18} color={COLORS.text} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>{title}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 10 }} />;
}

function RowSwitch({
  title,
  subtitle,
  value,
  onValueChange,
  leftIcon,
  rightExtra,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  leftIcon?: React.ReactNode;
  rightExtra?: React.ReactNode;
}) {
  return (
    <View style={styles.rowBetween}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        {leftIcon}
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {rightExtra}
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </View>
  );
}

function SelectRow({
  label,
  valueLabel,
  onPress,
  prefixTag,
}: {
  label: string;
  valueLabel: string;
  onPress: () => void;
  prefixTag?: string;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.rowTitle}>{label}</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={onPress} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!!prefixTag && <Tag>{prefixTag}</Tag>}
          <Text style={{ color: COLORS.text }}>{valueLabel}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={COLORS.muted} />
      </TouchableOpacity>
    </View>
  );
}

function ActionRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={icon} size={18} color={COLORS.muted} />
        <Text style={{ color: COLORS.text }}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

function IconBadge({ bg, color, name }: { bg: string; color: string; name: any }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{children}</Text>
    </View>
  );
}

/* ------------------------------ Styles ------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.headerBottom,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { color: COLORS.headerText, fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: COLORS.headerSub, fontSize: 12 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    shadowColor: COLORS.cardShadow,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  rowSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  badge: {
    borderWidth: 1, borderColor: '#cbd5e1',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  badgeText: { fontSize: 10, color: COLORS.muted },

  selectBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  actionRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  tag: {
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: '#111827', fontWeight: '600' },

  logoutBtn: {
    marginTop: 8,
    backgroundColor: COLORS.red,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: { color: '#fff', fontWeight: '700' },

  /* modal */
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    padding: 16,
    maxHeight: '65%',
  },
  modalTitle: { fontWeight: '700', fontSize: 16, color: COLORS.text, marginBottom: 12 },
  optionRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowSelected: { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
  optionLabel: { color: COLORS.muted, fontSize: 14 },
  modalClose: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
});