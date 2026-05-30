import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { theme } from '../../theme/theme';
import { ProductCard } from '../../components/ProductCard';
import { LuxuryButton } from '../../components/LuxuryButton';
import { Product } from '../../assets/productsData';
import { apiClient } from '../../services/api';
import { cartService } from '../../services/cartService';

const { width } = Dimensions.get('window');

// Opciones de Filtros
const GENDER_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Él', value: 'men' },
  { label: 'Ella', value: 'women' },
  { label: 'Unisex', value: 'unisex' }
];

const SIZE_OPTIONS = ['Todos', '50ml', '100ml', '200ml'];

const CONCENTRATION_OPTIONS = ['Todos', 'Eau de Parfum', 'Parfum', 'Eau de Toilette'];

export default function CatalogScreen() {
  // Estados del Catálogo y Carga
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('Todos');
  const [selectedConcentration, setSelectedConcentration] = useState<string>('Todos');
  
  // Estado para expandir/colapsar panel de filtros
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Cargar catálogo relacional de perfumes
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get('/products');
        setProducts(data);
      } catch (error) {
        console.error('[Error de Red en CatalogScreen]:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Filtrado reactivo en tiempo real adaptado a variantes relacionales
  const filteredProducts = products.filter((product) => {
    const matchGender = selectedGender === 'all' || product.gender === selectedGender;
    
    // Mapear tamaño sobre el arreglo de variantes del producto
    const matchSize = selectedSize === 'Todos' || (product.variants && product.variants.some((v: any) => v.size === selectedSize));
    
    // Mapear concentración sobre las variantes
    const matchConcentration = selectedConcentration === 'Todos' || (product.variants && product.variants.some((v: any) => v.concentration === selectedConcentration));
    
    return matchGender && matchSize && matchConcentration;
  });

  const handleResetFilters = () => {
    setSelectedGender('all');
    setSelectedSize('Todos');
    setSelectedConcentration('Todos');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedGender !== 'all') count++;
    if (selectedSize !== 'Todos') count++;
    if (selectedConcentration !== 'Todos') count++;
    return count;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* 1. Encabezado de la Pantalla */}
      <View style={styles.header}>
        <Text style={styles.title}>Colección Esencial</Text>
        <Text style={styles.subtitle}>Curaduría selectiva de alta gama</Text>
      </View>

      {/* 2. Panel Superior de Filtros Interactivo */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          style={[styles.filterToggleRow, filtersExpanded && styles.filterToggleRowActive]}
        >
          <View style={styles.toggleLeft}>
            <Text style={styles.filterToggleTitle}>FILTROS</Text>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.toggleArrow}>
            {filtersExpanded ? '▲ COLAPSAR' : '▼ EXPANDIR'}
          </Text>
        </TouchableOpacity>

        {/* Bloque expandible de filtros */}
        {filtersExpanded && (
          <View style={styles.expandedFiltersContainer}>
            
            {/* Fila A: Género */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Género</Text>
              <View style={styles.pillsRow}>
                {GENDER_OPTIONS.map((opt) => {
                  const isActive = selectedGender === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.8}
                      onPress={() => setSelectedGender(opt.value)}
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

            {/* Fila B: Tamaño */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Tamaño</Text>
              <View style={styles.pillsRow}>
                {SIZE_OPTIONS.map((opt) => {
                  const isActive = selectedSize === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSize(opt)}
                      style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
                    >
                      <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Fila C: Concentración */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Concentración</Text>
              <View style={styles.pillsRow}>
                {CONCENTRATION_OPTIONS.map((opt) => {
                  const isActive = selectedConcentration === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => setSelectedConcentration(opt)}
                      style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
                    >
                      <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Acciones del Filtro */}
            {getActiveFiltersCount() > 0 && (
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={handleResetFilters}
                style={styles.resetTextButton}
              >
                <Text style={styles.resetButtonText}>Limpiar todos los filtros</Text>
              </TouchableOpacity>
            )}

          </View>
        )}
      </View>

      {/* 3. Grilla de Productos de Doble Columna */}
      {loading ? (
        <View style={{ flex: 0.8, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: theme.spacing.md, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.body, fontSize: 13, letterSpacing: 1.5 }}>
            DECODIFICANDO ESENCIAS...
          </Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              id={item.id}
              brand={item.brand}
              name={item.name}
              price={item.price}
              imageUrl={item.imageUrl}
              isNew={item.isNew}
              onPress={() => console.log(`Detalle: ${item.name}`)}
              onAddToCartPress={() => cartService.addToCart(item)}
            />
          )}
        />
      ) : (
        /* Pantalla de feedback elegante para búsquedas sin resultados (UX Exclusiva) */
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsIcon}>∅</Text>
          <Text style={styles.noResultsTitle}>Sin Esencias Disponibles</Text>
          <Text style={styles.noResultsSubtitle}>
            No hemos encontrado perfumes que coincidan con la combinación de filtros seleccionada.
          </Text>
          <LuxuryButton
            title="Resetear Filtros"
            variant="outline"
            onPress={handleResetFilters}
            style={styles.resetBtn}
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
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  filterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  filterToggleRowActive: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filterToggleTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
  },
  filterBadge: {
    backgroundColor: theme.colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.background,
    fontWeight: theme.typography.weights.bold,
  },
  toggleArrow: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  expandedFiltersContainer: {
    padding: theme.spacing.md,
    backgroundColor: 'rgba(22, 22, 22, 0.5)',
  },
  filterGroup: {
    marginBottom: theme.spacing.md,
  },
  filterGroupLabel: {
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
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.2,
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
    fontSize: theme.typography.sizes.bodySmall - 1,
    fontWeight: theme.typography.weights.medium,
  },
  pillTextActive: {
    color: theme.colors.background,
  },
  pillTextInactive: {
    color: theme.colors.textSecondary,
  },
  resetTextButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  resetButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    textDecorationLine: 'underline',
  },
  gridContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  noResultsContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  noResultsIcon: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 72,
    color: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  noResultsTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
  },
  noResultsSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.bodyMedium,
    marginBottom: theme.spacing.xl,
  },
  resetBtn: {
    width: '60%',
  },
});
