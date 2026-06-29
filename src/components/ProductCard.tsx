import React, { useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  Platform
} from 'react-native';
import { theme } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../services/AuthContext';

export interface ProductCardProps {
  id: string;
  brand: string;
  name: string;
  price: number;
  imageUrl?: string;
  isNew?: boolean;
  isFavoriteInitial?: boolean;
  onPress?: () => void;
  onFavoritePress?: (isFavorite: boolean) => void;
  onAddToCartPress?: () => void;
}

const { width } = Dimensions.get('window');
// Ancho de tarjeta adaptativo para grillas de 2 columnas con márgenes estándar
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

/**
 * ProductCard - Tarjeta de producto de lujo para grillas de 2 columnas.
 * Presenta un diseño editorial sofisticado, contenedor de imagen elegante,
 * insignia de novedad ("NUEVO"), y un botón de favoritos con microinteracción 
 * táctil (animación de escala estilo latido de corazón).
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  brand,
  name,
  price,
  imageUrl,
  isNew = false,
  isFavoriteInitial = false,
  onPress,
  onFavoritePress,
  onAddToCartPress,
}) => {
  const navigation = useNavigation<any>();
  const { userToken } = useAuth();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const heartScale = useRef(new Animated.Value(1)).current;

  // Manejo de Añadir al Carrito Directo (+) evitando propagación de clic
  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (onAddToCartPress) {
      onAddToCartPress();
    }
  };

  // Formateador de Moneda en Soles Peruanos o Dólares (Estilo Noir: S/. XXX.XX)
  const formatPrice = (amount: number) => {
    return `S/. ${amount.toFixed(2)}`;
  };

  const handleFavoriteToggle = () => {
    if (userToken) {
      const nextFavoriteState = !isFavorite;
      setIsFavorite(nextFavoriteState);

      // Animación de Latido (Pulse/Heartbeat micro-interaction)
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.4,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      if (onFavoritePress) {
        onFavoritePress(nextFavoriteState);
      }

      // Redirigir directo a la pestaña de favoritos
      navigation.navigate('FavoritesTab');
    } else {
      // Pedir que inicie sesión y guardar redirección
      navigation.navigate('Auth', {
        screen: 'Login',
        params: { redirectTo: 'FavoritesTab' }
      } as any);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.cardContainer, theme.shadows.soft]}
    >
      {/* Contenedor de Imagen y Badges */}
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          // Contenedor elegante de Glassmorphism/Fondo dorado alternativo cuando no hay imagen
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderLogo}>N</Text>
          </View>
        )}

        {/* Insignia de Novedad (Badge "NUEVO" - Estética Editorial minimalista) */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NUEVO</Text>
          </View>
        )}

        {/* Botón de Favorito (Corazón flotante con animación) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleFavoriteToggle}
          style={styles.favoriteButton}
        >
          <Animated.Text
            style={[
              styles.heartIcon,
              isFavorite ? styles.heartActive : styles.heartInactive,
              { transform: [{ scale: heartScale }] },
            ]}
          >
            {isFavorite ? '♥' : '♡'}
          </Animated.Text>
        </TouchableOpacity>

        {/* Botón para Añadir al Carrito Directamente (+) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddToCart}
          style={styles.addToCartButton}
        >
          <Text style={styles.plusIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Información del Producto */}
      <View style={styles.infoContainer}>
        {/* Marca en Serif pequeña, con espaciado amplio */}
        <Text numberOfLines={1} style={styles.brandText}>
          {brand.toUpperCase()}
        </Text>

        {/* Nombre del Perfume en Serif destacado */}
        <Text numberOfLines={1} style={styles.nameText}>
          {name}
        </Text>

        {/* Precio en Oro Premium */}
        <Text style={styles.priceText}>
          {formatPrice(price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface, // Fondo elevado
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageWrapper: {
    width: '100%',
    height: 180, // Proporción áurea móvil para grillas
    backgroundColor: theme.colors.surfaceElevated,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  placeholderLogo: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 48,
    color: theme.colors.primaryTransparent,
    fontWeight: theme.typography.weights.bold,
  },
  newBadge: {
    position: 'absolute',
    left: theme.spacing.sm,
    top: theme.spacing.sm,
    backgroundColor: theme.colors.primary, // Fondo oro
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
  },
  newBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.background, // Contraste oscuro
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  favoriteButton: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'rgba(13, 13, 13, 0.75)', // Fondo oscuro semitransparente premium
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heartIcon: {
    fontSize: 18,
    lineHeight: Platform.OS === 'ios' ? 22 : 18,
    textAlign: 'center',
  },
  heartActive: {
    color: theme.colors.heartActive, // Rosa-rojo vibrante de favorito
  },
  heartInactive: {
    color: theme.colors.textSecondary,
  },
  infoContainer: {
    padding: theme.spacing.md,
  },
  brandText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.primary, // Texto dorado de marca
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
  },
  nameText: {
    fontFamily: theme.typography.fontFamily.title, // Elegante Serif para el nombre
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  priceText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary, // Blanco para precio o dorado
    fontWeight: theme.typography.weights.bold,
    marginTop: theme.spacing.xs,
  },
  addToCartButton: {
    position: 'absolute',
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primary, // Oro Premium
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  plusIcon: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.background, // Contraste oscuro
    lineHeight: Platform.OS === 'ios' ? 22 : 18,
    textAlign: 'center',
  },
});
