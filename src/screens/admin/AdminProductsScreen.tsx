import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StatusBar,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Variant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  size: string | null;
  concentration: string | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  gender: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  variants: Variant[];
}

export default function AdminProductsScreen() {
  const navigation = useNavigation();
  const { userToken } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estados para el Modal de Creación de Producto
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductGender, setNewProductGender] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  
  // Estado para la lista temporal de variantes en el formulario
  interface LocalVariant {
    size: string;
    concentration: string;
    price: string;
    stock: string;
    sku: string;
  }
  const [tempVariants, setTempVariants] = useState<LocalVariant[]>([]);
  
  // Estado para la variante que se está editando actualmente en el formulario
  const [varSize, setVarSize] = useState('100ml');
  const [varConcentration, setVarConcentration] = useState('Eau de Parfum');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('10');
  const [varSku, setVarSku] = useState('');
  
  // Estado de envío (guardado)
  const [saving, setSaving] = useState(false);

  const handleCreateProduct = async () => {
    // Validar datos básicos del producto
    if (!newProductName.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor ingresa el nombre del perfume.');
      return;
    }
    if (!newProductBrand.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor ingresa la marca del perfume.');
      return;
    }
    if (!newProductDescription.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor proporciona una breve descripción.');
      return;
    }
    if (!newProductCategory.trim()) {
      Alert.alert('Datos Incompletos', 'Por favor ingresa la categoría del perfume.');
      return;
    }

    // Preparar lista final de variantes
    let finalVariants: any[] = [...tempVariants];

    // Si la lista de variantes temporales está vacía, validar y usar la variante del formulario actual
    if (finalVariants.length === 0) {
      if (!varPrice.trim() || isNaN(Number(varPrice)) || Number(varPrice) <= 0) {
        Alert.alert('Variante Requerida', 'Debes añadir al menos una variante con un precio válido.');
        return;
      }
      if (!varStock.trim() || isNaN(Number(varStock)) || Number(varStock) < 0) {
        Alert.alert('Variante Requerida', 'Debes ingresar un stock inicial válido (0 o más) para la variante.');
        return;
      }
      finalVariants.push({
        size: varSize.trim(),
        concentration: varConcentration.trim(),
        price: Number(varPrice),
        stock: Number(varStock),
        sku: varSku.trim() || undefined
      });
    }

    try {
      setSaving(true);
      console.log('📡 Registrando nuevo producto en Supabase...', {
        name: newProductName,
        brand: newProductBrand,
        variants: finalVariants
      });

      const body = {
        name: newProductName.trim(),
        brand: newProductBrand.trim(),
        description: newProductDescription.trim(),
        category: newProductCategory.trim(),
        gender: newProductGender,
        imageUrl: newProductImageUrl.trim() || undefined,
        variants: finalVariants
      };

      await apiClient.post('/admin/products', body, userToken || undefined);

      Alert.alert('Éxito', '¡El perfume y sus variantes fueron creados con éxito absoluto!');
      
      // Cerrar modal y limpiar campos
      setCreateModalVisible(false);
      resetForm();
      
      // Recargar lista de productos
      fetchProducts();
    } catch (error: any) {
      console.error('[Error al crear producto]:', error);
      Alert.alert('Error al registrar', error.message || 'No se pudo crear el perfume.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewProductName('');
    setNewProductBrand('');
    setNewProductDescription('');
    setNewProductCategory('');
    setNewProductGender('unisex');
    setNewProductImageUrl('');
    setTempVariants([]);
    setVarSize('100ml');
    setVarConcentration('Eau de Parfum');
    setVarPrice('');
    setVarStock('10');
    setVarSku('');
  };

  const handleAddTempVariant = () => {
    if (!varPrice.trim() || isNaN(Number(varPrice)) || Number(varPrice) <= 0) {
      Alert.alert('Variante Inválida', 'Por favor ingresa un precio válido mayor a 0.');
      return;
    }
    if (!varStock.trim() || isNaN(Number(varStock)) || Number(varStock) < 0) {
      Alert.alert('Variante Inválida', 'Por favor ingresa un stock inicial válido (0 o más).');
      return;
    }

    const newVar: LocalVariant = {
      size: varSize.trim(),
      concentration: varConcentration.trim(),
      price: varPrice.trim(),
      stock: varStock.trim(),
      sku: varSku.trim()
    };

    setTempVariants(prev => [...prev, newVar]);
    
    // Limpiar campos de variante para la siguiente, dejando valores predeterminados comunes
    setVarSize('100ml');
    setVarConcentration('Eau de Parfum');
    setVarPrice('');
    setVarStock('10');
    setVarSku('');
  };

  const handleRemoveTempVariant = (index: number) => {
    setTempVariants(prev => prev.filter((_, i) => i !== index));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('[Error al obtener productos]:', error);
      Alert.alert('Error', 'No se pudieron recuperar los productos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, variantId: string, currentStock: number, change: number) => {
    const newStock = currentStock + change;
    if (newStock < 0) return; // Evitar stocks negativos

    // Actualización optimista de la UI local
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          variants: p.variants.map(v => v.id === variantId ? { ...v, stock: newStock } : v)
        };
      }
      return p;
    }));

    try {
      setUpdatingId(variantId);
      console.log(`📦 Actualizando stock de variante ${variantId} en Supabase a ${newStock}...`);
      await apiClient.put(`/admin/products/variants/${variantId}/stock`, { stock: newStock }, userToken || undefined);
    } catch (error: any) {
      console.error('[Error al actualizar stock]:', error);
      Alert.alert('Error de Red', error.message || 'No se pudo guardar la actualización de stock.');
      
      // Revertir cambio si falla
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map(v => v.id === variantId ? { ...v, stock: currentStock } : v)
          };
        }
        return p;
      }));
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Inventario Fino</Text>
          <Text style={styles.headerSubtitle}>Gestión de stock de perfumes de lujo</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => setCreateModalVisible(true)}
          style={styles.createButton}
        >
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>CARGANDO CATÁLOGO...</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productMainInfo}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>N</Text>
                  </View>
                )}
                <View style={styles.infoCol}>
                  <Text style={styles.brandText}>{item.brand.toUpperCase()}</Text>
                  <Text style={styles.nameText}>{item.name}</Text>
                  <Text style={styles.categoryText}>{item.category} · {item.gender === 'men' ? 'Él' : item.gender === 'women' ? 'Ella' : 'Unisex'}</Text>
                </View>
              </View>

              <View style={styles.variantsTitleRow}>
                <Text style={styles.variantsTitle}>Variantes & Stock</Text>
              </View>

              {/* Mapear Variantes de forma interactiva */}
              {item.variants.map((v) => {
                const isUpdating = updatingId === v.id;
                return (
                  <View key={v.id} style={styles.variantRow}>
                    <View style={styles.variantDetails}>
                      <Text style={styles.variantSku}>{v.sku}</Text>
                      <Text style={styles.variantAttr}>
                        {v.size || 'Unico'} · {v.concentration || 'Esencia'}
                      </Text>
                      <Text style={styles.variantPrice}>S/. {v.price.toFixed(2)}</Text>
                    </View>

                    <View style={styles.stockController}>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        disabled={v.stock <= 0 || isUpdating}
                        onPress={() => handleUpdateStock(item.id, v.id, v.stock, -1)}
                        style={[styles.stockBtn, v.stock <= 0 && styles.stockBtnDisabled]}
                      >
                        <Text style={styles.stockBtnText}>-</Text>
                      </TouchableOpacity>

                      {isUpdating ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} style={styles.stockSpinner} />
                      ) : (
                        <Text style={[
                          styles.stockCount, 
                          v.stock <= 5 ? styles.criticalStock : styles.normalStock
                        ]}>
                          {v.stock}
                        </Text>
                      )}

                      <TouchableOpacity 
                        activeOpacity={0.7}
                        disabled={isUpdating}
                        onPress={() => handleUpdateStock(item.id, v.id, v.stock, 1)}
                        style={styles.stockBtn}
                      >
                        <Text style={styles.stockBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube" size={48} color={theme.colors.border} />
          <Text style={styles.emptyTitle}>Catálogo Vacío</Text>
          <Text style={styles.emptySubtitle}>No se encontraron perfumes registrados en este momento.</Text>
        </View>
      )}

      {/* Modal de Creación de Producto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => {
          setCreateModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Perfume Premium</Text>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Sección 1: Datos Generales */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Detalles del Perfume</Text>
              </View>

              <Text style={styles.inputLabel}>Nombre del Perfume *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Black Orchid, Noir Extreme..."
                placeholderTextColor={theme.colors.textMuted}
                value={newProductName}
                onChangeText={setNewProductName}
              />

              <Text style={styles.inputLabel}>Marca *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Tom Ford, Chanel, Creed..."
                placeholderTextColor={theme.colors.textMuted}
                value={newProductBrand}
                onChangeText={setNewProductBrand}
              />

              <Text style={styles.inputLabel}>Descripción del Perfume *</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe las notas aromáticas de salida, corazón y fondo..."
                placeholderTextColor={theme.colors.textMuted}
                multiline={true}
                numberOfLines={3}
                value={newProductDescription}
                onChangeText={setNewProductDescription}
              />

              <Text style={styles.inputLabel}>Categoría *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Orientales, Amaderados, Cítricos..."
                placeholderTextColor={theme.colors.textMuted}
                value={newProductCategory}
                onChangeText={setNewProductCategory}
              />
              {/* Sugerencias Rápidas de Categoría */}
              <View style={styles.pillRow}>
                {['Orientales', 'Amaderados', 'Cítricos', 'Florales', 'Frutales'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    onPress={() => setNewProductCategory(cat)}
                    style={[styles.pill, newProductCategory === cat && styles.activePill]}
                  >
                    <Text style={[styles.pillText, newProductCategory === cat && styles.activePillText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Género *</Text>
              <View style={styles.genderRow}>
                {(['men', 'women', 'unisex'] as const).map((g) => {
                  const label = g === 'men' ? 'Él' : g === 'women' ? 'Ella' : 'Unisex';
                  const active = newProductGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      activeOpacity={0.7}
                      onPress={() => setNewProductGender(g)}
                      style={[styles.genderBtn, active && styles.activeGenderBtn]}
                    >
                      <Text style={[styles.genderBtnText, active && styles.activeGenderBtnText]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>URL de Imagen del Perfume (Opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://ejemplo.com/imagen.jpg"
                placeholderTextColor={theme.colors.textMuted}
                value={newProductImageUrl}
                onChangeText={setNewProductImageUrl}
                autoCapitalize="none"
              />

              <View style={styles.dividerLine} />

              {/* Sección 2: Agregar Variante */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="pricetags" size={16} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Variantes & Inventario</Text>
              </View>

              {/* Lista Temporal de Variantes Añadidas */}
              {tempVariants.length > 0 && (
                <View style={styles.tempVariantsContainer}>
                  <Text style={styles.tempVariantsSub}>Variantes a registrar ({tempVariants.length}):</Text>
                  {tempVariants.map((item, idx) => (
                    <View key={idx} style={styles.tempVariantItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tempVariantText}>
                          {item.size} · {item.concentration}
                        </Text>
                        <Text style={styles.tempVariantSubtext}>
                          Precio: S/. {parseFloat(item.price).toFixed(2)} | Stock: {item.stock} {item.sku ? `| SKU: ${item.sku}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemoveTempVariant(idx)}
                        style={styles.tempVariantDelete}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.variantFormContainer}>
                <Text style={styles.variantFormTitle}>Configurar Variante</Text>

                <Text style={styles.inputLabelSmall}>Tamaño *</Text>
                <TextInput
                  style={styles.textInputSmall}
                  placeholder="Ej. 100ml, 50ml..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={varSize}
                  onChangeText={setVarSize}
                />
                <View style={styles.pillRow}>
                  {['50ml', '100ml', '200ml'].map((sz) => (
                    <TouchableOpacity
                      key={sz}
                      activeOpacity={0.7}
                      onPress={() => setVarSize(sz)}
                      style={[styles.pill, varSize === sz && styles.activePill]}
                    >
                      <Text style={[styles.pillText, varSize === sz && styles.activePillText]}>{sz}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabelSmall}>Concentración *</Text>
                <TextInput
                  style={styles.textInputSmall}
                  placeholder="Ej. Eau de Parfum, Parfum..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={varConcentration}
                  onChangeText={setVarConcentration}
                />
                <View style={styles.pillRow}>
                  {['Eau de Parfum', 'Eau de Toilette', 'Parfum'].map((conc) => (
                    <TouchableOpacity
                      key={conc}
                      activeOpacity={0.7}
                      onPress={() => setVarConcentration(conc)}
                      style={[styles.pill, varConcentration === conc && styles.activePill]}
                    >
                      <Text style={[styles.pillText, varConcentration === conc && styles.activePillText]}>{conc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                    <Text style={styles.inputLabelSmall}>Precio (S/.) *</Text>
                    <TextInput
                      style={styles.textInputSmall}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={varPrice}
                      onChangeText={setVarPrice}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabelSmall}>Stock Inicial *</Text>
                    <TextInput
                      style={styles.textInputSmall}
                      placeholder="10"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={varStock}
                      onChangeText={setVarStock}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabelSmall}>SKU (Opcional)</Text>
                <TextInput
                  style={styles.textInputSmall}
                  placeholder="Ej. TF-BLORQ-100-EDP"
                  placeholderTextColor={theme.colors.textMuted}
                  value={varSku}
                  onChangeText={setVarSku}
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleAddTempVariant}
                  style={styles.addVariantButton}
                >
                  <Ionicons name="add" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.addVariantButtonText}>Añadir a la lista de variantes</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: theme.spacing.xxl }} />
            </ScrollView>

            {/* Footer del Modal */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={saving}
                onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={saving}
                onPress={handleCreateProduct}
                style={[styles.saveBtn, saving && styles.disabledBtn]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0D0D0D" />
                ) : (
                  <Text style={styles.saveBtnText}>Registrar Perfume</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTextContainer: {
    flex: 1,
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
  loaderContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
    marginTop: theme.spacing.md,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  productMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 58,
    height: 68,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    marginRight: theme.spacing.md,
  },
  imagePlaceholder: {
    width: 58,
    height: 68,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  placeholderText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 20,
    color: theme.colors.primaryTransparent,
    fontWeight: theme.typography.weights.bold,
  },
  infoCol: {
    flex: 1,
  },
  brandText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 1,
  },
  nameText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 2,
  },
  categoryText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  variantsTitleRow: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    marginTop: theme.spacing.md,
    paddingTop: 8,
    marginBottom: theme.spacing.sm,
  },
  variantsTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  variantDetails: {
    flex: 1,
  },
  variantSku: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  variantAttr: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  variantPrice: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 2,
  },
  stockController: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBtnDisabled: {
    opacity: 0.35,
  },
  stockBtnText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  stockCount: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    width: 32,
    textAlign: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  normalStock: {
    color: theme.colors.textPrimary,
  },
  criticalStock: {
    color: '#EB5757', // Rojo para stock critico
  },
  stockSpinner: {
    width: 32,
    marginHorizontal: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginVertical: theme.spacing.sm,
  },
  emptySubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.bodyMedium,
  },
  createButton: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '90%',
    borderColor: theme.colors.border,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalScrollContent: {
    padding: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  inputLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: 6,
  },
  inputLabelSmall: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: 4,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    marginBottom: theme.spacing.md,
  },
  textInputSmall: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    marginBottom: theme.spacing.xs,
  },
  textAreaInput: {
    height: 72,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
    marginTop: -theme.spacing.xs,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  activePill: {
    backgroundColor: theme.colors.primaryTransparent,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  activePillText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  genderRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: 4,
  },
  activeGenderBtn: {
    backgroundColor: theme.colors.primaryTransparent,
    borderColor: theme.colors.primary,
  },
  genderBtnText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
  },
  activeGenderBtnText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  dividerLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  tempVariantsContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tempVariantsSub: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  tempVariantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tempVariantText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  tempVariantSubtext: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  tempVariantDelete: {
    padding: 6,
  },
  variantFormContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  variantFormTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryTransparent,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  addVariantButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  cancelBtnText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: '#0D0D0D',
    fontWeight: theme.typography.weights.bold,
  },
});
