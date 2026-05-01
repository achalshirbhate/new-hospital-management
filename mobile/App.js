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

// Main Doctor (Admin) screens
import OverviewScreen from './src/screens/main/OverviewScreen';
import AdminChatScreen from './src/screens/main/AdminChatScreen';
import ReferralsScreen from './src/screens/main/ReferralsScreen';
import SocialFeedManagerScreen from './src/screens/main/SocialFeedScreen';
import LaunchPadAdminScreen from './src/screens/main/LaunchPadScreen';

// Doctor screens
import PatientsScreen from './src/screens/doctor/PatientsScreen';
import DoctorChatScreen from './src/screens/doctor/DoctorChatScreen';
import LaunchPadSubmitScreen from './src/screens/shared/LaunchPadSubmitScreen';
import SocialFeedScreen from './src/screens/shared/SocialFeedScreen';

// Patient screens
import PatientHomeScreen from './src/screens/patient/PatientHomeScreen';
import PatientChatScreen from './src/screens/patient/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name, focused) => {
  const icons = {
    Home: '🏠', Chat: '💬', Referrals: '🔄', Feed: '📢', LaunchPad: '🚀',
    Patients: '👥', Admin: '⚙️', Profile: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name] || '•'}</Text>
  );
};

const tabOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.gray400,
  tabBarStyle: {
    paddingBottom: 8,
    paddingTop: 4,
    height: 64,
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  headerShown: false,
};

function MainDoctorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabOptions,
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
    })}>
      <Tab.Screen name="Home" component={OverviewScreen} />
      <Tab.Screen name="Chat" component={AdminChatScreen} />
      <Tab.Screen name="Referrals" component={ReferralsScreen} />
      <Tab.Screen name="Feed" component={SocialFeedManagerScreen} />
      <Tab.Screen name="LaunchPad" component={LaunchPadAdminScreen} />
    </Tab.Navigator>
  );
}

function DoctorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabOptions,
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
    })}>
      <Tab.Screen name="Patients" component={PatientsScreen} />
      <Tab.Screen name="Chat" component={DoctorChatScreen} />
      <Tab.Screen name="LaunchPad" component={LaunchPadSubmitScreen} />
      <Tab.Screen name="Feed" component={SocialFeedScreen} />
    </Tab.Navigator>
  );
}

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabOptions,
      tabBarIcon: ({ focused }) => tabIcon(route.name, focused),
    })}>
      <Tab.Screen name="Home" component={PatientHomeScreen} />
      <Tab.Screen name="Chat" component={PatientChatScreen} />
      <Tab.Screen name="LaunchPad" component={LaunchPadSubmitScreen} />
      <Tab.Screen name="Feed" component={SocialFeedScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
