import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  ImageBackground, 
  FlatList, 
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { theme } from '../../theme/theme';
import { LuxuryButton } from '../../components/LuxuryButton';
import { ProductCard } from '../../components/ProductCard';
import { Product } from '../../assets/productsData';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useData } from '../../context/DataContext';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/navigation';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'HomeTab'>;

const { width } = Dimensions.get('window');

const CATEGORIES: ('Todos' | 'Amaderados' | 'Orientales' | 'Florales' | 'Cítricos')[] = [
  'Todos', 'Amaderados', 'Orientales', 'Florales', 'Cítricos'
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const { addToCart } = useCart();
  const { products } = useData();

  // Filtrar productos según la familia olfativa seleccionada
  const getFilteredProducts = () => {
    if (selectedCategory === 'Todos') {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  };

  // Filtrar novedades para el scroll horizontal
  const newProducts = products.filter(p => p.isNew);

  const handleExploreCatalog = () => {
    // Redirigir al tab del catálogo
    navigation.navigate('CatalogTab');
  };

  const handleProductPress = (product: Product) => {
    // En un flujo real, iría al ProductDetailsScreen. 
    // Por ahora, simulamos o alertamos elegantemente.
    console.log(`Ver detalles del perfume: ${product.name}`);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    Alert.alert('Noir Essence', `"${product.name}" se añadió a tu bolsa de compras.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* 1. Barra de Navegación Superior / Header de Lujo */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.logoText}>NOIR ESSENCE</Text>
          <Text style={styles.logoSubtitle}>HAUTE PARFUMERIE</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.avatarButton}>
          <Text style={styles.avatarText}>GA</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 2. Sección Hero Destacada (Estilo Cartelera de Moda) */}
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600' }}
            style={styles.heroBackground}
            imageStyle={styles.heroImage}
          >
            {/* Superposición oscura gradual premium */}
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>COLECCIÓN PRIVADA</Text>
              </View>
              <Text style={styles.heroTitle}>OUD MYSTIQUE</Text>
              <Text style={styles.heroDescription}>
                La suntuosa combinación de maderas sagradas y ámbar negro. Diseñado para las almas atrevidas.
              </Text>
              <LuxuryButton
                title="Explorar Esencia"
                size="small"
                onPress={handleExploreCatalog}
                style={styles.heroButton}
              />
            </View>
          </ImageBackground>
        </View>

        {/* 3. Selector de Categorías (Familias Olfativas) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Familias Olfativas</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryPill,
                    isActive ? styles.categoryPillActive : styles.categoryPillInactive
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    isActive ? styles.categoryTextActive : styles.categoryTextInactive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Sección Horizontal: Novedades / Nuevas Fragancias */}
        {selectedCategory === 'Todos' && (
          <View style={[styles.sectionContainer, styles.noPaddingBottom]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Fragancias Nuevas</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleExploreCatalog}>
                <Text style={styles.seeAllLink}>Ver Todo</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={newProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalListContent}
              ItemSeparatorComponent={() => <View style={{ width: theme.spacing.md }} />}
              renderItem={({ item }) => (
                <ProductCard
                  id={item.id}
                  brand={item.brand}
                  name={item.name}
                  price={item.price}
                  imageUrl={item.imageUrl}
                  isNew={item.isNew}
                  onPress={() => handleProductPress(item)}
                  onAddToCartPress={() => handleAddToCart(item)}
                />
              )}
            />
          </View>
        )}

        {/* 5. Sección de Grilla: Catálogo Curado */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'Todos' ? 'Colección Noir' : `Esencias ${selectedCategory}`}
          </Text>
          
          <View style={styles.productsGrid}>
            {getFilteredProducts().map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                isNew={product.isNew}
                onPress={() => handleProductPress(product)}
                onAddToCartPress={() => handleAddToCart(product)}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  logoText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.primary,
    letterSpacing: 2,
    fontWeight: theme.typography.weights.bold,
  },
  logoSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  heroWrapper: {
    width: width - theme.spacing.lg * 2,
    height: 320,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImage: {
    opacity: 0.85,
  },
  heroOverlay: {
    backgroundColor: 'rgba(13, 13, 13, 0.70)',
    padding: theme.spacing.lg,
    justifyContent: 'flex-end',
    flex: 1,
  },
  heroBadge: {
    backgroundColor: theme.colors.primaryTransparent,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  heroBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.hero - 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  heroDescription: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.lineHeights.bodyMedium,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  sectionContainer: {
    marginBottom: theme.spacing.xl,
  },
  noPaddingBottom: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    fontWeight: theme.typography.weights.semibold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  seeAllLink: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  categoriesScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1.2,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryPillInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  categoryText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  categoryTextActive: {
    color: theme.colors.background,
  },
  categoryTextInactive: {
    color: theme.colors.textSecondary,
  },
  horizontalListContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
});
