import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { TwoFactorSetupScreen } from '../screens/Auth/TwoFactorSetupScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactorSetup: { username: string; password: string } | undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} />
    </Stack.Navigator>
  );
};

