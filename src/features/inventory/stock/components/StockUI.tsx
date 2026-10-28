import { useState, type PropsWithChildren } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../../auth/hooks/useAuth';
import { stockError } from '../api/stockApi';

export const stockColors = {
  green: '#236347',
  dark: '#153F30',
  ink: '#23382D',
  muted: '#738078',
  bg: '#F5F7F5',
  line: '#E4EBE6',
  mint: '#EAF4ED',
  amber: '#A76A1B',
  red: '#B44741',
};
export const quantity = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value);
export function stockDate(value: string | null, dateOnly = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not provided';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : 'Asia/Ho_Chi_Minh',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(new Date(value));
}

export function InventoryHeader({ onBack }: { onBack?: () => void }) {
  const auth = useAuth();
  const [account, setAccount] = useState(false);
  const initials =
    auth.user?.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'FH';
  return (
    <>
      <View style={s.header}>
        <View style={s.row}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to inventory"
              onPress={onBack}
              style={s.iconButton}
            >
              <Ionicons name="chevron-back" size={22} color={stockColors.ink} />
            </Pressable>
          ) : (
            <View style={s.logo}>
              <Ionicons name="layers-outline" size={22} color="#fff" />
            </View>
          )}
          <View>
            <Text
              style={[s.brand, onBack && { fontSize: 18, letterSpacing: -0.3 }]}
            >
              {onBack ? (
                'Ingredient details'
              ) : (
                <>
                  FoodHub<Text style={{ color: '#8DA76A' }}>.</Text>
                </>
              )}
            </Text>
            <Text style={s.headerCaption}>
              {onBack ? 'Stock, lots & activity' : 'Inventory workspace'}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account"
          onPress={() => setAccount(true)}
          style={s.avatar}
        >
          <Text style={s.avatarText}>{initials}</Text>
        </Pressable>
      </View>
      <Modal
        visible={account}
        transparent
        animationType="fade"
        onRequestClose={() => setAccount(false)}
      >
        <View style={s.overlay}>
          <Pressable
            accessibilityLabel="Close account"
            onPress={() => setAccount(false)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={s.account}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={s.accountTitle}>Your account</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setAccount(false)}
                style={s.iconButton}
              >
                <Ionicons name="close" size={21} color={stockColors.muted} />
              </Pressable>
            </View>
            <Text style={s.name}>{auth.user?.name}</Text>
            <Text style={s.email}>{auth.user?.email}</Text>
            <Text style={s.role}>Inventory staff</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              disabled={auth.loading}
              onPress={() => {
                setAccount(false);
                void auth.logout();
              }}
              style={s.logout}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={stockColors.red}
              />
              <Text style={{ color: stockColors.red, fontWeight: '600' }}>
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function StockBadge({
  label,
  tone = 'green',
}: {
  label: string;
  tone?: 'green' | 'amber' | 'red' | 'gray';
}) {
  const color = {
    green: stockColors.green,
    amber: stockColors.amber,
    red: stockColors.red,
    gray: stockColors.muted,
  }[tone];
  const backgroundColor = {
    green: stockColors.mint,
    amber: '#FFF3DF',
    red: '#FFF0EC',
    gray: '#EFF2EF',
  }[tone];
  return (
    <View style={[s.badge, { backgroundColor }]}>
      <View
        style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }}
      />
      <Text style={{ fontSize: 11, color, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
export function StockError({
  error,
  stale,
  onRetry,
  busy,
}: {
  error: unknown;
  stale?: boolean;
  onRetry: () => void;
  busy?: boolean;
}) {
  return (
    <View accessibilityRole="alert" style={s.error}>
      <Ionicons
        name="alert-circle-outline"
        size={19}
        color={stockColors.amber}
      />
      <View style={{ flex: 1 }}>
        <Text style={s.errorText}>{stockError(error)}</Text>
        {stale && (
          <Text style={[s.errorText, { marginTop: 4 }]}>
            Showing the last loaded data.
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onRetry}
          style={{
            minHeight: 40,
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <Text
            style={{ color: stockColors.dark, fontWeight: '600', fontSize: 13 }}
          >
            Try again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
export function StockEmpty({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name="cube-outline" size={28} color={stockColors.green} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyDescription}>{children}</Text>
    </View>
  );
}
export function StockLoading() {
  return (
    <View style={{ paddingVertical: 48 }}>
      <ActivityIndicator
        color={stockColors.green}
        accessibilityLabel="Loading inventory"
      />
    </View>
  );
}
export function LoadMore({
  busy,
  onPress,
}: {
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={s.loadMore}
    >
      {busy ? (
        <ActivityIndicator color={stockColors.green} />
      ) : (
        <Text
          style={{ color: stockColors.green, fontWeight: '600', fontSize: 14 }}
        >
          Load more
        </Text>
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  header: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: stockColors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: stockColors.dark,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerCaption: {
    color: stockColors.muted,
    fontSize: 11,
    fontWeight: '400',
    marginTop: 3,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#D6E5DB',
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: stockColors.dark, fontSize: 13, fontWeight: '700' },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 34, 24, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  account: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  accountTitle: { color: stockColors.ink, fontSize: 19, fontWeight: '700' },
  name: {
    marginTop: 20,
    color: stockColors.ink,
    fontSize: 21,
    fontWeight: '600',
  },
  email: { color: stockColors.muted, marginTop: 6, fontSize: 14 },
  role: { color: stockColors.green, fontSize: 12, marginTop: 12 },
  logout: {
    marginTop: 24,
    borderTopWidth: 1,
    borderColor: stockColors.line,
    paddingTop: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    minHeight: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
  error: {
    backgroundColor: '#FFF6E7',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },
  errorText: { color: '#86591E', fontSize: 13, lineHeight: 20 },
  empty: {
    paddingHorizontal: 24,
    paddingVertical: 44,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: stockColors.line,
    borderRadius: 20,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: stockColors.mint,
  },
  emptyTitle: {
    color: stockColors.ink,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyDescription: {
    color: stockColors.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  loadMore: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CCDCD1',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
