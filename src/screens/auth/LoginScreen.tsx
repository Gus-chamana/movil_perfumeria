import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { theme } from '../../theme/theme';
import { CustomInput } from '../../components/CustomInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import { useAuth } from '../../services/AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loginUser } = useAuth();
  
  // Estados de Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados de Errores de Validación
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validación básica e inicio de sesión real
  const handleLogin = async () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    // Validación de Email
    if (!email) {
      setEmailError('El correo electrónico es requerido.');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('El correo ingresado no es válido.');
      valid = false;
    }

    // Validación de Contraseña
    if (!password) {
      setPasswordError('La contraseña es requerida.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      await loginUser(email, password);
      // Redirigir al flujo principal de la App tras login exitoso
      navigation.replace('Main');
    } catch (error: any) {
      setPasswordError(error.message || 'Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    // Para simplificar la navegación en el AuthStack
    // Dado que Login y Register son parte del Auth Navigator
    // Podemos navegar al Register del AuthStack
    navigation.navigate('Auth', { screen: 'Register' } as any);
  };

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
            <Text style={styles.brandTagline}>L'essence de l'élégance</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Iniciar Sesión</Text>
            <Text style={styles.instructionsText}>Ingresa tus credenciales para acceder a tu catálogo exclusivo.</Text>

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
              placeholder="••••••••"
              isPassword={true}
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />

            {/* Olvidé mi Contraseña */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Botón de Acción Principal */}
            <LuxuryButton
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            {/* Enlace para Crear Cuenta */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleGoToRegister}>
                <Text style={styles.registerLink}>Regístrate</Text>
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
    marginBottom: theme.spacing.xxl,
  },
  brandTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 38,
    color: theme.colors.primary,
    letterSpacing: 4,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
  },
  brandTagline: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
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
  welcomeText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  instructionsText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.lineHeights.bodyMedium,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
    width: '100%',
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
  registerLink: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
