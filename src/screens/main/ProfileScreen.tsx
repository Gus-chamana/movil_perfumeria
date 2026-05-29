import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();

  // Manejar el cierre de sesión: reinicia la navegación de la app apuntando al Auth Navigator (Login)
  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Encabezado de la Pantalla */}
        <View style={styles.header}>
          <Text style={styles.title}>Mi Cuenta</Text>
          <Text style={styles.subtitle}>Detalles de perfil y preferencias</Text>
        </View>

        {/* 2. Tarjeta de Perfil de Usuario (Estética de Lujo) */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CG'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user ? user.name : 'Carlos Gómez'}</Text>
            <Text style={styles.userEmail}>{user ? user.email : 'cliente@noinessence.com'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user ? (user.role === 'ADMIN' ? 'Administrador' : user.role === 'MOTORIZADO' ? 'Despachador' : 'Cliente Exclusivo') : 'Cliente Exclusivo'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Menú de Opciones y Ajustes */}
        <View style={styles.menuContainer}>
          
          <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
            <View>
              <Text style={styles.menuItemTitle}>Información Personal</Text>
              <Text style={styles.menuItemSubtitle}>DNI: 73948502 · Teléfono: 999 888 777</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
            <View>
              <Text style={styles.menuItemTitle}>Dirección Principal</Text>
              <Text style={styles.menuItemSubtitle}>Av. Larco 456, Miraflores, Lima</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.menuItem}>
            <View>
              <Text style={styles.menuItemTitle}>Historial de Pedidos</Text>
              <Text style={styles.menuItemSubtitle}>Ver compras anteriores y seguimiento</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={[styles.menuItem, styles.lastMenuItem]}>
            <View>
              <Text style={styles.menuItemTitle}>Preferencias de Pago</Text>
              <Text style={styles.menuItemSubtitle}>Tarjetas guardadas y billeteras digitales</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>

        </View>

        {/* 4. Botón de Acción Principal para Salir (Cerrar Sesión) */}
        <View style={styles.buttonContainer}>
          <LuxuryButton
            title="Cerrar Sesión"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
          <Text style={styles.versionText}>Noir Essence v1.0.0 · Edición Limitada</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  userInfo: {
    marginLeft: theme.spacing.lg,
    flex: 1,
  },
  userName: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  userEmail: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  menuItemSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  arrowIcon: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    borderColor: theme.colors.error, // Rojo elegante para la acción de salir
    borderWidth: 1.2,
  },
  logoutButtonText: {
    color: theme.colors.error,
  },
  versionText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.lg,
    letterSpacing: 0.5,
  },
});
