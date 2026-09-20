import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useAuth } from '../state/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import DashboardScreen from '../screens/app/DashboardScreen';
import DocumentsScreen from '../screens/app/DocumentsScreen';
import UploadScreen from '../screens/app/UploadScreen';
import SettingsScreen from '../screens/app/SettingsScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Otp: { email: string; mode: 'login' | 'verifyEmail' };
};

export type AppTabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Upload: undefined;
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="Otp" component={OtpScreen} />
    </AuthStack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: {
          minHeight: 68,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: colors.border,
          backgroundColor: colors.surface
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700'
        },
        tabBarIcon: ({ color, size }) => {
          const icon = route.name === 'Dashboard'
            ? 'grid-outline'
            : route.name === 'Documents'
              ? 'folder-open-outline'
              : route.name === 'Upload'
                ? 'cloud-upload-outline'
                : 'settings-outline';

          return <Ionicons name={icon} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { token, isBooting } = useAuth();

  if (isBooting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return token ? <AppTabs /> : <AuthNavigator />;
}
