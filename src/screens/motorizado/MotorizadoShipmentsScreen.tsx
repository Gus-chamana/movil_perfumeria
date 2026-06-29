import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StatusBar,
  ScrollView,
  RefreshControl
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Shipment {
  id: string;
  ordenId: string;
  trackingNumber: string;
  status: 'CREADO' | 'PREPARANDO' | 'EN_RUTA' | 'ENTREGADO';
  estimatedTime: string;
  address: string;
  receptor: string;
  receptorDni: string;
  total: number;
  clientName: string;
  clientPhone: string;
}

export default function MotorizadoShipmentsScreen() {
  const navigation = useNavigation<any>();
  const { userToken } = useAuth();
  
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchShipments = async () => {
    try {
      const data = await apiClient.get('/motorizado/shipments', userToken || undefined);
      setActiveShipments(data.active || []);
      setAvailableShipments(data.available || []);
    } catch (error) {
      console.error('[Error al cargar envíos]:', error);
      Alert.alert('Error', 'No se pudieron recuperar las bitácoras logísticas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchShipments();
  };

  const handleAcceptShipment = async (id: string, trackingNumber: string) => {
    Alert.alert(
      'Tomar Pedido',
      `¿Deseas asignarte el despacho del pedido "${trackingNumber}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceptar Pedido', 
          onPress: async () => {
            try {
              setProcessingId(id);
              await apiClient.post(`/motorizado/shipments/${id}/accept`, {}, userToken || undefined);
              Alert.alert('¡Asignado!', 'El pedido fue agregado a tu ruta activa.');
              fetchShipments();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo adjudicar el pedido.');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    let nextStatus: 'EN_RUTA' | 'ENTREGADO';
    let title: string;
    let message: string;

    if (currentStatus === 'PREPARANDO') {
      nextStatus = 'EN_RUTA';
      title = 'Iniciar Ruta';
      message = '¿Deseas marcar el pedido como "EN CAMINO A DESTINO"?';
    } else if (currentStatus === 'EN_RUTA') {
      nextStatus = 'ENTREGADO';
      title = 'Entregar Fragancia';
      message = '¿Confirmas la entrega en mano propia al cliente de forma satisfactoria?';
    } else {
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            setProcessingId(id);
            await apiClient.put(`/motorizado/shipments/${id}/status`, { newStatus: nextStatus }, userToken || undefined);
            Alert.alert('Éxito', `El estado fue actualizado a ${nextStatus}.`);
            fetchShipments();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el estado logístico.');
          } finally {
            setProcessingId(null);
          }
        }
      }
    ]);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Hangar Logístico</Text>
          <Text style={styles.headerSubtitle}>Bitácora de despachos Noir Essence</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleRefresh}
          style={styles.refreshIconBtn}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>RESCATANDO BITÁCORAS...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* 1. Entregas Activas en Ruta */}
          <Text style={styles.sectionTitle}>Entregas en Progreso ({activeShipments.length})</Text>
          
          {activeShipments.length > 0 ? (
            activeShipments.map((item) => {
              const isProcessing = processingId === item.id;
              return (
                <View key={item.id} style={styles.activeCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.trackingBadge}>
                      <Text style={styles.trackingText}>{item.trackingNumber}</Text>
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      item.status === 'EN_RUTA' ? styles.badgeEnRuta : styles.badgePrep
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        item.status === 'EN_RUTA' ? styles.badgeEnRutaText : styles.badgePrepText
                      ]}>
                        {item.status === 'EN_RUTA' ? 'En Camino 🏍️' : 'En Tienda 📦'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailsBlock}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={14} color={theme.colors.primary} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {item.clientName} (Receptor: {item.receptor})
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="pin-outline" size={14} color={theme.colors.primary} />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {item.address}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="card-outline" size={14} color={theme.colors.primary} />
                      <Text style={styles.detailText}>
                        Total a cobrar / validado: <Text style={styles.priceGold}>S/. {item.total.toFixed(2)}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    {/* Botón Ver Ruta */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('MotorizadoRouteTab', { shipmentId: item.id })}
                      style={styles.btnSecondary}
                    >
                      <Ionicons name="navigate-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.btnSecondaryText}>Mapa de Ruta</Text>
                    </TouchableOpacity>

                    {/* Botón Cambiar Estado */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={isProcessing}
                      onPress={() => handleUpdateStatus(item.id, item.status)}
                      style={[
                        styles.btnPrimary,
                        item.status === 'EN_RUTA' ? styles.btnSuccess : styles.btnActiveRoute
                      ]}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color={theme.colors.background} />
                      ) : (
                        <>
                          <Ionicons 
                            name={item.status === 'EN_RUTA' ? "checkmark-circle-outline" : "bicycle-outline"} 
                            size={16} 
                            color={theme.colors.background} 
                          />
                          <Text style={styles.btnPrimaryText}>
                            {item.status === 'EN_RUTA' ? 'Entregado' : 'Iniciar Ruta'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color={theme.colors.border} />
              <Text style={styles.emptyCardText}>No tienes entregas activas asignadas.</Text>
            </View>
          )}

          {/* 2. Pedidos Disponibles en Lima */}
          <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>
            Pedidos Disponibles para Despacho ({availableShipments.length})
          </Text>

          {availableShipments.length > 0 ? (
            availableShipments.map((item) => {
              const isProcessing = processingId === item.id;
              return (
                <View key={item.id} style={styles.availableCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.trackingTextAvailable}>{item.trackingNumber}</Text>
                    <Text style={styles.timeBadge}>{item.estimatedTime}</Text>
                  </View>
                  <Text style={styles.addressAvailable}>{item.address}</Text>
                  <Text style={styles.clientAvailable}>Cliente: {item.clientName}</Text>
                  <Text style={styles.totalAvailable}>Monto Pedido: S/. {item.total.toFixed(2)}</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isProcessing}
                    onPress={() => handleAcceptShipment(item.id, item.trackingNumber)}
                    style={styles.btnAccept}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={theme.colors.background} />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={16} color={theme.colors.background} />
                        <Text style={styles.btnAcceptText}>Tomar Despacho</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="hourglass-outline" size={32} color={theme.colors.border} />
              <Text style={styles.emptyCardText}>No hay pedidos unificados listos para despachar en tienda.</Text>
            </View>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
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
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  activeCard: {
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(212, 175, 55, 0.25)', // Borde de oro sutil para rutas activas
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingBadge: {
    backgroundColor: theme.colors.primaryTransparent,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  trackingText: {
    fontFamily: theme.typography.fontFamily.mono,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
  },
  badgePrep: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  badgePrepText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeEnRuta: {
    backgroundColor: 'rgba(56, 178, 172, 0.08)',
  },
  badgeEnRutaText: {
    color: '#38B2AC',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailsBlock: {
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  priceGold: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  btnSecondary: {
    flex: 1,
    height: 38,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondaryText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  btnPrimary: {
    flex: 1.2,
    height: 38,
    borderRadius: theme.borderRadius.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnActiveRoute: {
    backgroundColor: theme.colors.primary,
  },
  btnSuccess: {
    backgroundColor: '#38B2AC', // Teal elegante para entrega exitosa
  },
  btnPrimaryText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  availableCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  trackingTextAvailable: {
    fontFamily: theme.typography.fontFamily.mono,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  timeBadge: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: theme.borderRadius.xs,
  },
  addressAvailable: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  clientAvailable: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  totalAvailable: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  btnAccept: {
    height: 36,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: theme.spacing.md,
  },
  btnAcceptText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  emptyCardText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
