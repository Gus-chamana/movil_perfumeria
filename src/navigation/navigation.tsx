import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { cartService } from '../services/cartService';
import { useAuth } from '../services/AuthContext';

// Importación de Pantallas (Shells iniciales de TAREA 1/2)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoadingScreen from '../screens/auth/LoadingScreen';
import HomeScreen from '../screens/main/HomeScreen';
import CatalogScreen from '../screens/main/CatalogScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import CartScreen from '../screens/main/CartScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import TrackingScreen from '../screens/main/TrackingScreen';

// Importación de Pantallas de Administración de Lujo
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMotorizadosScreen from '../screens/admin/AdminMotorizadosScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

// Importación de Pantallas de Motorizado de Lujo
import MotorizadoShipmentsScreen from '../screens/motorizado/MotorizadoShipmentsScreen';
import MotorizadoRouteScreen from '../screens/motorizado/MotorizadoRouteScreen';
import MotorizadoHistoryScreen from '../screens/motorizado/MotorizadoHistoryScreen';
import MotorizadoProfileScreen from '../screens/motorizado/MotorizadoProfileScreen';

/**
 * Definición Estricta de Tipos para TypeScript (React Navigation)
 */

// Parámetros de Navegación para el flujo de Autenticación
export type AuthStackParamList = {
  Loading: undefined;
  Login: undefined;
  Register: undefined;
};

// Parámetros de Navegación para la Barra Inferior (Bottom Tabs)
export type MainTabParamList = {
  // Client tabs
  HomeTab: undefined;
  CatalogTab: undefined;
  FavoritesTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
  // Admin tabs
  AdminDashboardTab: undefined;
  AdminMotorizadosTab: undefined;
  AdminProductsTab: undefined;
  AdminUsersTab: undefined;
  // Motorizado tabs
  MotorizadoShipmentsTab: undefined;
  MotorizadoRouteTab: { shipmentId?: string } | undefined;
  MotorizadoHistoryTab: undefined;
  MotorizadoProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Checkout: undefined;
  Tracking: { orderId?: string };
  AdminDashboard: undefined;
  AdminMotorizados: undefined;
  AdminProducts: undefined;
  AdminUsers: undefined;
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
      <AuthStack.Screen name="Loading" component={LoadingScreen} />
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
  const { userProfile } = useAuth();
  const [cartCount, setCartCount] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = cartService.subscribe((items) => {
      // Sumar el total de unidades agregadas al carrito
      const total = items.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(total);
    });
    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.rol === 'ADMIN';
  const isMotorizado = userProfile?.rol === 'MOTORIZADO';

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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CatalogTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'FavoritesTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AdminDashboardTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'AdminMotorizadosTab') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'AdminProductsTab') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'AdminUsersTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'MotorizadoShipmentsTab') {
            iconName = focused ? 'paper-plane' : 'paper-plane-outline';
          } else if (route.name === 'MotorizadoRouteTab') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'MotorizadoHistoryTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'MotorizadoProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={size || 22} color={color} />
            </View>
          );
        },
      })}
    >
      {isAdmin ? (
        <>
          <Tab.Screen 
            name="AdminDashboardTab" 
            component={AdminDashboardScreen} 
            options={{ title: 'Métricas' }} 
          />
          <Tab.Screen 
            name="AdminMotorizadosTab" 
            component={AdminMotorizadosScreen} 
            options={{ title: 'Motorizados' }} 
          />
          <Tab.Screen 
            name="AdminProductsTab" 
            component={AdminProductsScreen} 
            options={{ title: 'Productos' }} 
          />
          <Tab.Screen 
            name="AdminUsersTab" 
            component={AdminUsersScreen} 
            options={{ title: 'Usuarios' }} 
          />
        </>
      ) : isMotorizado ? (
        <>
          <Tab.Screen 
            name="MotorizadoShipmentsTab" 
            component={MotorizadoShipmentsScreen} 
            options={{ title: 'Envíos' }} 
          />
          <Tab.Screen 
            name="MotorizadoRouteTab" 
            component={MotorizadoRouteScreen} 
            options={{ title: 'Ruta' }} 
          />
          <Tab.Screen 
            name="MotorizadoHistoryTab" 
            component={MotorizadoHistoryScreen} 
            options={{ title: 'Historial' }} 
          />
          <Tab.Screen 
            name="MotorizadoProfileTab" 
            component={MotorizadoProfileScreen} 
            options={{ title: 'Perfil' }} 
          />
        </>
      ) : (
        <>
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
            name="FavoritesTab" 
            component={FavoritesScreen} 
            options={{ title: 'Favoritos' }} 
          />
          <Tab.Screen 
            name="CartTab" 
            component={CartScreen} 
            options={{ 
              title: 'Carrito',
              tabBarBadge: cartCount > 0 ? cartCount : undefined,
              tabBarBadgeStyle: {
                backgroundColor: theme.colors.primary, // Oro Premium
                color: theme.colors.background, // Texto negro de contraste
                fontSize: 10,
                fontWeight: 'bold',
                lineHeight: Platform.OS === 'ios' ? 14 : 13,
                height: 16,
                minWidth: 16,
                borderRadius: 8,
              }
            }} 
          />
          <Tab.Screen 
            name="ProfileTab" 
            component={ProfileScreen} 
            options={{ title: 'Perfil' }} 
          />
        </>
      )}
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
      
      {/* Flujo de Administración Exclusiva de Lujo */}
      <RootStack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen 
        name="AdminMotorizados" 
        component={AdminMotorizadosScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen 
        name="AdminProducts" 
        component={AdminProductsScreen} 
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen} 
        options={{ animation: 'slide_from_right' }}
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
