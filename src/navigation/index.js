import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { PanoramaScreen } from '../screens/PanoramaScreen';
import { ClientsListScreen } from '../screens/clients/ClientsListScreen';
import { ClientDetailScreen } from '../screens/clients/ClientDetailScreen';
import { EyewearScreen } from '../screens/EyewearScreen';
import { LensesScreen } from '../screens/LensesScreen';
import { AtelierScreen } from '../screens/AtelierScreen';
import { DeskScreen } from '../screens/DeskScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ClientsStackNav = createNativeStackNavigator();

function ClientsStack() {
  return (
    <ClientsStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <ClientsStackNav.Screen name="ClientsList" component={ClientsListScreen} options={{ title: 'Clients' }} />
      <ClientsStackNav.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: 'Fiche client' }} />
    </ClientsStackNav.Navigator>
  );
}

const ICONS = {
  Boutique: 'home',
  Desk:     'grid',
  Clients:  'people',
  Eyewear:  'glasses',
  Lenses:   'eye',
  Atelier:  'construct',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.navy, borderTopWidth: 0, elevation: 10 },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Boutique" component={PanoramaScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Desk" component={DeskScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Clients" component={ClientsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Eyewear" component={EyewearScreen} />
      <Tab.Screen name="Lenses" component={LensesScreen} />
      <Tab.Screen name="Atelier" component={AtelierScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.navy }}><ActivityIndicator size="large" color={colors.teal} /></View>;
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
