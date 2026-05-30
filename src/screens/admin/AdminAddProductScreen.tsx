import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { CustomInput } from '../../components/CustomInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useData } from '../../context/DataContext';

const CATEGORY_OPTIONS = ['Amaderados', 'Orientales', 'Florales', 'Cítricos'];
const GENDER_OPTIONS = [
  { label: 'Hombre', value: 'men' },
  { label: 'Mujer', value: 'women' },
  { label: 'Unisex', value: 'unisex' }
];
const SIZE_OPTIONS = ['50ml', '100ml', '200ml'];
const CONCENTRATION_OPTIONS = ['Eau de Parfum', 'Parfum', 'Eau de Toilette'];

export default function AdminAddProductScreen() {
  const { addProduct } = useData();

  // Estados de Formulario
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Noir Essence');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Amaderados');
  const [gender, setGender] = useState('unisex');
  const [size, setSize] = useState('100ml');
  const [concentration, setConcentration] = useState('Eau de Parfum');
  const [description, setDescription] = useState('');

  // Errores
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [descError, setDescError] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleCreateProduct = async () => {
    let valid = true;
    setNameError('');
    setPriceError('');
    setDescError('');

    if (!name.trim()) {
      setNameError('El nombre de la fragancia es obligatorio.');
      valid = false;
    }

    const priceNum = parseFloat(price);
    if (!price) {
      setPriceError('El precio es obligatorio.');
      valid = false;
    } else if (isNaN(priceNum) || priceNum <= 0) {
      setPriceError('El precio debe ser un número válido mayor a 0.');
      valid = false;
    }

    if (!description.trim()) {
      setDescError('La descripción es obligatoria.');
      valid = false;
    } else if (description.length < 15) {
      setDescError('Introduce una descripción de al menos 15 caracteres.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      // Añadir al catálogo reactivo global y base de datos de Supabase
      await addProduct({
        brand,
        name,
        price: priceNum,
        category: category as any,
        gender: gender as any,
        size: size as any,
        concentration: concentration as any,
        isNew: true,
        description
      });

      setLoading(false);
      Alert.alert(
        'Fragancia Creada',
        `El perfume "${name}" (${brand}) ha sido añadido con éxito al catálogo Noir en la familia ${category} por S/. ${priceNum.toFixed(2)}.`
      );
      // Limpiar Formulario
      setName('');
      setPrice('');
      setDescription('');
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear la fragancia en el catálogo de Supabase.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva Fragancia</Text>
        <Text style={styles.headerSubtitle}>Publicar perfume de alta costura en el catálogo</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.formCard}>
            
            {/* 1. Nombre de Fragancia */}
            <CustomInput
              label="Nombre del Perfume"
              placeholder="Ej. Sillage Royal"
              value={name}
              onChangeText={setName}
              error={nameError}
            />

            {/* 2. Marca */}
            <CustomInput
              label="Marca"
              placeholder="Noir Essence"
              value={brand}
              onChangeText={setBrand}
            />

            {/* 3. Precio */}
            <CustomInput
              label="Precio (S/.)"
              placeholder="Ej. 350.00"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              error={priceError}
            />

            {/* 4. Familia Olfativa (Pills) */}
            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Familia Olfativa</Text>
              <View style={styles.pillsRow}>
                {CATEGORY_OPTIONS.map((opt) => {
                  const isActive = category === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => setCategory(opt)}
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

            {/* 5. Género (Pills) */}
            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Género</Text>
              <View style={styles.pillsRow}>
                {GENDER_OPTIONS.map((opt) => {
                  const isActive = gender === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.8}
                      onPress={() => setGender(opt.value)}
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

            {/* 6. Tamaño (Pills) */}
            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Tamaño</Text>
              <View style={styles.pillsRow}>
                {SIZE_OPTIONS.map((opt) => {
                  const isActive = size === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => setSize(opt)}
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

            {/* 7. Concentración (Pills) */}
            <View style={styles.selectGroup}>
              <Text style={styles.selectLabel}>Concentración</Text>
              <View style={styles.pillsRow}>
                {CONCENTRATION_OPTIONS.map((opt) => {
                  const isActive = concentration === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.8}
                      onPress={() => setConcentration(opt)}
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

            {/* 8. Descripción */}
            <CustomInput
              label="Descripción de la Fragancia"
              placeholder="Describe las notas de salida, corazón y fondo..."
              multiline={true}
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              error={descError}
            />

            {/* Botón de Creación */}
            <LuxuryButton
              title="Crear Fragancia"
              onPress={handleCreateProduct}
              loading={loading}
              style={styles.submitBtn}
            />

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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1 - 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  selectGroup: {
    marginBottom: theme.spacing.lg,
  },
  selectLabel: {
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
  submitBtn: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
});
