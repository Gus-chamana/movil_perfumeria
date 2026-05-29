import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { theme } from '../theme/theme';

// Importación de Pantallas (Shells iniciales de TAREA 1/2)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import CatalogScreen from '../screens/main/CatalogScreen';
import CartScreen from '../screens/main/CartScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import TrackingScreen from '../screens/main/TrackingScreen';

// Nuevas pantallas para Admin y Motorizado
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminAddProductScreen from '../screens/admin/AdminAddProductScreen';
import MotorizadoDashboardScreen from '../screens/motorizado/MotorizadoDashboardScreen';
import { useAuth } from '../context/AuthContext';

/**
 * Definición Estricta de Tipos para TypeScript (React Navigation)
 */

// Parámetros de Navegación para el flujo de Autenticación
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Parámetros de Navegación para la Barra Inferior (Bottom Tabs)
export type MainTabParamList = {
  HomeTab: undefined;
  CatalogTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

// Parámetros de Navegación para la Barra Inferior de Administrador
export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminOrders: undefined;
  AdminAddProduct: undefined;
};

// Parámetros de Navegación para el Stack Raíz de la Aplicación
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AdminMain: undefined;
  MotorizadoMain: undefined;
  Checkout: undefined;
  Tracking: { orderId?: string };
};

// Instanciación de los Navegadores con Tipado Estricto
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

/**
 * Componente temporal de soporte para Iconos Vectoriales.
 * Diseñado para ser reemplazado por @expo/vector-icons (Ionicons/Feather) en la fase de render.
 * Dibuja un indicador premium minimalista (un punto dorado o barra superior sutil) si no hay iconos cargados.
 */
interface TabBarIconProps {
  focused: boolean;
  color?: string;
  name?: string;
}

const MinimalTabIcon: React.FC<TabBarIconProps> = ({ focused }) => {
  return (
    <View style={[styles.tabBarLine, focused ? styles.tabBarLineActive : styles.tabBarLineInactive]} />
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
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
 * 3. AdminTabNavigator: Barra Inferior de Administración
 */
export function AdminTabNavigator() {
  return (
    <AdminTab.Navigator
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
          let name = 'M';
          if (route.name === 'AdminDashboard') name = 'Métricas';
          else if (route.name === 'AdminOrders') name = 'Órdenes';
          else if (route.name === 'AdminAddProduct') name = 'Agregar';

          return <MinimalTabIcon focused={focused} color={color} name={name} />;
        },
      })}
    >
      <AdminTab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
        options={{ title: 'Métricas' }} 
      />
      <AdminTab.Screen 
        name="AdminOrders" 
        component={AdminOrdersScreen} 
        options={{ title: 'Órdenes' }} 
      />
      <AdminTab.Screen 
        name="AdminAddProduct" 
        component={AdminAddProductScreen} 
        options={{ title: 'Agregar' }} 
      />
    </AdminTab.Navigator>
  );
}

/**
 * 4. RootNavigator: Enrutador Raíz y Gestor de Flujos con Seguridad por Rol
 */
export default function RootNavigator() {
  const { user } = useAuth();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {user === null ? (
        // Flujo de Inicio / Autenticación
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : user.role === 'ADMIN' ? (
        // Flujo de Administrador
        <RootStack.Screen name="AdminMain" component={AdminTabNavigator} />
      ) : user.role === 'MOTORIZADO' ? (
        // Flujo de Motorizado
        <RootStack.Screen name="MotorizadoMain" component={MotorizadoDashboardScreen} />
      ) : (
        // Flujo de Cliente (Default)
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
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
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarLine: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    marginTop: 6,
  },
  tabBarLineActive: {
    backgroundColor: theme.colors.primary,
  },
  tabBarLineInactive: {
    backgroundColor: 'transparent',
  },
});
