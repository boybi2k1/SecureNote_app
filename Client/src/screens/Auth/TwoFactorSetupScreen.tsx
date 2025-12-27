import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import QRCode from 'react-native-qrcode-svg';
import { authService } from '../../services/authService';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type TwoFactorSetupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'TwoFactorSetup'>;
type TwoFactorSetupScreenRouteProp = RouteProp<AuthStackParamList, 'TwoFactorSetup'>;

export const TwoFactorSetupScreen: React.FC = () => {
  const navigation = useNavigation<TwoFactorSetupScreenNavigationProp>();
  const route = useRoute<TwoFactorSetupScreenRouteProp>();
  
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Get username and password from route params (for new users) or use authenticated endpoint
  const isNewUser = route.params?.username && route.params?.password;
  const username = route.params?.username || '';
  const password = route.params?.password || '';

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    try {
      setLoading(true);
      let setup;
      if (isNewUser) {
        // Use endpoint for new users (no auth required)
        setup = await authService.setup2FANew(username, password);
      } else {
        // Use authenticated endpoint
        setup = await authService.setup2FA();
      }
      setSecret(setup.secret);
      setQrCodeUrl(setup.qr_code_url);
      setBackupCodes(setup.backup_codes);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể thiết lập 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã 6 số từ ứng dụng xác thực');
      return;
    }

    try {
      setLoading(true);
      if (isNewUser) {
        await authService.enable2FANew(username, password, verificationCode);
      } else {
        await authService.enable2FA(verificationCode);
      }
      setStep('complete');
      setShowBackupCodes(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.detail || 'Mã xác thực không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigation.replace('Login');
  };

  if (loading && step === 'setup') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang thiết lập 2FA...</Text>
      </View>
    );
  }

  if (step === 'complete') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Thiết lập 2FA thành công!</Text>
            <Text style={styles.subtitle}>
              Vui lòng lưu các mã dự phòng này ở nơi an toàn. Bạn sẽ cần chúng nếu mất quyền truy cập vào ứng dụng xác thực.
            </Text>
          </View>

          <View style={styles.backupCodesContainer}>
            <Text style={styles.backupCodesTitle}>Mã dự phòng:</Text>
            {backupCodes.map((code, index) => (
              <View key={index} style={styles.backupCodeItem}>
                <Text style={styles.backupCodeText}>{code}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleComplete}
          >
            <Text style={styles.primaryButtonText}>Hoàn tất</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Thiết lập Xác thực 2 yếu tố</Text>
          <Text style={styles.subtitle}>
            Quét mã QR bằng ứng dụng xác thực như Google Authenticator hoặc Authy
          </Text>
        </View>

        {qrCodeUrl && (
          <View style={styles.qrContainer}>
            <QRCode
              value={qrCodeUrl}
              size={200}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
        )}

        <View style={styles.secretContainer}>
          <Text style={styles.secretLabel}>Hoặc nhập mã thủ công:</Text>
          <Text style={styles.secretText} selectable>{secret}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nhập mã xác thực 6 số</Text>
          <TextInput
            style={styles.input}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Xác thực và Kích hoạt</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 30,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  secretContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  secretLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  secretText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#000000',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backupCodesContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  backupCodesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  backupCodeItem: {
    padding: 8,
    marginBottom: 5,
  },
  backupCodeText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#856404',
    fontWeight: '500',
  },
});

