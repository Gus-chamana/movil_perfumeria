import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  Switch, 
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


interface Motorizado {
  id: string;
  nombre: string;
  telefono: string;
  placa: string;
  activo: boolean;
  email: string;
}

export default function AdminMotorizadosScreen() {
  const navigation = useNavigation();
  const { userToken } = useAuth();
  
  const [motorizados, setMotorizados] = useState<Motorizado[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modal de Edición de Motorizado
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMotorizado, setEditingMotorizado] = useState<Motorizado | null>(null);
  const [formTelefono, setFormTelefono] = useState('');
  const [formPlaca, setFormPlaca] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMotorizados = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/motorizados', userToken || undefined);
      setMotorizados(data);
    } catch (error) {
      console.error('[Error al obtener motorizados]:', error);
      Alert.alert('Error', 'No se pudieron recuperar los datos de los motorizados.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (motorizado: Motorizado) => {
    setEditingMotorizado(motorizado);
    setFormTelefono(motorizado.telefono || '');
    setFormPlaca(motorizado.placa || '');
    setModalVisible(true);
  };

  const handleSaveDetails = async () => {
    if (!formTelefono || !formPlaca) {
      Alert.alert('Campos Obligatorios', 'Por favor, completa todos los campos.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.put(`/admin/motorizados/${editingMotorizado?.id}`, {
        telefono: formTelefono.trim(),
        placa: formPlaca.trim()
      }, userToken || undefined);

      Alert.alert('¡Éxito!', 'Los datos del vehículo fueron actualizados.');
      setModalVisible(false);
      fetchMotorizados();
    } catch (error: any) {
      console.error('[Error al guardar detalles de motorizado]:', error);
      Alert.alert('Error', error.message || 'No se pudieron actualizar los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    
    // Actualización optimista local en UI
    setMotorizados(prev => prev.map(m => m.id === id ? { ...m, activo: nextStatus } : m));

    try {
      console.log(`🔌 Cambiando estado de motorizado ${id} a ${nextStatus}...`);
      await apiClient.put(`/admin/motorizados/${id}/status`, { activo: nextStatus }, userToken || undefined);
    } catch (error: any) {
      console.error('[Error al cambiar estado de motorizado]:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el cambio en el servidor.');
      // Revertir cambio local si falla la red
      setMotorizados(prev => prev.map(m => m.id === id ? { ...m, activo: currentStatus } : m));
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMotorizados();
    }, [])
  );

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
          <Text style={styles.headerTitle}>Gestión Logística</Text>
          <Text style={styles.headerSubtitle}>Estado de la flota de motorizados</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>CARGANDO FLOTA...</Text>
        </View>
      ) : motorizados.length > 0 ? (
        <FlatList
          data={motorizados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.courierCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarMini}>
                  <Ionicons name="bicycle" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.courierInfo}>
                  <Text style={styles.courierName}>{item.nombre}</Text>
                  <Text style={styles.courierEmail}>{item.email}</Text>
                </View>
                <Switch
                  value={item.activo}
                  onValueChange={() => handleToggleStatus(item.id, item.activo)}
                  trackColor={{ false: theme.colors.border, true: 'rgba(212, 175, 55, 0.4)' }}
                  thumbColor={item.activo ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailsRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Teléfono</Text>
                  <Text style={styles.detailVal}>{item.telefono || 'N/A'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Placa de Vehículo</Text>
                  <Text style={styles.detailVal}>{item.placa || 'PENDIENTE'}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditModal(item)}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
                  <Text style={styles.editButtonText}>Editar Datos</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bicycle" size={48} color={theme.colors.border} />
          <Text style={styles.emptyTitle}>Sin Flota Registrada</Text>
          <Text style={styles.emptySubtitle}>No hay motorizados registrados en este momento.</Text>
        </View>
      )}

      {/* MODAL: Editar Motorizado (Placa y Teléfono) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Motorizado</Text>
            <Text style={{ fontFamily: theme.typography.fontFamily.title, fontSize: 13, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, textAlign: 'center' }}>
              {editingMotorizado?.nombre}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Teléfono de Contacto</Text>
              <TextInput
                style={styles.formInput}
                value={formTelefono}
                onChangeText={setFormTelefono}
                placeholder="Ej. +51 987 654 321"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.formLabel}>Placa del Vehículo</Text>
              <TextInput
                style={styles.formInput}
                value={formPlaca}
                onChangeText={setFormPlaca}
                placeholder="Ej. MX-4842"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={submitting}
                onPress={() => setModalVisible(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={submitting}
                onPress={handleSaveDetails}
                style={styles.modalSaveButton}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.modalSaveText}>Guardar</Text>
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
  courierCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  courierInfo: {
    flex: 1,
  },
  courierName: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  courierEmail: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
    marginTop: 4,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    marginTop: theme.spacing.md,
    paddingTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  editButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  formLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.md,
    marginBottom: 4,
  },
  formInput: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.bodyMedium,
    fontFamily: theme.typography.fontFamily.body,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(235, 87, 87, 0.4)',
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: '#EB5757',
    fontWeight: theme.typography.weights.bold,
  },
  modalSaveButton: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: '#000000',
    fontWeight: theme.typography.weights.bold,
  },

});
