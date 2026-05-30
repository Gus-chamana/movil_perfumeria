import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StatusBar,
  Linking,
  Platform
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function MotorizadoRouteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userToken } = useAuth();
  
  const shipmentId = route.params?.shipmentId;
  
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchActiveRoute = async () => {
    try {
      setLoading(true);
      // Obtener todos los envíos para ver cuál está activo si no nos pasan un ID específico
      const data = await apiClient.get('/motorizado/shipments', userToken || undefined);
      const active = data.active || [];
      
      let targetShipment = null;
      if (shipmentId) {
        targetShipment = active.find((s: any) => s.id === shipmentId);
      } else if (active.length > 0) {
        targetShipment = active[0]; // Tomar el primero activo por defecto
      }

      if (targetShipment) {
        setShipment(targetShipment);
      } else {
        setShipment(null);
      }
    } catch (error) {
      console.error('[Error al cargar ruta]:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallClient = () => {
    if (!shipment?.clientPhone) return;
    Linking.openURL(`tel:${shipment.clientPhone}`);
  };

  const handleOpenMaps = () => {
    if (!shipment?.address) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(shipment.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(shipment.address)}`
    });
    if (url) Linking.openURL(url);
  };

  const handleTriggerAction = async () => {
    if (!shipment) return;
    
    let nextStatus: 'EN_RUTA' | 'ENTREGADO';
    let title: string;
    let message: string;

    if (shipment.status === 'PREPARANDO') {
      nextStatus = 'EN_RUTA';
      title = 'Iniciar Navegación';
      message = '¿Confirmas que estás saliendo en ruta de entrega hacia el domicilio?';
    } else if (shipment.status === 'EN_RUTA') {
      nextStatus = 'ENTREGADO';
      title = 'Confirmar Entrega';
      message = '¿Confirmas la entrega del perfume de lujo Noir Essence al receptor autorizado?';
    } else {
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceptar',
        onPress: async () => {
          try {
            setUpdating(true);
            await apiClient.put(`/motorizado/shipments/${shipment.id}/status`, { newStatus: nextStatus }, userToken || undefined);
            Alert.alert('¡Excelente!', `Despacho actualizado a: ${nextStatus}`);
            fetchActiveRoute();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo guardar la actualización.');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

  useEffect(() => {
    fetchActiveRoute();
  }, [shipmentId]);

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
          <Text style={styles.headerTitle}>Ruta Concierge</Text>
          <Text style={styles.headerSubtitle}>Navegación premium y entrega en puerta</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>CALCULANDO RUTA MÁS RÁPIDA...</Text>
        </View>
      ) : shipment ? (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Mockup del Mapa Premium */}
          <View style={styles.mapMockup}>
            <View style={styles.mapOverlay}>
              <View style={styles.badgeRouteTime}>
                <Ionicons name="time" size={12} color={theme.colors.background} />
                <Text style={styles.badgeRouteTimeText}>Tránsito: {shipment.estimatedTime}</Text>
              </View>
            </View>
            
            {/* Elementos simulados del mapa */}
            <View style={styles.routeDotStart}>
              <View style={styles.routeDotInner} />
            </View>
            <View style={styles.routePathLine} />
            <View style={styles.routeDotEnd}>
              <Ionicons name="pin" size={16} color="#EB5757" />
            </View>

            <Text style={styles.mapBrandWatermark}>NOIR CONCIERGE NAVIGATION</Text>
          </View>

          {/* Ficha de Detalles de la Entrega */}
          <View style={styles.detailsCard}>
            <Text style={styles.trackingNumberLabel}>PEDIDO DESPACHO: {shipment.trackingNumber}</Text>
            
            <View style={styles.clientSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {shipment.receptor ? shipment.receptor.substring(0, 2).toUpperCase() : 'NE'}
                </Text>
              </View>
              <View style={styles.clientMeta}>
                <Text style={styles.clientLabel}>Destinatario / Receptor</Text>
                <Text style={styles.clientName}>{shipment.receptor}</Text>
                <Text style={styles.clientPhoneText}>Teléfono: {shipment.clientPhone}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.addressBlock}>
              <Text style={styles.infoTitle}>Dirección de Entrega</Text>
              <Text style={styles.addressText}>{shipment.address}</Text>
              <Text style={styles.dniText}>DNI Receptor: {shipment.receptorDni}</Text>
            </View>

            {/* Acciones de Enlace Externo */}
            <View style={styles.linksRow}>
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={handleCallClient}
                style={styles.btnSecondaryLink}
              >
                <Ionicons name="call" size={18} color={theme.colors.primary} />
                <Text style={styles.btnLinkText}>Llamar Cliente</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={handleOpenMaps}
                style={styles.btnSecondaryLink}
              >
                <Ionicons name="logo-google" size={18} color={theme.colors.primary} />
                <Text style={styles.btnLinkText}>Abrir GPS</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de Acción Principal */}
          {updating ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: theme.spacing.lg }} />
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTriggerAction}
              style={[
                styles.btnAction,
                shipment.status === 'EN_RUTA' ? styles.btnActionSuccess : styles.btnActionRoute
              ]}
            >
              <Ionicons 
                name={shipment.status === 'EN_RUTA' ? "checkmark-done-circle" : "compass"} 
                size={20} 
                color={theme.colors.background} 
              />
              <Text style={styles.btnActionText}>
                {shipment.status === 'EN_RUTA' ? 'Fragancia Entregada Satisfactoriamente' : 'Empezar Navegación Logística'}
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass" size={64} color={theme.colors.border} />
          <Text style={styles.emptyTitle}>Sin Ruta Activa</Text>
          <Text style={styles.emptySubtitle}>
            No tienes ninguna entrega en progreso actualmente. Ve al menú de "Envíos" para adjudicarte un pedido y trazar tu ruta.
          </Text>
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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  mapMockup: {
    height: 200,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  badgeRouteTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
  },
  badgeRouteTimeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  routeDotStart: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 40,
    top: 120,
  },
  routeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  routePathLine: {
    width: 160,
    height: 4,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    left: 50,
    top: 128,
    opacity: 0.6,
    transform: [{ rotate: '-20deg' }]
  },
  routeDotEnd: {
    position: 'absolute',
    right: 50,
    top: 60,
  },
  mapBrandWatermark: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 8,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
    marginBottom: theme.spacing.lg,
  },
  trackingNumberLabel: {
    fontFamily: theme.typography.fontFamily.mono,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  clientMeta: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  clientLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientName: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 2,
  },
  clientPhoneText: {
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
  addressBlock: {
    gap: 4,
  },
  infoTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    lineHeight: 18,
    marginTop: 2,
  },
  dniText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  linksRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  btnSecondaryLink: {
    flex: 1,
    height: 36,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnLinkText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  btnAction: {
    height: 46,
    borderRadius: theme.borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.md,
  },
  btnActionRoute: {
    backgroundColor: theme.colors.primary,
  },
  btnActionSuccess: {
    backgroundColor: '#38B2AC',
  },
  btnActionText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 12,
    color: theme.colors.background,
    fontWeight: 'bold',
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
});
