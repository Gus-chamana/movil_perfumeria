import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Dimensions
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userProfile, userToken, logoutUser, updateUserProfile } = useAuth();
  
  // Estados del Formulario
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  
  // Estados de UI
  const [updating, setUpdating] = useState(false);

  // Inicializar el formulario con los datos reales de Supabase del usuario
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setLastName(userProfile.lastName || '');
      setDni(userProfile.dni || '');
      setAddress(userProfile.address || '');
      setDistrict(userProfile.district || '');
    }
  }, [userProfile]);

  // Obtener Iniciales para el Avatar de Lujo
  const getInitials = () => {
    if (!name) return 'NE';
    const firstInitial = name.charAt(0).toUpperCase();
    const secondInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${secondInitial}`;
  };

  // Función para guardar los cambios en Supabase mediante el Backend
  const handleSaveProfile = async () => {
    // Validaciones de negocio senior
    if (!name.trim() || !lastName.trim() || !dni.trim() || !address.trim() || !district.trim()) {
      Alert.alert('Campos Incompletos', 'Por favor, rellena todos los campos obligatorios para guardar tus cambios.');
      return;
    }

    if (dni.length < 8) {
      Alert.alert('DNI Inválido', 'El DNI debe contener al menos 8 dígitos.');
      return;
    }

    try {
      setUpdating(true);
      
      console.log("💾 Guardando perfil en Supabase...");
      
      // Petición PUT segura al endpoint de perfil en Railway/Supabase
      const response = await apiClient.put(
        '/auth/profile', 
        {
          name: name.trim(),
          lastName: lastName.trim(),
          dni: dni.trim(),
          address: address.trim(),
          district: district.trim()
        },
        userToken || undefined
      );

      // Actualizar el estado global del AuthContext en caliente
      updateUserProfile(response.profile);
      
      Alert.alert('¡Éxito Absoluto!', 'Tus datos de perfil y dirección de entrega han sido actualizados correctamente.');
    } catch (error: any) {
      console.error('[Error al actualizar perfil]:', error);
      Alert.alert('Error de Guardado', error.message || 'No se pudo conectar con el servidor para guardar los cambios.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta de Noir Essence?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => {
            console.log("🚪 Cerrando sesión...");
            logoutUser();
            navigation.navigate('Auth');
          }
        }
      ]
    );
  };

  if (!userToken) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        
        {/* 1. Barra de Encabezado Premium */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Atelier</Text>
          <Text style={styles.headerSubtitle}>Gestión de cuenta y preferencias exclusivas</Text>
        </View>

        <View style={styles.loginPromptContainer}>
          <View style={styles.loginPromptCard}>
            <Ionicons name="person-outline" size={48} color={theme.colors.primary} style={styles.loginPromptIcon} />
            <Text style={styles.loginPromptTitle}>Miembro Noir Essence</Text>
            <Text style={styles.loginPromptSubtitle}>
              Inicia sesión para gestionar tu cuenta, ver tu historial de pedidos y configurar tus datos de entrega exclusivos.
            </Text>
            <LuxuryButton
              title="Iniciar Sesión"
              onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              style={styles.loginPromptButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* 1. Barra de Encabezado Premium */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Atelier</Text>
        <Text style={styles.headerSubtitle}>Gestión de cuenta y preferencias exclusivas</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 2. Sección Avatar Luxury */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <Text style={styles.userNameText}>
              {name ? `${name} ${lastName}` : 'Cliente Noir Essence'}
            </Text>
            <Text style={styles.userEmailText}>{userProfile?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {userProfile?.rol === 'ADMIN' ? 'ADMINISTRADOR' : 'CLIENTE VIP'}
              </Text>
            </View>
          </View>

          {/* 3. Formulario de Configuración (Estilo minimalista oro-negro) */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Datos Personales</Text>

            {/* Input Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.textInput}
              />
            </View>

            {/* Input Apellido */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellido Paterno</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ingresa tu apellido"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.textInput}
              />
            </View>

            {/* Input DNI */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DNI (Identificación)</Text>
              <TextInput
                value={dni}
                onChangeText={setDni}
                placeholder="Ingresa tu DNI"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                maxLength={8}
                style={styles.textInput}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>Dirección de Entrega</Text>

            {/* Input Dirección */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección de Domicilio</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Av. Las Esencias 123"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.textInput}
              />
            </View>

            {/* Input Distrito */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Distrito (Solo Lima Metropolitana)</Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder="Ej. Miraflores"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.textInput}
              />
            </View>
          </View>

          {/* 4. Botones de Acción */}
          <View style={styles.actionSection}>
            {updating ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loaderText}>GUARDANDO...</Text>
              </View>
            ) : (
              <LuxuryButton
                title="Guardar Cambios"
                onPress={handleSaveProfile}
                style={styles.saveButton}
              />
            )}

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: theme.colors.primary, // Hilo de oro
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 28,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
  },
  userNameText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: 4,
  },
  userEmailText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    backgroundColor: theme.colors.primaryTransparent,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.xs,
  },
  roleBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
  },
  formSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
  },
  actionSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  saveButton: {
    width: '100%',
  },
  loaderContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  loaderText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
  },
  logoutButton: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(235, 87, 87, 0.4)', // Contorno sutil rojo
    borderRadius: theme.borderRadius.sm,
  },
  logoutButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: '#EB5757', // Rojo elegante para logout
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  adminSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  adminCard: {
    width: (Dimensions.get('window').width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  adminCardText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 8,
  },
  adminCardSub: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  loginPromptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    ...theme.shadows.soft,
  },
  loginPromptIcon: {
    marginBottom: theme.spacing.md,
  },
  loginPromptTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.bodyMedium,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  loginPromptButton: {
    width: '100%',
  },
});
