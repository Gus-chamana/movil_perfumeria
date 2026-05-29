import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useData, Order } from '../../context/DataContext';

export default function MotorizadoDashboardScreen() {
  const { user, logout } = useAuth();
  const { orders, updateOrderStatus } = useData();

  const handleLogout = () => {
    logout();
  };

  // Filtrar pedidos del motorizado actual
  const deliveries = orders.filter(o => o.motorizado === user?.name);

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    let nextStatus: 'EN_RUTA' | 'ENTREGADO';
    let statusText = '';

    if (currentStatus === 'PREPARANDO') {
      // Regla de negocio de ruta activa única:
      const hasActiveRoute = deliveries.some(d => d.status === 'EN_RUTA');
      if (hasActiveRoute) {
        Alert.alert(
          'Entrega en Curso',
          'Tienes una entrega en curso. Por favor confirma la entrega actual antes de iniciar una nueva ruta.'
        );
        return;
      }
      nextStatus = 'EN_RUTA';
      statusText = 'EN RUTA (Despacho iniciado)';
    } else if (currentStatus === 'EN_RUTA') {
      nextStatus = 'ENTREGADO';
      statusText = 'ENTREGADO (Pedido completado)';
    } else {
      return;
    }

    updateOrderStatus(orderId, nextStatus);

    Alert.alert('Estado Actualizado', `El pedido ${orderId} ahora se encuentra en estado: ${statusText}.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARANDO':
        return '#2196F3';
      case 'EN_RUTA':
        return '#9C27B0';
      case 'ENTREGADO':
        return '#4CAF50';
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header de lujo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>NOIR ESSENCE</Text>
          <Text style={styles.logoSubtitle}>DESPACHADOR · {user?.name.toUpperCase()}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Envíos */}
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeTitle}>Hola, {user?.name.split(' ')[0]}</Text>
            <Text style={styles.welcomeSubtitle}>Aquí tienes tus rutas y entregas asignadas para hoy.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const hasActiveRoute = deliveries.some(d => d.status === 'EN_RUTA');
          const isButtonDimmed = item.status === 'PREPARANDO' && hasActiveRoute;

          return (
            <View style={styles.deliveryCard}>
              {/* Cabecera del pedido */}
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>{item.id}</Text>
                <View style={[styles.statusIndicator, { borderColor: getStatusColor(item.status) }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Detalles del despacho */}
              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Cliente:</Text>
                  <Text style={styles.val}>{item.clientName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Contacto:</Text>
                  <Text style={styles.val}>{item.phone}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Dirección:</Text>
                  <Text style={styles.val}>{item.address}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Productos:</Text>
                  <Text style={[styles.val, styles.goldText]}>{item.products}</Text>
                </View>
              </View>

              {/* Botones de acción contextuales */}
              {item.status !== 'ENTREGADO' && (
                <LuxuryButton
                  title={item.status === 'PREPARANDO' ? 'Iniciar Ruta' : 'Confirmar Entrega'}
                  onPress={() => handleUpdateStatus(item.id, item.status)}
                  style={StyleSheet.flatten([styles.actionBtn, isButtonDimmed && { opacity: 0.4 }])}
                />
              )}

              {item.status === 'ENTREGADO' && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Entregado al Cliente</Text>
                </View>
              )}
            </View>
          );
        }}
      />
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
    letterSpacing: 1,
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  logoutBtnText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  welcomeBanner: {
    marginBottom: theme.spacing.lg,
  },
  welcomeTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1 - 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  welcomeSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  deliveryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
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
  orderId: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,13,13,0.5)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  detailsList: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
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
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  goldText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  actionBtn: {
    width: '100%',
  },
  completedBadge: {
    width: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: '#4CAF50',
    fontWeight: theme.typography.weights.bold,
  },
});
