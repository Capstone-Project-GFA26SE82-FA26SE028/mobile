import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearFeedback } from '../store/waiterSlice';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, ui } from '../utils/theme';
export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({
  name,
  size = 21,
  color = colors.green,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Page({ children }: PropsWithChildren) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={ui.page}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
export function Title({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={ui.between}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text accessibilityRole="header" style={ui.title}>
          {title}
        </Text>
        {subtitle && <Text style={ui.muted}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={ui.card}>{children}</View>;
}
export function Badge({
  text,
  tone = 'green',
}: {
  text: string;
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}) {
  return <StatusBadge label={text} tone={tone} dot={false} />;
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  icon?: IconName;
}) {
  const color = secondary ? colors.green : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 47,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: secondary
          ? colors.mint
          : danger
            ? colors.red
            : colors.green,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      {icon && <Icon name={icon} color={color} size={18} />}
      <Text
        style={{ color, fontWeight: '600', fontSize: 13, textAlign: 'center' }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#A0ACA4"
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 82, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
export function Search({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View
      style={[
        ui.row,
        ui.input,
        { paddingVertical: 0, backgroundColor: '#fff' },
      ]}
    >
      <Icon name="search-outline" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor="#94A199"
        value={value}
        onChangeText={onChange}
        style={{ flex: 1, minHeight: 46, fontSize: 13, color: colors.text }}
      />
    </View>
  );
}
export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      style={{ flexGrow: 0 }}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: value === option ? colors.green : '#fff',
            borderWidth: 1,
            borderColor: value === option ? colors.green : colors.line,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: value === option ? '#fff' : colors.muted,
            }}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function Empty({ text }: { text: string }) {
  return <EmptyState title={text} icon="leaf-outline" />;
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: error ? '#FDF0ED' : colors.mint,
        borderRadius: 12,
        padding: 13,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          lineHeight: 19,
          color: error ? colors.red : colors.green,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const feedback = useAppSelector((s) => s.waiter.feedback);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(clearFeedback());
  }, [dispatch]);
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: '#0D2C2566',
        }}
      >
        <Pressable
          accessibilityLabel="Đóng bảng thao tác"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            width: '100%',
            maxWidth: 640,
            maxHeight: '85%',
            alignSelf: 'center',
          }}
        >
          <View
            style={[
              ui.between,
              {
                paddingHorizontal: 22,
                paddingTop: 18,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderColor: colors.line,
              },
            ]}
          >
            <Text style={[ui.h2, { flex: 1 }]}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              style={{ padding: 10 }}
            >
              <Icon name="close" color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 22, paddingBottom: 36, gap: 16 }}
          >
            {children}
            {feedback?.error && <Notice text={feedback.text} error />}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={ui.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Giảm số lượng"
        accessibilityState={{ disabled: value <= min }}
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        style={{
          padding: 12,
          borderRadius: 10,
          backgroundColor: colors.mint,
          opacity: value <= min ? 0.4 : 1,
        }}
      >
        <Icon name="remove" size={18} />
      </Pressable>
      <Text style={[ui.h2, { minWidth: 26, textAlign: 'center' }]}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tăng số lượng"
        accessibilityState={{ disabled: value >= max }}
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        style={{
          padding: 12,
          borderRadius: 10,
          backgroundColor: colors.mint,
          opacity: value >= max ? 0.4 : 1,
        }}
      >
        <Icon name="add" size={18} />
      </Pressable>
    </View>
  );
}
