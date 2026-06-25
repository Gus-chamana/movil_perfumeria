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
  Switch
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MotorizadoProfileScreen() {
  const navigation = useNavigation<any>();
  const { userToken, logoutUser } = useAuth();
  
  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [placa, setPlaca] = useState('');
  const [activo, setActivo] = useState(true);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/motorizado/profile', userToken || undefined);
      setNombre(data.nombre || 'Repartidor');
      setEmail(data.email || '');
      setTelefono(data.telefono || '');
      setPlaca(data.placa || '');
      setActivo(data.activo ?? true);
    } catch (error) {
      console.error('[Error al cargar perfil de motorizado]:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil de motorizado de Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!telefono.trim() || !placa.trim()) {
      Alert.alert('Campos Incompletos', 'Por favor, rellena tu teléfono y la placa del vehículo.');
      return;
    }

    try {
      setUpdating(true);
      const response = await apiClient.put(
        '/motorizado/profile',
        {
          telefono: telefono.trim(),
          placa: placa.trim(),
          activo
        },
        userToken || undefined
      );
      Alert.alert('¡Éxito!', response.message || 'Tu perfil logístico ha sido actualizado.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron guardar tus datos.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActivo = async (value: boolean) => {
    setActivo(value);
    try {
      await apiClient.put(
        '/motorizado/profile',
        {
          telefono: telefono.trim(),
          placa: placa.trim(),
          activo: value
        },
        userToken || undefined
      );
    } catch (error) {
      console.error('[Error al cambiar disponibilidad]:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta logística de Noir Essence?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => {
            logoutUser();
            navigation.navigate('Auth');
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Mi Hangar</Text>
          <Text style={styles.headerSubtitle}>Gestión de perfil logístico Concierge</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>CARGANDO PERFIL...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="bicycle" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.userNameText}>{nombre}</Text>
              <Text style={styles.userEmailText}>{email}</Text>
              
              <View style={styles.availabilityRow}>
                <Text style={styles.availabilityText}>
                  {activo ? 'DISPONIBLE PARA ENTREGAS 🟢' : 'FUERA DE SERVICIO 🔴'}
                </Text>
                <Switch
                  value={activo}
                  onValueChange={handleToggleActivo}
                  trackColor={{ false: theme.colors.border, true: 'rgba(212, 175, 55, 0.4)' }}
                  thumbColor={activo ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>
            </View>

            {/* Formulario */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Credenciales Logísticas</Text>

              {/* Teléfono */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono Repartidor</Text>
                <TextInput
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Ej. +51 984 729 105"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              {/* Placa Vehículo */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Placa de Vehículo (Motos / Van)</Text>
                <TextInput
                  value={placa}
                  onChangeText={setPlaca}
                  placeholder="Ej. NG-5830"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Acciones */}
            <View style={styles.actionSection}>
              {updating ? (
                <View style={styles.loaderActionContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loaderActionText}>GUARDANDO EN SUPABASE...</Text>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTextContainer: {
    flex: 1,
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
  loaderContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
    marginTop: theme.spacing.md,
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
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  availabilityText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  formSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
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
  loaderActionContainer: {
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
  loaderActionText: {
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
    borderColor: 'rgba(235, 87, 87, 0.4)',
    borderRadius: theme.borderRadius.sm,
  },
  logoutButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: '#EB5757',
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
});
