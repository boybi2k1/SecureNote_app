import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotesProvider } from './src/context/NotesContext';
import { TodosProvider } from './src/context/TodosContext';
import { CategoriesProvider } from './src/context/CategoriesContext';
import { TagsProvider } from './src/context/TagsContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppStackParamList } from './src/screens/Notes/NotesListScreen';
import { notificationService } from './src/services/notificationService';
import { reminderCheckerService } from './src/services/reminderChecker';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<AppStackParamList>>(null);

  // Request notification permissions on app start
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await notificationService.requestPermissions();
      } catch (error) {
        // Silently fail - notifications may not be available in Expo Go
        console.warn('Could not request notification permissions:', error);
      }
    };
    requestPermissions();
  }, []);

  // Set navigation ref for reminder checker
  useEffect(() => {
    if (navigationRef.current) {
      reminderCheckerService.setNavigationRef(navigationRef.current);
    }
  }, [isAuthenticated]);

  // Start checking reminders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Clear old checked reminders
      reminderCheckerService.clearCheckedReminders();
      // Start checking every 30 seconds (more frequent for Expo Go)
      // This ensures we catch reminders even if user just opened the app
      reminderCheckerService.startChecking(30);

      // Cleanup on unmount
      return () => {
        reminderCheckerService.stopChecking();
      };
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (
        <NotesProvider>
          <TodosProvider>
            <CategoriesProvider>
              <TagsProvider>
                <AppNavigator />
              </TagsProvider>
            </CategoriesProvider>
          </TodosProvider>
        </NotesProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

