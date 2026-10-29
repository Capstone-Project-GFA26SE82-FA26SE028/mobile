import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';

export function InventoryHeader({
  title,
  subtitle,
  onBack,
  maxWidth,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  maxWidth: number;
}) {
  const auth = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
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
      <View style={[s.header, { maxWidth }]}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack}
            style={s.back}
          >
            <Ionicons name="chevron-back" size={22} color="#23382D" />
          </Pressable>
        ) : (
          <View style={s.logo}>
            <Ionicons name="layers-outline" size={23} color="#fff" />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.title, !!title && { fontSize: 20 }]}>
            {title || (
              <>
                FoodHub<Text style={{ color: '#8DA76A' }}>.</Text>
              </>
            )}
          </Text>
          <Text style={s.caption}>{subtitle || 'Không gian quản lý kho'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở tài khoản"
          onPress={() => setAccountOpen(true)}
          style={s.avatar}
        >
          <Text style={s.initials}>{initials}</Text>
        </Pressable>
      </View>
      <Modal
        visible={accountOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountOpen(false)}
      >
        <View style={s.overlay}>
          <Pressable
            accessibilityLabel="Đóng tài khoản"
            onPress={() => setAccountOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={s.account}>
            <View style={s.accountHeading}>
              <Text style={s.accountTitle}>Tài khoản của bạn</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={() => setAccountOpen(false)}
                style={s.close}
              >
                <Ionicons name="close" size={22} color="#738078" />
              </Pressable>
            </View>
            <Text style={s.name}>{auth.user?.name}</Text>
            <Text style={s.email}>{auth.user?.email}</Text>
            <Text style={s.role}>Nhân viên kho</Text>
            <Pressable
              accessibilityRole="button"
              disabled={auth.loading}
              onPress={() => {
                setAccountOpen(false);
                void auth.logout();
              }}
              style={s.logout}
            >
              <Ionicons name="log-out-outline" size={21} color="#B44741" />
              <Text style={{ color: '#B44741', fontWeight: '600' }}>
                Đăng xuất
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  header: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#236347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4EBE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#153F30',
  },
  caption: { fontSize: 11, lineHeight: 16, color: '#738078', marginTop: 3 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D6E5DB',
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#153F30', fontSize: 13, fontWeight: '700' },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(12,34,24,0.4)',
  },
  account: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 24,
  },
  accountHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  accountTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: '#23382D' },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: 18, fontSize: 21, fontWeight: '600', color: '#23382D' },
  email: { marginTop: 6, fontSize: 14, color: '#738078' },
  role: { marginTop: 12, fontSize: 12, color: '#236347' },
  logout: {
    marginTop: 24,
    paddingTop: 16,
    minHeight: 48,
    borderTopWidth: 1,
    borderColor: '#E4EBE6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
