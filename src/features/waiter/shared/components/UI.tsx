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
import { colors } from '../utils/theme';
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
      contentContainerClassName="p-[20px] pb-[28px] gap-[18px] w-[100%] max-w-[820px] self-center"
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
    <View className="flex-row items-center justify-between gap-[10px]">
      <View className="gap-[5px]" style={{ flex: 1 }}>
        <Text
          accessibilityRole="header"
          className="text-[25px] font-[700] text-[#183B32] tracking-[-0.6px]"
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-[12px] leading-[19px] text-[#7C8983]">
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
export function Card({ children }: PropsWithChildren) {
  return (
    <View className="rounded-[18px] bg-[#fff] p-[17px] border-[1px] border-[#E5EBE7] gap-[12px]">
      {children}
    </View>
  );
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
      className={`min-h-[47px] rounded-[12px] px-[15px] py-[12px] flex-row items-center justify-center gap-[8px] ${disabled ? 'opacity-[0.4]' : 'opacity-[1] active:opacity-[0.75]'}`}
      style={{
        backgroundColor: secondary
          ? colors.mint
          : danger
            ? colors.red
            : colors.green,
      }}
    >
      {icon && <Icon name={icon} color={color} size={18} />}
      <Text className="font-[600] text-[13px] text-center" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text className="text-[12px] font-[600] text-[#496357] mb-[7px]">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#A0ACA4"
        {...props}
        className="border-[1px] border-[#E5EBE7] bg-[#FAFCFA] px-[14px] py-[12px] rounded-[12px] text-[14px] text-[#183B32] min-h-[46px]"
        style={[
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
    <View className="flex-row items-center gap-[10px] border-[1px] border-[#E5EBE7] bg-[#fff] px-[14px] py-[0px] rounded-[12px] text-[14px] text-[#183B32] min-h-[46px]">
      <Icon name="search-outline" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor="#94A199"
        value={value}
        onChangeText={onChange}
        className="min-h-[46px] text-[13px] text-[#183B32]"
        style={{ flex: 1 }}
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
      contentContainerClassName="gap-[8px]"
      style={{ flexGrow: 0 }}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          className="px-[16px] py-[11px] rounded-[10px] border-[1px]"
          style={{
            backgroundColor: value === option ? colors.green : '#fff',
            borderColor: value === option ? colors.green : colors.line,
          }}
        >
          <Text
            className="text-[12px] font-[600]"
            style={{ color: value === option ? '#fff' : colors.muted }}
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
      className="rounded-[12px] p-[13px]"
      style={{ backgroundColor: error ? '#FDF0ED' : colors.mint }}
    >
      <Text
        className="text-[12px] leading-[19px]"
        style={{ color: error ? colors.red : colors.green }}
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
        className="justify-end bg-[#0D2C2566]"
        style={{ flex: 1 }}
      >
        <Pressable
          accessibilityLabel="Đóng bảng thao tác"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <View
          accessibilityViewIsModal
          className="bg-[#fff] rounded-tl-[24px] rounded-tr-[24px] w-[100%] max-w-[640px] max-h-[85%] self-center"
        >
          <View className="flex-row items-center justify-between gap-[10px] px-[22px] pt-[18px] pb-[12px] border-b-[1px] border-[#E5EBE7]">
            <Text
              className="text-[17px] font-[700] text-[#183B32]"
              style={{ flex: 1 }}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              className="p-[10px]"
            >
              <Icon name="close" color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="p-[22px] pb-[36px] gap-[16px]"
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
    <View className="flex-row items-center gap-[10px]">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Giảm số lượng"
        accessibilityState={{ disabled: value <= min }}
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        className="p-[12px] rounded-[10px] bg-[#EAF5EF]"
        style={{ opacity: value <= min ? 0.4 : 1 }}
      >
        <Icon name="remove" size={18} />
      </Pressable>
      <Text className="text-[17px] font-[700] text-[#183B32] min-w-[26px] text-center">
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tăng số lượng"
        accessibilityState={{ disabled: value >= max }}
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        className="p-[12px] rounded-[10px] bg-[#EAF5EF]"
        style={{ opacity: value >= max ? 0.4 : 1 }}
      >
        <Icon name="add" size={18} />
      </Pressable>
    </View>
  );
}
