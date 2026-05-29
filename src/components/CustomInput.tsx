import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  TouchableOpacity, 
  TextInputProps, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { theme } from '../theme/theme';

export interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

/**
 * CustomInput - Campo de entrada premium para formularios.
 * Incorpora un diseño de caja minimalista sobre fondo ultra oscuro (#161616),
 * foco dinámico con bordes dorados, manejo visual de errores y un elegante toggle
 * para visualizar u ocultar contraseñas ("MOSTRAR" / "OCULTAR") en tipografía de alto nivel.
 */
export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  leftIcon,
  containerStyle,
  inputStyle,
  isPassword = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Determinar el estilo del borde según el estado (foco, error o inactivo)
  const getBorderStyle = () => {
    if (error) {
      return styles.errorBorder;
    }
    if (isFocused) {
      return styles.focusedBorder;
    }
    return styles.defaultBorder;
  };

  // Determinar si el texto de la contraseña debe ocultarse
  const isSecure = isPassword && !passwordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Etiqueta superior del Input (Opcional, estilo editorial de lujo) */}
      {label && (
        <Text style={[styles.label, error ? styles.errorLabel : isFocused ? styles.focusedLabel : null]}>
          {label}
        </Text>
      )}

      {/* Contenedor del Input */}
      <View style={[styles.inputWrapper, getBorderStyle()]}>
        {/* Ranura para icono izquierdo */}
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.colors.primary}
          {...rest}
        />

        {/* Botón de visibilidad para contraseñas */}
        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {passwordVisible ? 'OCULTAR' : 'MOSTRAR'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mensaje de Error animado/estático debajo */}
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    marginBottom: theme.spacing.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  focusedLabel: {
    color: theme.colors.primary,
  },
  errorLabel: {
    color: theme.colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface, // Fondo elevado nivel 1
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  defaultBorder: {
    borderColor: theme.colors.border,
  },
  focusedBorder: {
    borderColor: theme.colors.primary,
  },
  errorBorder: {
    borderColor: theme.colors.error,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    paddingVertical: theme.spacing.sm,
  },
  toggleButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  toggleText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
});
