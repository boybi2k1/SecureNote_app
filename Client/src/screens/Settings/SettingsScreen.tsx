import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { AppStackParamList } from '../Notes/NotesListScreen';
import { UserSettings } from '../../types/user.types';

type SettingsScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userService.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      // Nếu lỗi, sử dụng default settings
      setSettings({
        auto_lock_enabled: false,
        session_timeout_minutes: 30,
        theme: 'light',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings = await userService.updateSettings({
        ...settings,
        ...updates,
      });
      setSettings(updatedSettings);
    } catch (err: any) {
      console.error('Error updating settings:', err);
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID:</Text>
            <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('vi-VN')
                : 'N/A'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionButtonText}>Chỉnh sửa profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.changePasswordButton]}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={styles.actionButtonText}>Đổi mật khẩu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.securityButton]}
            onPress={() => navigation.navigate('SecuritySettings')}
          >
            <Text style={styles.actionButtonText}>Bảo mật</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        {settings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Tự động khóa</Text>
                <Text style={styles.settingDescription}>
                  Tự động khóa ứng dụng sau một khoảng thời gian không hoạt động
                </Text>
              </View>
              <Switch
                value={settings.auto_lock_enabled}
                onValueChange={(value) => handleUpdateSettings({ auto_lock_enabled: value })}
                disabled={saving}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Thời gian chờ phiên (phút)</Text>
                <Text style={styles.settingDescription}>
                  Thời gian không hoạt động trước khi tự động khóa
                </Text>
              </View>
              <View style={styles.timeoutContainer}>
                <TouchableOpacity
                  style={styles.timeoutButton}
                  onPress={() =>
                    handleUpdateSettings({
                      session_timeout_minutes: Math.max(5, settings.session_timeout_minutes - 5),
                    })
                  }
                  disabled={saving}
                >
                  <Text style={styles.timeoutButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.timeoutValue}>{settings.session_timeout_minutes}</Text>
                <TouchableOpacity
                  style={styles.timeoutButton}
                  onPress={() =>
                    handleUpdateSettings({
                      session_timeout_minutes: settings.session_timeout_minutes + 5,
                    })
                  }
                  disabled={saving}
                >
                  <Text style={styles.timeoutButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Giao diện</Text>
                <Text style={styles.settingDescription}>Chọn theme cho ứng dụng</Text>
              </View>
              <View style={styles.themeContainer}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    settings.theme === 'light' && styles.themeButtonActive,
                  ]}
                  onPress={() => handleUpdateSettings({ theme: 'light' })}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      settings.theme === 'light' && styles.themeButtonTextActive,
                    ]}
                  >
                    Sáng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    settings.theme === 'dark' && styles.themeButtonActive,
                  ]}
                  onPress={() => handleUpdateSettings({ theme: 'dark' })}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      settings.theme === 'dark' && styles.themeButtonTextActive,
                    ]}
                  >
                    Tối
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  changePasswordButton: {
    backgroundColor: '#5856D6',
    marginTop: 8,
  },
  securityButton: {
    backgroundColor: '#34C759',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  timeoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timeoutValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  themeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  themeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


