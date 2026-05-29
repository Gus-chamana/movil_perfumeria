import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  ScrollView,
  StatusBar
} from 'react-native';
import { theme } from '../../theme/theme';
import { LuxuryButton } from '../../components/LuxuryButton';
import { PRODUCTS_MOCK, Product } from '../../assets/productsData';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  
  // Inicializamos el carrito con 2 perfumes de lujo para demostrar el cálculo interactivo
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: PRODUCTS_MOCK[0], quantity: 1 }, // Oud Mystique
    { product: PRODUCTS_MOCK[1], quantity: 2 }, // Nuit Intense
  ]);

  // Manejo de cantidades
  const handleIncreaseQty = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.product.id === id 
        ? { ...item, quantity: item.quantity + 1 } 
        : item
    ));
  };

  const handleDecreaseQty = (id: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === id) {
        const nextQty = item.quantity - 1;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== id));
  };

  // Cálculos dinámicos
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const igv = subtotal * 0.18; // Impuesto General a las Ventas (18%)
  const shipping = subtotal > 0 ? 15.00 : 0.00; // Costo de envío premium
  const total = subtotal + igv + shipping;

  const handleProceedToCheckout = () => {
    navigation.navigate('Checkout');
  };

  const handleExploreCatalog = () => {
    // Regresa al Home o navega al catálogo
    navigation.navigate('Main' as any, { screen: 'CatalogTab' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu Selección</Text>
        <Text style={styles.headerSubtitle}>Bolsa de fragancias Noir Essence</Text>
      </View>

      {cartItems.length > 0 ? (
        <View style={styles.contentWrapper}>
          {/* Lista de Productos en el Carrito */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cartCard}>
                {item.product.imageUrl ? (
                  <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderLogo}>N</Text>
                  </View>
                )}

                {/* Detalles */}
                <View style={styles.itemDetails}>
                  <Text numberOfLines={1} style={styles.brandText}>{item.product.brand.toUpperCase()}</Text>
                  <Text numberOfLines={1} style={styles.nameText}>{item.product.name}</Text>
                  <Text style={styles.sizeText}>{item.product.size} · {item.product.concentration}</Text>
                  <Text style={styles.priceText}>S/. {item.product.price.toFixed(2)}</Text>
                </View>

                {/* Controles de Cantidad */}
                <View style={styles.qtyContainer}>
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={() => handleRemoveItem(item.product.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>×</Text>
                  </TouchableOpacity>

                  <View style={styles.counterRow}>
                    <TouchableOpacity 
                      activeOpacity={0.7} 
                      onPress={() => handleDecreaseQty(item.product.id)}
                      style={styles.counterBtn}
                    >
                      <Text style={styles.counterBtnText}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      activeOpacity={0.7} 
                      onPress={() => handleIncreaseQty(item.product.id)}
                      style={styles.counterBtn}
                    >
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Desglose de Precios y CTA de Compra */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>S/. {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IGV (18%)</Text>
              <Text style={styles.summaryVal}>S/. {igv.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío Premium (Lima Met.)</Text>
              <Text style={styles.summaryVal}>S/. {shipping.toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total General</Text>
              <Text style={styles.totalVal}>S/. {total.toFixed(2)}</Text>
            </View>

            <LuxuryButton
              title="Proceder al Pago"
              onPress={handleProceedToCheckout}
              style={styles.checkoutBtn}
            />
          </View>
        </View>
      ) : (
        /* Estado de Carrito Vacío */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👜</Text>
          <Text style={styles.emptyTitle}>Tu bolsa está vacía</Text>
          <Text style={styles.emptySubtitle}>
            Aún no has agregado ninguna esencia a tu selección. Explora nuestro catálogo y descubre fragancias únicas.
          </Text>
          <LuxuryButton
            title="Descubrir Perfumes"
            onPress={handleExploreCatalog}
            style={styles.exploreBtn}
          />
        </View>
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
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  itemImage: {
    width: 76,
    height: 90,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
  },
  imagePlaceholder: {
    width: 76,
    height: 90,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLogo: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 24,
    color: theme.colors.primaryTransparent,
    fontWeight: theme.typography.weights.bold,
  },
  itemDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  brandText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  nameText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: 4,
  },
  sizeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  priceText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  qtyContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
  },
  deleteButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 22,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xs,
  },
  counterBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  qtyText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginHorizontal: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    ...theme.shadows.soft,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
  },
  summaryVal: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  totalVal: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  checkoutBtn: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  emptyContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: theme.spacing.sm,
    color: theme.colors.border,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.bodyMedium,
    marginBottom: theme.spacing.xl,
  },
  exploreBtn: {
    width: '60%',
  },
});
