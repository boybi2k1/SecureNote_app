import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { biometricService } from '../../services/biometricService';

export const SecuritySettingsScreen: React.FC = () => {
  const { user, enableBiometric, disableBiometric, disable2FA } = useAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disable2FALoading, setDisable2FALoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    if (user) {
      setBiometricEnabled(user.biometric_enabled || false);
    }
  }, [user]);

  const checkBiometricAvailability = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!user?.two_factor_enabled) {
      Alert.alert(
        'Yêu cầu 2FA',
        'Bạn phải bật 2FA trước khi có thể sử dụng đăng nhập vân tay.'
      );
      return;
    }

    if (value) {
      // Enable biometric
      const authenticated = await biometricService.authenticate(
        'Xác thực để bật đăng nhập vân tay'
      );
      
      if (!authenticated) {
        Alert.alert('Lỗi', 'Xác thực vân tay thất bại');
        return;
      }

      try {
        setLoading(true);
        await enableBiometric();
        setBiometricEnabled(true);
        Alert.alert('Thành công', 'Đăng nhập vân tay đã được bật');
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Không thể bật đăng nhập vân tay');
      } finally {
        setLoading(false);
      }
    } else {
      // Disable biometric
      try {
        setLoading(true);
        await disableBiometric();
        setBiometricEnabled(false);
        await biometricService.clearBiometricCredential();
        Alert.alert('Thành công', 'Đăng nhập vân tay đã được tắt');
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Không thể tắt đăng nhập vân tay');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDisable2FA = async () => {
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    Alert.alert(
      'Xác nhận tắt 2FA',
      'Bạn có chắc chắn muốn tắt xác thực 2 yếu tố? Điều này sẽ làm giảm bảo mật tài khoản của bạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tắt 2FA',
          style: 'destructive',
          onPress: async () => {
            try {
              setDisable2FALoading(true);
              await disable2FA(password);
              setPassword('');
              setShowDisable2FA(false);
              Alert.alert('Thành công', '2FA đã được tắt');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Mật khẩu không đúng');
            } finally {
              setDisable2FALoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 2FA Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xác thực 2 yếu tố (2FA)</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Trạng thái 2FA</Text>
              <Text style={styles.settingDescription}>
                {user?.two_factor_enabled
                  ? 'Đã bật - Tài khoản của bạn được bảo vệ bằng 2FA'
                  : 'Chưa bật - Vui lòng bật 2FA để bảo vệ tài khoản'}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text
                style={[
                  styles.statusText,
                  user?.two_factor_enabled ? styles.statusEnabled : styles.statusDisabled,
                ]}
              >
                {user?.two_factor_enabled ? 'Đã bật' : 'Chưa bật'}
              </Text>
            </View>
          </View>

          {user?.two_factor_enabled && (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => setShowDisable2FA(!showDisable2FA)}
            >
              <Text style={styles.dangerButtonText}>Tắt 2FA</Text>
            </TouchableOpacity>
          )}

          {showDisable2FA && (
            <View style={styles.disable2FAContainer}>
              <Text style={styles.disable2FALabel}>Nhập mật khẩu để xác nhận:</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <View style={styles.disable2FAActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDisable2FA(false);
                    setPassword('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, disable2FALoading && styles.buttonDisabled]}
                  onPress={handleDisable2FA}
                  disabled={disable2FALoading}
                >
                  {disable2FALoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Biometric Login */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đăng nhập vân tay</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Đăng nhập bằng vân tay/Face ID</Text>
              <Text style={styles.settingDescription}>
                {biometricAvailable
                  ? 'Sử dụng vân tay hoặc Face ID để đăng nhập nhanh chóng'
                  : 'Thiết bị của bạn không hỗ trợ hoặc chưa thiết lập vân tay/Face ID'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricAvailable || !user?.two_factor_enabled || loading}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusEnabled: {
    color: '#28A745',
  },
  statusDisabled: {
    color: '#DC3545',
  },
  dangerButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#DC3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disable2FAContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  disable2FALabel: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  disable2FAActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#6C757D',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC3545',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

