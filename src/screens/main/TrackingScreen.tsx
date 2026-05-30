import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { theme } from '../../theme/theme';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';
import { useAuth } from '../../context/AuthContext';
import { getOrderByIdAPI } from '../../services/apiService';

type TrackingScreenRouteProp = RouteProp<RootStackParamList, 'Tracking'>;
type TrackingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tracking'>;

export default function TrackingScreen() {
  const route = useRoute<TrackingScreenRouteProp>();
  const navigation = useNavigation<TrackingScreenNavigationProp>();
  const { token } = useAuth();
  
  // Capturar el ID del pedido generado o por defecto
  const orderId = route.params?.orderId || 'NE-49201';
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOrderByIdAPI(orderId, token);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.warn('Error cargando tracking real:', err);
        setError('No se pudo conectar al servidor de Supabase. Mostrando fallback.');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
    // Consulta en segundo plano cada 10 segundos
    const interval = setInterval(loadOrderData, 10000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  const handleReturnHome = () => {
    navigation.replace('Main');
  };

  // Fallback local en caso de error o de no estar logueado
  const getFallbackOrder = () => {
    return {
      id: orderId,
      direccionEnvio: 'Av. Javier Prado Este 1024, San Borja, Lima',
      estado: 'CREADO',
      envio: {
        numeroTracking: 'NX-1934',
        tiempoEstimado: '30-50 min',
        motorizado: null,
        estados: []
      }
    };
  };

  const activeOrder = order || getFallbackOrder();

  // Mapear los estados del backend a la bitácora del envío
  const getTimelineFromOrder = (ord: any) => {
    const currentStatus = ord.estado; // 'CREADO' | 'PREPARANDO' | 'EN_RUTA' | 'ENTREGADO'

    const getStatusTime = (status: string) => {
      const found = ord.envio?.estados?.find((e: any) => e.estado === status);
      if (found) {
        const d = new Date(found.fecha);
        const hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hours % 12 || 12}:${minutes} ${ampm}`;
      }
      if (status === 'CREADO' && ord.createdAt) {
        const d = new Date(ord.createdAt);
        return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
      }
      return 'Estimado';
    };

    return [
      {
        title: 'Pedido Confirmado',
        time: getStatusTime('CREADO'),
        description: 'Tu transacción ha sido validada de forma exitosa en Supabase.',
        status: 'completed' as const,
      },
      {
        title: 'Preparación y Embalaje de Lujo',
        time: getStatusTime('PREPARANDO') !== 'Estimado' ? getStatusTime('PREPARANDO') : (currentStatus === 'PREPARANDO' ? 'En proceso' : 'Estimado'),
        description: 'Tu fragancia premium está siendo sellada y empacada con envoltura protectora.',
        status: currentStatus === 'CREADO' ? 'pending' : (currentStatus === 'PREPARANDO' ? 'active' : 'completed') as any,
      },
      {
        title: 'En Camino a tu Destino',
        time: getStatusTime('EN_RUTA'),
        description: ord.envio?.motorizado 
          ? `Asignado a ${ord.envio.motorizado.nombre}. El motorizado exclusivo va en ruta.` 
          : 'Esperando asignación de motorizado del conserje.',
        status: (currentStatus === 'CREADO' || currentStatus === 'PREPARANDO') ? 'pending' : (currentStatus === 'EN_RUTA' ? 'active' : 'completed') as any,
      },
      {
        title: 'Entrega en Puerta',
        time: getStatusTime('ENTREGADO'),
        description: 'Fragancia entregada de manera exitosa en mano propia.',
        status: currentStatus === 'ENTREGADO' ? 'completed' : 'pending' as any,
      },
    ];
  };

  const TIMELINE_EVENTS = getTimelineFromOrder(activeOrder);

  if (loading && !order) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Conectando con Supabase...</Text>
      </SafeAreaView>
    );
  }

  const motorizadoNombre = activeOrder.envio?.motorizado?.nombre;
  const motorizadoTelefono = activeOrder.envio?.motorizado?.telefono;
  const placaVehiculo = activeOrder.envio?.motorizado?.placaVehiculo;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>SEGUIMIENTO EN TIEMPO REAL</Text>
        <Text style={styles.orderIdText}>{activeOrder.envio?.numeroTracking || orderId}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* 1. Datos del Despachador / Motorizado (Tarjeta Flotante Premium) */}
        <View style={styles.dispatcherCard}>
          <View style={styles.dispatcherInfoRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarCircleText}>
                {motorizadoNombre ? motorizadoNombre.split(' ').map((n: any) => n[0]).join('').toUpperCase() : 'NE'}
              </Text>
            </View>
            <View style={styles.dispatcherMeta}>
              <Text style={styles.driverName}>{motorizadoNombre || 'Por asignar despachador'}</Text>
              <Text style={styles.vehicleType}>
                {motorizadoNombre 
                  ? `Repartidor Noir Conciérge · Tel: ${motorizadoTelefono || 'N/A'}` 
                  : 'Tu pedido está en proceso de facturación y embalaje.'}
              </Text>
            </View>
            <View style={styles.plateBadge}>
              <Text style={styles.plateText}>{placaVehiculo || '---'}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.deliveryLabel}>Dirección de Entrega</Text>
          <Text style={styles.deliveryAddress}>
            {activeOrder.direccionEnvio}
          </Text>
        </View>

        {/* 2. Línea de Tiempo Vertical Interactiva */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Bitácora del Envío</Text>
          
          <View style={styles.timelineWrapper}>
            {TIMELINE_EVENTS.map((event, index) => {
              const isLast = index === TIMELINE_EVENTS.length - 1;
              const isCompleted = event.status === 'completed';
              const isActive = event.status === 'active';
              
              return (
                <View key={index} style={styles.timelineRow}>
                  {/* Indicador y Línea de Conexión Vertical */}
                  <View style={styles.timelineIndicatorColumn}>
                    {/* Punto del evento */}
                    <View style={[
                      styles.timelineNode,
                      isCompleted && styles.nodeCompleted,
                      isActive && styles.nodeActive,
                    ]}>
                      {isActive && <View style={styles.pulseInner} />}
                    </View>
                    
                    {/* Línea conectora */}
                    {!isLast && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.lineCompleted
                      ]} />
                    )}
                  </View>

                  {/* Cuerpo del Evento */}
                  <View style={styles.eventBody}>
                    <View style={styles.eventHeaderRow}>
                      <Text style={[
                        styles.eventTitleText,
                        isActive && styles.eventTitleTextActive,
                      ]}>
                        {event.title}
                      </Text>
                      <Text style={[
                        styles.eventTimeText,
                        isActive && styles.eventTimeTextActive
                      ]}>
                        {event.time}
                      </Text>
                    </View>
                    <Text style={styles.eventDescText}>
                      {event.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 3. Acción de Retorno al Menú Principal */}
        <LuxuryButton
          title="Volver al Inicio"
          variant="outline"
          onPress={handleReturnHome}
          style={styles.returnBtn}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.bodyMedium,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorBannerText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  orderIdText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  dispatcherCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
    marginBottom: theme.spacing.lg,
  },
  dispatcherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primaryTransparent,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircleText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  dispatcherMeta: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  driverName: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  vehicleType: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  plateBadge: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  plateText: {
    fontFamily: theme.typography.fontFamily.mono,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  deliveryLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
    marginBottom: theme.spacing.xl,
  },
  timelineTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.lg,
  },
  timelineWrapper: {
    paddingLeft: theme.spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  timelineIndicatorColumn: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCompleted: {
    backgroundColor: theme.colors.primary,
  },
  nodeActive: {
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  pulseInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border,
    position: 'absolute',
    top: 14,
    bottom: -theme.spacing.lg - 6,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: theme.colors.primary,
  },
  eventBody: {
    flex: 1,
    marginTop: -2,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitleText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.semibold,
  },
  eventTitleTextActive: {
    color: theme.colors.textPrimary,
  },
  eventTimeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textMuted,
  },
  eventTimeTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  eventDescText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  returnBtn: {
    width: '100%',
  },
});
