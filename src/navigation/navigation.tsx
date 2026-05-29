import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { theme } from '../theme/theme';

// Importación de Pantallas (Shells iniciales de TAREA 1/2)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import CatalogScreen from '../screens/main/CatalogScreen';
import CartScreen from '../screens/main/CartScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import TrackingScreen from '../screens/main/TrackingScreen';

/**
 * Definición Estricta de Tipos para TypeScript (React Navigation)
 */

// Parámetros de Navegación para el flujo de Autenticación
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Parámetros de Navegación para la Barra Inferior (Bottom Tabs)
export type MainTabParamList = {
  HomeTab: undefined;
  CatalogTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

// Parámetros de Navegación para el Stack Raíz de la Aplicación
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Checkout: undefined;
  Tracking: { orderId?: string };
};

// Instanciación de los Navegadores con Tipado Estricto
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Componente temporal de soporte para Iconos Vectoriales.
 * Diseñado para ser reemplazado por @expo/vector-icons (Ionicons/Feather) en la fase de render.
 * Dibuja un indicador premium minimalista (un punto dorado o barra superior sutil) si no hay iconos cargados.
 */
interface TabBarIconProps {
  focused: boolean;
  color: string;
  name: string;
}

const MinimalTabIcon: React.FC<TabBarIconProps> = ({ focused, color, name }) => {
  // Letra inicial estilizada como icono minimalista y lujoso
  const initial = name.substring(0, 1).toUpperCase();
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, { color, fontWeight: focused ? 'bold' : 'normal' }]}>
        {initial}
      </Text>
      {focused && <View style={styles.iconIndicator} />}
    </View>
  );
};

/**
 * 1. Flujo A: AuthStack (Pila de Navegación para Autenticación)
 */
export function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'fade',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * 2. Flujo Core: MainTabNavigator (Barra Inferior Principal de la App)
 * Implementa Inicio, Catálogo, Carrito y Perfil.
 */
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.body,
          fontSize: theme.typography.sizes.caption,
          fontWeight: theme.typography.weights.medium,
        },
        tabBarIcon: ({ focused, color }) => {
          let name = 'H';
          if (route.name === 'HomeTab') name = 'Inicio';
          else if (route.name === 'CatalogTab') name = 'Catálogo';
          else if (route.name === 'CartTab') name = 'Carrito';
          else if (route.name === 'ProfileTab') name = 'Perfil';

          return <MinimalTabIcon focused={focused} color={color} name={name} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Inicio' }} 
      />
      <Tab.Screen 
        name="CatalogTab" 
        component={CatalogScreen} 
        options={{ title: 'Catálogo' }} 
      />
      <Tab.Screen 
        name="CartTab" 
        component={CartScreen} 
        options={{ title: 'Carrito' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }} 
      />
    </Tab.Navigator>
  );
}

/**
 * 3. RootNavigator: Enrutador Raíz y Gestor de Flujos
 * Controla la transición limpia entre el estado desautenticado (Auth) y el núcleo (Main),
 * y superpone pantallas clave como Checkout y Tracking de Pedidos.
 */
export default function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* Flujo de Inicio / Autenticación */}
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      
      {/* Flujo Principal */}
      <RootStack.Screen name="Main" component={MainTabNavigator} />
      
      {/* Flujo de Compra y Tracking (Se superponen de manera fluida y elegante sobre las pestañas) */}
      <RootStack.Screen 
        name="Checkout" 
        component={CheckoutScreen} 
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen 
        name="Tracking" 
        component={TrackingScreen} 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 48,
  },
  iconText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontFamily: theme.typography.fontFamily.body,
  },
  iconIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary,
  },
});
