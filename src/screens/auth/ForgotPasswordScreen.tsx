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

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSendInstructions = () => {
    setEmailError('');
    
    if (!email) {
      setEmailError('El correo electrónico es requerido.');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('El correo ingresado no es válido.');
      return;
    }

    setLoading(true);
    // Simular envío de correo con latencia premium de 1.2 segundos
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleGoToLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' } as any);
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
          {/* Cabecera / Marca */}
          <View style={styles.headerContainer}>
            <Text style={styles.brandTitle}>NOIR ESSENCE</Text>
            <Text style={styles.brandTagline}>L'essence de l'élégance</Text>
          </View>

          {/* Formulario / Tarjeta */}
          <View style={styles.formContainer}>
            {!submitted ? (
              <View>
                <Text style={styles.titleText}>Recuperar Cuenta</Text>
                <Text style={styles.descriptionText}>
                  Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
                </Text>

                <CustomInput
                  label="Correo Electrónico"
                  placeholder="ejemplo@noirenssence.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  error={emailError}
                />

                <LuxuryButton
                  title="Enviar Instrucciones"
                  onPress={handleSendInstructions}
                  loading={loading}
                  style={styles.actionButton}
                />

                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={handleGoToLogin}
                  style={styles.backLinkContainer}
                >
                  <Text style={styles.backLinkText}>Volver al Inicio de Sesión</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.successWrapper}>
                <View style={styles.successBadge}>
                  <Text style={styles.successIcon}>✓</Text>
                </View>
                <Text style={styles.titleText}>Instrucciones Enviadas</Text>
                <Text style={styles.descriptionTextCenter}>
                  Hemos enviado un enlace de recuperación a:{"\n"}
                  <Text style={styles.emailHighlighted}>{email}</Text>
                  {"\n\n"}
                  Revisa tu bandeja de entrada o tu carpeta de correo no deseado (spam).
                </Text>

                <LuxuryButton
                  title="Regresar al Login"
                  onPress={handleGoToLogin}
                  style={styles.actionButton}
                />
              </View>
            )}
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
  titleText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  descriptionText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.lineHeights.bodyMedium,
  },
  descriptionTextCenter: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.lineHeights.bodyMedium,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  backLinkContainer: {
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  backLinkText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    textDecorationLine: 'underline',
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  successBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  successIcon: {
    fontSize: 28,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  emailHighlighted: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});
