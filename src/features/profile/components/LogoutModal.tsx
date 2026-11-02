import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

export function LogoutModal({
  visible,
  busy,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  function close() {
    if (!busy) onClose();
  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View className="grow-[1] shrink-0 basis-[0px] justify-center px-[24px] py-[32px] bg-[rgba(12,34,24,0.45)]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng xác nhận đăng xuất"
          disabled={busy}
          onPress={close}
          className="absolute inset-0"
        />
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLabel="Xác nhận đăng xuất"
          className="w-[100%] max-w-[320px] self-center rounded-[20px] bg-white p-[20px]"
        >
          <View className="w-[40px] h-[40px] rounded-[13px] bg-[#FFF0EC] items-center justify-center self-center mb-[12px]">
            <Ionicons name="log-out-outline" size={22} color="#B44741" />
          </View>
          <Text className="text-[18px] font-bold text-[#23382D] text-center">
            Đăng xuất tài khoản?
          </Text>
          <Text className="mt-[6px] text-[12px] leading-[18px] text-[#738078] text-center">
            Bạn sẽ quay về màn hình đăng nhập.
          </Text>
          <View className="flex-row gap-[8px] mt-[18px]">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hủy đăng xuất"
              disabled={busy}
              onPress={close}
              className="grow-[1] shrink-0 basis-[0px] min-h-[44px] rounded-[11px] border border-[#E4EBE6] bg-[#F5F7F5] items-center justify-center active:opacity-[0.75]"
            >
              <Text className="text-[14px] font-semibold text-[#607468]">
                Hủy
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xác nhận đăng xuất"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={onConfirm}
              className={`grow-[1] shrink-0 basis-[0px] min-h-[44px] rounded-[11px] bg-[#236347] items-center justify-center ${busy ? 'opacity-[0.65]' : 'active:opacity-[0.8]'}`}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[14px] font-semibold text-white">
                  Đăng xuất
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
