import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';

// Auth screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Main Doctor screens
import OverviewScreen from './src/screens/main/OverviewScreen';
import ReferralsScreen from './src/screens/main/ReferralsScreen';
import ChatTokensScreen from './src/screens/main/ChatTokensScreen';
import SocialFeedManagerScreen from './src/screens/main/SocialFeedScreen';
import LaunchPadAdminScreen from './src/screens/main/LaunchPadScreen';

// Doctor screens
import PatientsScreen from './src/screens/doctor/PatientsScreen';
import DoctorReferralsScreen from './src/screens/doctor/ReferralsScreen';

// Patient screens
import ProfileScreen from './src/screens/patient/ProfileScreen';
import ChatScreen from './src/screens/patient/ChatScreen';

// Shared screens
import SocialFeedScreen from './src/screens/shared/SocialFeedScreen';
import LaunchPadSubmitScreen from './src/screens/shared/LaunchPadSubmitScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name, focused) => {
  const icons = {
    Overview: focused ? '📊' : '📊',
    Referrals: focused ? '🔄' : '🔄',
    'Chat Tokens': focused ? '💬' : '💬',
    'Social Feed': focused ? '📢' : '📢',
    LaunchPad: focused ? '🚀' : '🚀',
    Patients: focused ? '👥' : '👥',
    Reports: focused ? '📄' : '📄',
    Profile: focused ? '👤' : '👤',
    Chat: focused ? '💬' : '💬',
  };
  return <Text style={{ fontSize: 20 }}>{icons[name] || '•'}</Text>;
};

function MainDoctorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.gray400,
      tabBarStyle: { paddingBottom: 4, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    })}>
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Referrals" component={ReferralsScreen} />
      <Tab.Screen name="Chat Tokens" component={ChatTokensScreen} />
      <Tab.Screen name="Social Feed" component={SocialFeedManagerScreen} />
      <Tab.Screen name="LaunchPad" component={LaunchPadAdminScreen} />
    </Tab.Navigator>
  );
}

function DoctorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.gray400,
      tabBarStyle: { paddingBottom: 4, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    })}>
      <Tab.Screen name="Patients" component={PatientsScreen} />
      <Tab.Screen name="Referrals" component={DoctorReferralsScreen} />
      <Tab.Screen name="LaunchPad" component={LaunchPadSubmitScreen} />
      <Tab.Screen name="Social Feed" component={SocialFeedScreen} />
    </Tab.Navigator>
  );
}

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.gray400,
      tabBarStyle: { paddingBottom: 4, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    })}>
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="LaunchPad" component={LaunchPadSubmitScreen} />
      <Tab.Screen name="Social Feed" component={SocialFeedScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
        </>
      ) : user.role === 'MAIN_DOCTOR' ? (
        <Stack.Screen name="MainDoctor" component={MainDoctorTabs} />
      ) : user.role === 'DOCTOR' ? (
        <Stack.Screen name="Doctor" component={DoctorTabs} />
      ) : (
        <Stack.Screen name="Patient" component={PatientTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
