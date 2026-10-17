import Ionicons from '@expo/vector-icons/Ionicons';

import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, ui } from '../theme';
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
