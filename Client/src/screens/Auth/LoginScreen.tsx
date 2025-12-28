import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { biometricService, BiometricCredential } from '../../services/biometricService';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loginWithBiometric } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricCredential, setBiometricCredential] = useState<BiometricCredential | null>(null);

  // Check biometric availability and credential on mount
  React.useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);
    
    if (available) {
      const enabled = await biometricService.isBiometricEnabled();
      setBiometricEnabled(enabled);
      
      if (enabled) {
        const credential = await biometricService.getBiometricCredential();
        setBiometricCredential(credential);
      }
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable || !biometricCredential) {
      Alert.alert('Lỗi', 'Đăng nhập vân tay chưa được thiết lập');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginScreen.tsx:handleBiometricLogin',message:'Starting biometric login',data:{username:biometricCredential.username,backupCodeLength:biometricCredential.encryptedToken.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      // Authenticate with biometric
      const authenticated = await biometricService.authenticate(
        'Xác thực để đăng nhập'
      );

      if (!authenticated) {
        setLoading(false);
        return; // User cancelled
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginScreen.tsx:handleBiometricLogin',message:'Biometric authenticated, calling loginWithBiometric',data:{backupCode:biometricCredential.encryptedToken},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion

      // Login with credential
      await loginWithBiometric(
        biometricCredential.username,
        biometricCredential.encryptedToken
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginScreen.tsx:handleBiometricLogin',message:'Login successful - backup code is reusable',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // No need to refresh credential - backup code is reusable
    } catch (err: any) {
      const errorMessage = err.message || 'Đăng nhập vân tay thất bại';
      setError(errorMessage);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1004e74e-00b9-491b-9a87-b0f9cd913a95',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginScreen.tsx:handleBiometricLogin',message:'Login error',data:{error:errorMessage,status:err.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // If backup code is invalid, clear credential
      if (err.response?.status === 401) {
        await biometricService.clearBiometricCredential();
        setBiometricEnabled(false);
        setBiometricCredential(null);
        Alert.alert(
          'Lỗi',
          'Mã xác thực đã hết hạn. Vui lòng đăng nhập bằng mật khẩu và bật lại đăng nhập vân tay.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validation
    if (!username.trim()) {
      setError('Vui lòng nhập username hoặc email');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    // If 2FA is required, verify code
    if (requires2FA) {
      if (!useBackupCode && (!twoFactorCode || twoFactorCode.length !== 6)) {
        setError('Vui lòng nhập mã 2FA 6 số');
        return;
      }
      if (useBackupCode && (!twoFactorCode || twoFactorCode.length !== 8)) {
        setError('Vui lòng nhập mã dự phòng 8 ký tự');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await login(username.trim(), password, twoFactorCode, useBackupCode);
      } catch (err: any) {
        const errorMessage = err.message || 'Mã xác thực không đúng';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Initial login
    try {
      setLoading(true);
      setError(null);
      const response = await login(username.trim(), password);
      
      // Check if 2FA is required
      if (response.requires_2fa) {
        setRequires2FA(true);
        setError(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Đăng nhập thất bại';
      
      // Handle specific error codes
      if (err.response?.status === 401) {
        setError('Sai username hoặc password');
      } else if (err.response?.status === 403) {
        setError('Tài khoản bị vô hiệu hóa');
      } else if (err.response?.status === 429) {
        setError('Vượt quá số lần đăng nhập. Vui lòng thử lại sau.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại!</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username hoặc Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập username hoặc email"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading && !requires2FA}
                onSubmitEditing={handleLogin}
              />
            </View>

            {requires2FA && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    {useBackupCode ? 'Mã dự phòng (8 ký tự)' : 'Mã 2FA (6 số)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={useBackupCode ? "Nhập mã dự phòng" : "000000"}
                    value={twoFactorCode}
                    onChangeText={(text) => {
                      setTwoFactorCode(text);
                      setError(null);
                    }}
                    keyboardType="default"
                    autoCapitalize="characters"
                    maxLength={useBackupCode ? 8 : 6}
                    editable={!loading}
                    autoFocus
                    onSubmitEditing={handleLogin}
                  />
                </View>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                    setError(null);
                  }}
                >
                  <Text style={styles.linkText}>
                    {useBackupCode ? 'Sử dụng mã 2FA' : 'Sử dụng mã dự phòng'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {requires2FA ? 'Xác thực và Đăng nhập' : 'Đăng nhập'}
                </Text>
              )}
            </TouchableOpacity>

            {biometricAvailable && biometricEnabled && biometricCredential && !requires2FA && (
              <View style={styles.biometricContainer}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>HOẶC</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={[styles.biometricButton, loading && styles.buttonDisabled]}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                >
                  <Text style={styles.biometricButtonText}>
                    {Platform.OS === 'ios' ? '🔐 Đăng nhập bằng Face ID' : '🔐 Đăng nhập bằng vân tay'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  linkButton: {
    marginBottom: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  biometricContainer: {
    marginTop: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#999',
  },
  biometricButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

