import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/navigation';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';

/**
 * App - Punto de Entrada Principal para la Aplicación Móvil Noir Essence.
 * Configura el contenedor global de navegación y envuelve la UI en el proveedor de área segura
 * para evitar solapamientos con ranuras superiores (notches) o barras del sistema en iOS y Android.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            <NavigationContainer>
              <StatusBar barStyle="light-content" />
              <RootNavigator />
            </NavigationContainer>
          </CartProvider>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
