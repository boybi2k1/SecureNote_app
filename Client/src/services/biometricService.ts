import * as LocalAuthentication from 'expo-local-authentication';
import { storageService } from './storageService';

const BIOMETRIC_CREDENTIAL_KEY = 'biometric_credential';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export interface BiometricCredential {
  username: string;
  encryptedToken: string; // This will be a backup code or special token
}

export const biometricService = {
  /**
   * Check if biometric authentication is available on device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }
      
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  },

  /**
   * Get supported authentication types
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting supported types:', error);
      return [];
    }
  },

  /**
   * Authenticate using biometric (fingerprint/Face ID)
   */
  async authenticate(reason: string = 'Xác thực danh tính của bạn'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Hủy',
        disableDeviceFallback: false,
      });
      
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  },

  /**
   * Check if biometric login is enabled for current user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await storageService.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  },

  /**
   * Save biometric credential (username + encrypted token)
   */
  async saveBiometricCredential(credential: BiometricCredential): Promise<void> {
    try {
      const credentialJson = JSON.stringify(credential);
      await storageService.setSecureItem(BIOMETRIC_CREDENTIAL_KEY, credentialJson);
      await storageService.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('Error saving biometric credential:', error);
      throw error;
    }
  },

  /**
   * Get biometric credential from secure storage
   */
  async getBiometricCredential(): Promise<BiometricCredential | null> {
    try {
      const credentialJson = await storageService.getSecureItem(BIOMETRIC_CREDENTIAL_KEY);
      if (!credentialJson) {
        return null;
      }
      return JSON.parse(credentialJson) as BiometricCredential;
    } catch (error) {
      console.error('Error getting biometric credential:', error);
      return null;
    }
  },

  /**
   * Clear biometric credential
   */
  async clearBiometricCredential(): Promise<void> {
    try {
      await storageService.removeItem(BIOMETRIC_CREDENTIAL_KEY);
      await storageService.removeItem(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error clearing biometric credential:', error);
    }
  },
};

