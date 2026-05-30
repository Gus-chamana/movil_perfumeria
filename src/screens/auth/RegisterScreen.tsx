import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { theme } from '../../theme/theme';
import { CustomInput } from '../../components/CustomInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import { useAuth } from '../../context/AuthContext';
import { registerStep1API, registerStep2API } from '../../services/apiService';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { updateUser } = useAuth();
  
  // Control de Pasos (1: Datos de Acceso, 2: Dirección Principal)
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Animación del ancho de la barra de progreso
  const progressAnim = useRef(new Animated.Value(0.5)).current; // 50% por defecto para el paso 1

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================
  // Paso 1: Datos de Acceso
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Paso 2: Dirección Principal
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');

  // ==========================================
  // ESTADOS DE ERRORES
  // ==========================================
  // Errores Paso 1
  const [nameError, setNameError] = useState('');
  const [apPaternoError, setApPaternoError] = useState('');
  const [apMaternoError, setApMaternoError] = useState('');
  const [dniError, setDniError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // Errores Paso 2
  const [addressError, setAddressError] = useState('');
  const [cityError, setCityError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ==========================================
  // NAVEGACIÓN Y VALIDACIÓN DE PASOS
  // ==========================================
  
  // Animación de transición de barra
  const animateProgressBar = (targetValue: number) => {
    Animated.timing(progressAnim, {
      toValue: targetValue,
      duration: 350,
      useNativeDriver: false, // El ancho del layout no soporta drivers nativos directos
    }).start();
  };

  const handleNextStep = () => {
    let valid = true;
    setNameError('');
    setApPaternoError('');
    setApMaternoError('');
    setDniError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validación Nombre
    if (!nombre.trim()) {
      setNameError('El nombre es requerido.');
      valid = false;
    }

    // Validación Apellido Paterno
    if (!apellidoPaterno.trim()) {
      setApPaternoError('El apellido paterno es requerido.');
      valid = false;
    }

    // Validación Apellido Materno
    if (!apellidoMaterno.trim()) {
      setApMaternoError('El apellido materno es requerido.');
      valid = false;
    }

    // Validación DNI
    if (!dni.trim()) {
      setDniError('El DNI es requerido.');
      valid = false;
    } else if (dni.trim().length !== 8 || isNaN(Number(dni.trim()))) {
      setDniError('El DNI debe ser numérico de 8 dígitos.');
      valid = false;
    }

    // Validación Correo
    if (!email) {
      setEmailError('El correo electrónico es requerido.');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('El correo electrónico no es válido.');
      valid = false;
    }

    // Validación Contraseña
    if (!password) {
      setPasswordError('La contraseña es requerida.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Debe tener al menos 6 caracteres.');
      valid = false;
    }

    // Validación Confirmar Contraseña
    if (!confirmPassword) {
      setConfirmPasswordError('Por favor confirma tu contraseña.');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden.');
      valid = false;
    }

    if (!valid) return;

    // Transición suave al paso 2
    setStep(2);
    animateProgressBar(1.0); // 100% de progreso
  };

  const handlePrevStep = () => {
    setStep(1);
    animateProgressBar(0.5); // Regresa a 50%
  };

  const handleRegister = async () => {
    let valid = true;
    setAddressError('');
    setCityError('');
    setPhoneError('');

    // Validación Dirección
    if (!address.trim()) {
      setAddressError('La dirección de entrega es requerida.');
      valid = false;
    }

    // Validación Distrito/Ciudad
    if (!city.trim()) {
      setCityError('El distrito o ciudad es requerido.');
      valid = false;
    }

    // Validación Teléfono
    if (!phone) {
      setPhoneError('El teléfono de contacto es requerido.');
      valid = false;
    } else if (phone.length < 9) {
      setPhoneError('El número ingresado no es válido.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      // 1. Registrar Paso 1 (Creación de cuenta en Supabase)
      const step1Result = await registerStep1API({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        dni: dni.trim(),
      });

      // 2. Registrar Paso 2 (Dirección principal vinculada al token del paso 1)
      const token = step1Result.token;
      await registerStep2API({
        direccion: address.trim(),
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: city.trim(),
        referencia: zipCode ? `Código postal: ${zipCode}` : '',
      }, token);

      // 3. Loguear al usuario en el contexto
      updateUser({
        id: step1Result.usuario.id,
        name: `${nombre.trim()} ${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`,
        email: step1Result.usuario.email,
        role: step1Result.usuario.rol,
        dni: dni.trim(),
        direcciones: [{
          direccion: address.trim(),
          distrito: city.trim(),
          departamento: 'Lima',
          provincia: 'Lima',
        }],
      }, token);

      setLoading(false);
      navigation.replace('Main');
    } catch (error: any) {
      setLoading(false);
      alert(error.message || 'Ocurrió un error al registrarse. Inténtelo de nuevo.');
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' } as any);
  };

  // Interpolación para el ancho de la barra
  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0.5, 1.0],
    outputRange: ['50%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera / Sección de Marca */}
          <View style={styles.headerContainer}>
            <Text style={styles.brandTitle}>NOIR ESSENCE</Text>
            <Text style={styles.brandTagline}>Crear Cuenta Premium</Text>
          </View>

          {/* Formulario Multicapa */}
          <View style={styles.formContainer}>
            
            {/* Barra Indicadora de Progreso Interactiva */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressBar, { width: widthInterpolate }]} />
              </View>
              <View style={styles.progressTextWrapper}>
                <Text style={[styles.progressStepLabel, step === 1 && styles.activeStepLabel]}>
                  1. Datos de Acceso
                </Text>
                <Text style={[styles.progressStepLabel, step === 2 && styles.activeStepLabel]}>
                  2. Dirección de Envío
                </Text>
              </View>
            </View>

            {/* PASO 1: Datos de Acceso */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <CustomInput
                  label="Nombre(s)"
                  placeholder="Gustavo Alonso"
                  value={nombre}
                  onChangeText={setNombre}
                  error={nameError}
                  autoCapitalize="words"
                />

                <CustomInput
                  label="Apellido Paterno"
                  placeholder="Silva"
                  value={apellidoPaterno}
                  onChangeText={setApellidoPaterno}
                  error={apPaternoError}
                  autoCapitalize="words"
                />

                <CustomInput
                  label="Apellido Materno"
                  placeholder="Gomez"
                  value={apellidoMaterno}
                  onChangeText={setApellidoMaterno}
                  error={apMaternoError}
                  autoCapitalize="words"
                />

                <CustomInput
                  label="DNI"
                  placeholder="DNI de 8 dígitos"
                  keyboardType="number-pad"
                  maxLength={8}
                  value={dni}
                  onChangeText={setDni}
                  error={dniError}
                />

                <CustomInput
                  label="Correo Electrónico"
                  placeholder="ejemplo@noirenssence.com"
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

                <CustomInput
                  label="Confirmar Contraseña"
                  placeholder="Repite tu contraseña"
                  isPassword={true}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={confirmPasswordError}
                />

                <LuxuryButton
                  title="Continuar"
                  onPress={handleNextStep}
                  style={styles.actionButton}
                />
              </View>
            )}

            {/* PASO 2: Dirección Principal */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <CustomInput
                  label="Dirección Principal"
                  placeholder="Av. Javier Prado Este 1024, Dpto 402"
                  value={address}
                  onChangeText={setAddress}
                  error={addressError}
                  autoCapitalize="sentences"
                />

                <CustomInput
                  label="Distrito / Ciudad"
                  placeholder="San Borja, Lima"
                  value={city}
                  onChangeText={setCity}
                  error={cityError}
                  autoCapitalize="words"
                />

                <CustomInput
                  label="Teléfono Móvil"
                  placeholder="987 654 321"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  error={phoneError}
                />

                <CustomInput
                  label="Código Postal (Opcional)"
                  placeholder="15037"
                  keyboardType="number-pad"
                  value={zipCode}
                  onChangeText={setZipCode}
                />

                {/* Botones de acción en fila */}
                <View style={styles.buttonRow}>
                  <LuxuryButton
                    title="Atrás"
                    variant="outline"
                    onPress={handlePrevStep}
                    style={styles.rowButtonLeft}
                  />
                  <LuxuryButton
                    title="Registrarme"
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.rowButtonRight}
                  />
                </View>
              </View>
            )}

            {/* Footer de Enlace a Login */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleGoToLogin}>
                <Text style={styles.loginLink}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  brandTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 34,
    color: theme.colors.primary,
    letterSpacing: 4,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
  },
  brandTagline: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  progressContainer: {
    marginBottom: theme.spacing.xl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary, // Barra rellena dorada
  },
  progressTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  progressStepLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
  },
  activeStepLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  stepContent: {
    width: '100%',
  },
  actionButton: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  rowButtonLeft: {
    flex: 1.2,
  },
  rowButtonRight: {
    flex: 2.2,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
