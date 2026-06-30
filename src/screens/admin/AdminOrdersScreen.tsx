import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useData, Order } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getMotorizadosAPI } from '../../services/apiService';

export default function AdminOrdersScreen() {
  const { orders, assignMotorizado } = useData();
  const { token } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'TODOS' | 'PENDIENTES' | 'ASIGNADOS'>('TODOS');
  
  // Estados para modal de asignación y lista de motorizados de la BD
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [motorizadosList, setMotorizadosList] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    const loadMotorizados = async () => {
      if (token) {
        try {
          const list = await getMotorizadosAPI(token);
          const mapped = list.map((m: any) => ({
            id: m.id,
            name: m.nombre
          }));
          setMotorizadosList(mapped);
        } catch (error) {
          console.warn('Error al cargar motorizados reales:', error);
          setMotorizadosList([
            { id: 'm1', name: 'Juan Motorizado (Offline)' },
            { id: 'm2', name: 'Pedro Delivery (Offline)' },
            { id: 'm3', name: 'Carlos Envíos (Offline)' },
          ]);
        }
      }
    };
    loadMotorizados();
  }, [token]);

  // Filtrado de órdenes
  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'TODOS') return true;
    if (selectedFilter === 'PENDIENTES') return order.motorizado === null;
    if (selectedFilter === 'ASIGNADOS') return order.motorizado !== null;
    return true;
  });

  const handleOpenAssign = (order: Order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
  };

  const handleSelectMotorizado = async (motorizadoId: string, motorizadoName: string) => {
    if (!selectedOrder) return;

    try {
      await assignMotorizado(selectedOrder.id, motorizadoId);

      setAssignModalVisible(false);
      setSelectedOrder(null);
      Alert.alert(
        'Asignación Exitosa', 
        `El pedido ${selectedOrder.id} ha sido asignado a ${motorizadoName} y su estado cambió a PREPARANDO.`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la asignación.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return styles.statusPendiente;
      case 'PREPARANDO':
        return styles.statusPreparando;
      case 'EN_RUTA':
        return styles.statusEnRuta;
      case 'ENTREGADO':
        return styles.statusEntregado;
      default:
        return styles.statusPendiente;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Órdenes</Text>
        <Text style={styles.headerSubtitle}>Asignación de despachos y control de envíos</Text>
      </View>

      {/* Selector de Filtros (Tabs de lujo) */}
      <View style={styles.tabBar}>
        {(['TODOS', 'PENDIENTES', 'ASIGNADOS'] as const).map((tab) => {
          const isActive = selectedFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setSelectedFilter(tab)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de Órdenes */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
              <Text style={styles.orderId}>{item.id}</Text>
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsBlock}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Cliente:</Text>
                <Text style={styles.val}>{item.clientName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Dirección:</Text>
                <Text numberOfLines={1} style={styles.val}>{item.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.val}>{item.date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Total Compra:</Text>
                <Text style={styles.priceVal}>S/. {item.total.toFixed(2)}</Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 4 }]}>
                <Text style={styles.label}>Despachador:</Text>
                <Text style={[styles.val, item.motorizado ? styles.goldText : styles.unassignedText]}>
                  {item.motorizado || 'Por asignar'}
                </Text>
              </View>
            </View>

            {/* Acciones del Admin */}
            {!item.motorizado && (
              <LuxuryButton
                title="Asignar Motorizado"
                size="small"
                onPress={() => handleOpenAssign(item)}
                style={styles.assignBtn}
              />
            )}
          </View>
        )}
      />

      {/* Modal de Asignación de Despachador */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={assignModalVisible}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar Despachador</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona el motorizado para despachar el pedido {selectedOrder?.id}.
            </Text>

            <View style={styles.modalList}>
              {motorizadosList.map((moto) => (
                <TouchableOpacity
                  key={moto.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelectMotorizado(moto.id, moto.name)}
                  style={styles.motoSelectItem}
                >
                  <Text style={styles.motoSelectName}>{moto.name}</Text>
                  <Text style={styles.motoSelectArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAssignModalVisible(false)}
              style={styles.cancelModalBtn}
            >
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  statusPendiente: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: '#FF9800',
    color: '#FF9800',
  },
  statusPreparando: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196F3',
    color: '#2196F3',
  },
  statusEnRuta: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: '#9C27B0',
    color: '#9C27B0',
  },
  statusEntregado: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailsBlock: {
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
  },
  val: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  priceVal: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  goldText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  unassignedText: {
    color: '#FF9800',
    fontStyle: 'italic',
  },
  assignBtn: {
    marginTop: theme.spacing.md,
    alignSelf: 'stretch',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 16,
  },
  modalList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  motoSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  motoSelectName: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  motoSelectArrow: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  cancelModalBtn: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
  },
  cancelModalText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    textDecorationLine: 'underline',
  },
});
