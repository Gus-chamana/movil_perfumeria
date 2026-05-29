import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { theme } from '../../theme/theme';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';

type TrackingScreenRouteProp = RouteProp<RootStackParamList, 'Tracking'>;
type TrackingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tracking'>;

interface TimelineEvent {
  title: string;
  time: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
}

export default function TrackingScreen() {
  const route = useRoute<TrackingScreenRouteProp>();
  const navigation = useNavigation<TrackingScreenNavigationProp>();
  
  // Capturar el ID del pedido generado o por defecto
  const orderId = route.params?.orderId || 'NE-948271';

  // Eventos de la línea de tiempo vertical de lujo
  const TIMELINE_EVENTS: TimelineEvent[] = [
    {
      title: 'Pedido Confirmado',
      time: '10:14 AM',
      description: 'Tu transacción ha sido validada de forma exitosa. Transmitido a bodega central.',
      status: 'completed',
    },
    {
      title: 'Preparación y Embalaje de Lujo',
      time: '10:30 AM',
      description: 'Tu fragancia ha sido sellada y empaquetada con envoltura protectora Noir Essence.',
      status: 'completed',
    },
    {
      title: 'En Camino a tu Destino',
      time: '10:45 AM (En Tránsito)',
      description: 'El motorizado exclusivo ha salido del centro de distribución y va en ruta.',
      status: 'active',
    },
    {
      title: 'Entrega en Puerta',
      time: 'Estimado 11:15 AM',
      description: 'Fragancia entregada en mano propia bajo estrictos protocolos de bioseguridad.',
      status: 'pending',
    },
  ];

  const handleReturnHome = () => {
    // Regresa a la pestaña principal del Core (HomeScreen)
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>SEGUIMIENTO EN TIEMPO REAL</Text>
        <Text style={styles.orderIdText}>{orderId}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Datos del Despachador / Motorizado (Tarjeta Flotante Premium) */}
        <View style={styles.dispatcherCard}>
          <View style={styles.dispatcherInfoRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarCircleText}>MS</Text>
            </View>
            <View style={styles.dispatcherMeta}>
              <Text style={styles.driverName}>Mateo Silva</Text>
              <Text style={styles.vehicleType}>Repartidor Noir Conciérge</Text>
            </View>
            <View style={styles.plateBadge}>
              <Text style={styles.plateText}>NG-5830</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.deliveryLabel}>Dirección de Entrega</Text>
          <Text style={styles.deliveryAddress}>
            Av. Javier Prado Este 1024, Dpto 402, San Borja, Lima
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
    backgroundColor: theme.colors.primary, // Nodos completados dorados
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
    bottom: -theme.spacing.lg - 6, // Conecta elegantemente con el siguiente nodo
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: theme.colors.primary, // Línea de conexión completada en dorado
  },
  eventBody: {
    flex: 1,
    marginTop: -2, // Alinea perfectamente el texto con el nodo circular
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
