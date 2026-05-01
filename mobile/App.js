import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';

// Auth
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Admin
import OverviewScreen from './src/screens/main/OverviewScreen';
import AdminChatScreen from './src/screens/main/AdminChatScreen';
import ReferralsScreen from './src/screens/main/ReferralsScreen';
import SocialFeedManagerScreen from './src/screens/main/SocialFeedScreen';
import LaunchPadAdminScreen from './src/screens/main/LaunchPadScreen';

// Doctor
import PatientsScreen from './src/screens/doctor/PatientsScreen';
import DoctorChatScreen from './src/screens/doctor/DoctorChatScreen';
import DoctorProfileScreen from './src/screens/doctor/DoctorProfileScreen';

// Patient
import AppointmentsScreen from './src/screens/patient/AppointmentsScreen';
import MedicalHistoryScreen from './src/screens/patient/MedicalHistoryScreen';
import PatientProfileScreen from './src/screens/patient/PatientProfileScreen';

// Shared
import SocialFeedScreen from './src/screens/shared/SocialFeedScreen';
import LaunchPadSubmitScreen from './src/screens/shared/LaunchPadSubmitScreen';
import ChatbotScreen from './src/screens/shared/ChatbotScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
  tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
  headerShown: false,
};

function MainDoctorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabOptions,
      tabBarIcon: ({ focused }) => {
        const icons = { Home: '🏠', Chat: '💬', Referrals: '🔄', Feed: '📢', 'AI Bot': '🤖' };
        return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{icons[route.name] || '•'}</Text>;
      },
    })}>
      <Tab.Screen name="Home" component={OverviewScreen} />
      <Tab.Screen name="Chat" component={AdminChatScreen} />
      <Tab.Screen name="Referrals" component={ReferralsScreen} />
      <Tab.Screen name="Feed" component={SocialFeedManagerScreen} />
      <Tab.Screen name="AI Bot" component={ChatbotScreen} />
    </Tab.Navigator>
  );
}

function DoctorTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabOptions,
      tabBarIcon: ({ focused }) => {
        const icons = { Patients: '👥', Chat: '💬', 'AI Bot': '🤖', Profile: '👤' };
        return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{icons[route.name] || '•'}</Text>;
      },
    })}>
      <Tab.Screen name="Patients" component={PatientsScreen} />
      <Tab.Screen name="Chat" component={DoctorChatScreen} />
      <Tab.Screen name="AI Bot" component={ChatbotScreen} />
      <Tab.Screen name="Profile" component={DoctorProfileScreen} />
    </Tab.Navigator>
  );
}

function PatientTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      ...tabOptions,
      tabBarIcon: ({ focused }) => {
        const icons = { Appointments: '📅', History: '📋', 'AI Bot': '🤖', Profile: '👤' };
        return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{icons[route.name] || '•'}</Text>;
      },
    })}>
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="History" component={MedicalHistoryScreen} />
      <Tab.Screen name="AI Bot" component={ChatbotScreen} />
      <Tab.Screen name="Profile" component={PatientProfileScreen} />
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
