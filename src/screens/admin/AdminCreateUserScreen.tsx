import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { CustomInput } from '../../components/CustomInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useAuth } from '../../context/AuthContext';
import { adminCreateUserAPI } from '../../services/apiService';

const ROLE_OPTIONS = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Motorizado', value: 'MOTORIZADO' }
];

export default function AdminCreateUserScreen() {
  const { token } = useAuth();

  // Estados del Formulario
  const [role, setRole] = useState<'ADMIN' | 'MOTORIZADO'>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  
  // Campos específicos de Administrador
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [dni, setDni] = useState('');

  // Campos específicos de Motorizado
  const [telefono, setTelefono] = useState('');
  const [placaVehiculo, setPlacaVehiculo] = useState('');

  // Estados de error
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [apPaternoError, setApPaternoError] = useState('');
  const [apMaternoError, setApMaternoError] = useState('');
  const [dniError, setDniError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [plateError, setPlateError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setApPaternoError('');
    setApMaternoError('');
    setDniError('');
    setPhoneError('');
    setPlateError('');

    // Validaciones básicas
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Introduce un correo electrónico válido.');
      valid = false;
    }
    if (!password || password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      valid = false;
    }
    if (!nombre.trim()) {
      setNameError('El nombre es obligatorio.');
      valid = false;
    }

    // Validaciones por Rol
    if (role === 'ADMIN') {
      if (!apellidoPaterno.trim()) {
        setApPaternoError('El apellido paterno es obligatorio.');
        valid = false;
      }
      if (!apellidoMaterno.trim()) {
        setApMaternoError('El apellido materno es obligatorio.');
        valid = false;
      }
      if (!dni.trim() || dni.length < 8) {
        setDniError('El DNI debe tener 8 dígitos.');
        valid = false;
      }
    } else {
      if (!telefono.trim()) {
        setPhoneError('El teléfono de contacto es obligatorio.');
        valid = false;
      }
      if (!placaVehiculo.trim()) {
        setPlateError('La placa del vehículo es obligatoria.');
        valid = false;
      }
    }

    if (!valid) return;

    if (!token) {
      Alert.alert('Error', 'No se ha detectado una sesión activa de administrador.');
      return;
    }

    setLoading(true);

    const payload: any = {
      email: email.trim(),
      password,
      rol: role,
      nombre: nombre.trim(),
    };

    if (role === 'ADMIN') {
      payload.apellidoPaterno = apellidoPaterno.trim();
      payload.apellidoMaterno = apellidoMaterno.trim();
      payload.dni = dni.trim();
    } else {
      payload.telefono = telefono.trim();
      payload.placaVehiculo = placaVehiculo.trim().toUpperCase();
    }

    try {
      await adminCreateUserAPI(payload, token);
      setLoading(false);
      Alert.alert(
        'Usuario Creado',
        `El usuario "${nombre}" ha sido registrado exitosamente con el rol de ${role === 'ADMIN' ? 'Administrador' : 'Repartidor/Motorizado'}.`
      );
      // Limpiar formulario
      setEmail('');
      setPassword('');
      setNombre('');
      setApellidoPaterno('');
      setApellidoMaterno('');
      setDni('');
      setTelefono('');
      setPlacaVehiculo('');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error al crear usuario', error.message || 'No se pudo crear el usuario.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crear Usuario</Text>
        <Text style={styles.headerSubtitle}>Registrar nuevo administrador o motorizado en Supabase</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            
            {/* Selector de Rol (Pills Premium) */}
            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Rol del Usuario</Text>
              <View style={styles.pillsRow}>
                {ROLE_OPTIONS.map((opt) => {
                  const isActive = role === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.8}
                      onPress={() => setRole(opt.value as any)}
                      style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
                    >
                      <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Datos Generales */}
            <CustomInput
              label="Nombre completo"
              placeholder="Ej. Juan Carlos"
              value={nombre}
              onChangeText={setNombre}
              error={nameError}
            />

            {/* Condicional de Administrador: Apellidos y DNI */}
            {role === 'ADMIN' && (
              <>
                <CustomInput
                  label="Apellido Paterno"
                  placeholder="Ej. Pérez"
                  value={apellidoPaterno}
                  onChangeText={setApellidoPaterno}
                  error={apPaternoError}
                />
                 <CustomInput
                  label="Apellido Materno"
                  placeholder="Ej. Gómez"
                  value={apellidoMaterno}
                  onChangeText={setApellidoMaterno}
                  error={apMaternoError}
                />
                <CustomInput
                  label="DNI"
                  placeholder="8 dígitos"
                  keyboardType="numeric"
                  maxLength={8}
                  value={dni}
                  onChangeText={setDni}
                  error={dniError}
                />
              </>
            )}

            {/* Condicional de Motorizado: Teléfono y Placa */}
            {role === 'MOTORIZADO' && (
              <>
                <CustomInput
                  label="Teléfono Móvil"
                  placeholder="Ej. 987654321"
                  keyboardType="phone-pad"
                  maxLength={9}
                  value={telefono}
                  onChangeText={setTelefono}
                  error={phoneError}
                />
                <CustomInput
                  label="Placa de Vehículo"
                  placeholder="Ej. MX-4842"
                  value={placaVehiculo}
                  onChangeText={setPlacaVehiculo}
                  error={plateError}
                />
              </>
            )}

            {/* Credenciales de Acceso */}
            <CustomInput
              label="Correo Electrónico"
              placeholder="correo@noinessence.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />

            <CustomInput
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              isPassword={true}
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />

            {/* Botón Ejecutivo de Registro */}
            <LuxuryButton
              title="Registrar Usuario"
              onPress={handleCreateUser}
              loading={loading}
              style={styles.submitBtn}
            />

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
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1 - 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  selectGroup: {
    marginBottom: theme.spacing.lg,
  },
  selectLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillInactive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: theme.typography.weights.semibold,
  },
  pillTextActive: {
    color: theme.colors.background,
  },
  pillTextInactive: {
    color: theme.colors.textSecondary,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
});
