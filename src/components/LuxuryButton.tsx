import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  TouchableOpacityProps 
} from 'react-native';
import { theme } from '../theme/theme';

export interface LuxuryButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'solid' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * LuxuryButton - Botón premium interactivo con estética editorial de alta gama.
 * Soporta variantes sólidas (fondo dorado, texto negro profundo), con contorno (outline) o de texto plano.
 * Cuenta con feedback de opacidad fluido y spinner de carga integrado.
 */
export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  title,
  variant = 'solid',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  disabled,
  ...rest
}) => {
  const isSolid = variant === 'solid';
  const isOutline = variant === 'outline';
  
  // Determinación de estilos según tamaño
  const sizeStyles = {
    small: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
    },
    medium: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
    },
    large: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xxl,
      borderRadius: theme.borderRadius.md,
    },
  }[size];

  const sizeTextStyles = {
    small: {
      fontSize: theme.typography.sizes.bodySmall,
    },
    medium: {
      fontSize: theme.typography.sizes.bodyMedium,
    },
    large: {
      fontSize: theme.typography.sizes.bodyLarge,
    },
  }[size];

  // Estilos de contenedores según variante
  const containerVariantStyle = isSolid
    ? styles.solidContainer
    : isOutline
    ? styles.outlineContainer
    : styles.textContainer;

  // Estilos de texto según variante
  const textVariantStyle = isSolid
    ? styles.solidText
    : isOutline
    ? styles.outlineText
    : styles.textText;

  // Color del indicador de carga
  const spinnerColor = isSolid ? theme.colors.background : theme.colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.baseContainer,
        sizeStyles,
        containerVariantStyle,
        disabled && styles.disabledContainer,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.baseText,
              sizeTextStyles,
              textVariantStyle,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  baseText: {
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase', // Estilo tipográfico de marcas de lujo
  },
  // Variante Sólida (Oro con texto oscuro)
  solidContainer: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  solidText: {
    color: theme.colors.background, // Excelente contraste WCAG sobre el oro
  },
  // Variante Contorno (Fondo transparente con borde de oro)
  outlineContainer: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  // Variante de Texto
  textContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  textText: {
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  // Estados deshabilitados
  disabledContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
  iconContainer: {
    marginHorizontal: theme.spacing.xs,
  },
});
