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

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

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
});

