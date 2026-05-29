import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions 
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useData, Order } from '../../context/DataContext';

const { width } = Dimensions.get('window');

const CHART_HEIGHT = 120;

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const { orders } = useData();

  const handleLogout = () => {
    logout();
  };

  // 1. Calcular Ventas Totales
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  // 2. Pedidos Activos (no ENTREGADO)
  const activeOrdersCount = orders.filter(o => o.status !== 'ENTREGADO').length;

  // Pedidos por asignar motorizado
  const pendingAssignmentCount = orders.filter(o => o.status === 'PENDIENTE' && !o.motorizado).length;

  // 3. Despachadores Activos (motorizados únicos con pedidos activos asignados)
  const activeDeliveries = orders.filter(o => o.status !== 'ENTREGADO' && o.motorizado);
  const activeMotorizados = Array.from(new Set(activeDeliveries.map(o => o.motorizado as string)));
  const activeCount = activeMotorizados.length;

  // 4. Ventas semanales dinámicas agrupadas por día de la semana
  const getDayOfWeek = (dateStr: string) => {
    try {
      const [day, month, year] = dateStr.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return days[date.getDay()];
    } catch (e) {
      return 'Lun';
    }
  };

  const weeklySales = [
    { day: 'Lun', sales: 0 },
    { day: 'Mar', sales: 0 },
    { day: 'Mié', sales: 0 },
    { day: 'Jue', sales: 0 },
    { day: 'Vie', sales: 0 },
    { day: 'Sáb', sales: 0 },
    { day: 'Dom', sales: 0 },
  ];

  orders.forEach(order => {
    const day = getDayOfWeek(order.date);
    const found = weeklySales.find(s => s.day === day);
    if (found) {
      found.sales += order.total;
    }
  });

  const maxSale = Math.max(...weeklySales.map(s => s.sales), 1);

  // 5. Historial de Operaciones Dinámico (últimas 5 actividades)
  const getOrderActivity = (order: Order) => {
    let desc = '';
    let amount = `S/. ${order.total.toFixed(2)}`;
    let time = '';

    if (order.status === 'PENDIENTE') {
      desc = `Nueva orden: ${order.products}`;
      time = order.timeline[0]?.time || 'Hace poco';
    } else if (order.status === 'PREPARANDO') {
      desc = `Asignado a ${order.motorizado || 'repartidor'}`;
      amount = order.products.split(',')[0] || order.products;
      time = order.timeline[1]?.time || 'Hace poco';
    } else if (order.status === 'EN_RUTA') {
      desc = `En ruta con ${order.motorizado || 'repartidor'}`;
      time = order.timeline[2]?.time || 'Hace poco';
    } else if (order.status === 'ENTREGADO') {
      desc = `Orden marcada como ENTREGADA`;
      time = order.timeline[3]?.time || 'Hace poco';
    }

    return {
      id: order.id,
      orderId: order.id,
      desc,
      amount,
      time,
    };
  };

  const recentActivities = orders.slice(0, 5).map(getOrderActivity);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Encabezado Lujoso */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>NOIR ESSENCE</Text>
          <Text style={styles.logoSubtitle}>ADMINISTRACIÓN · {user?.name.toUpperCase()}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Banner de Bienvenida */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.bannerTitle}>Panel Ejecutivo</Text>
          <Text style={styles.bannerSubtitle}>Control operativo y métricas financieras en tiempo real.</Text>
        </View>

        {/* Métrica KPI Grid */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>VENTAS TOTALES</Text>
            <Text style={styles.kpiValue}>
              S/. {totalSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.kpiSubText}>+18.5% esta semana</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PEDIDOS ACTIVOS</Text>
            <Text style={styles.kpiValue}>{activeOrdersCount}</Text>
            <Text style={styles.kpiSubText}>
              {pendingAssignmentCount === 1 ? '1 por asignar motorizado' : `${pendingAssignmentCount} por asignar motorizado`}
            </Text>
          </View>
        </View>

        <View style={styles.kpiContainerSingle}>
          <View style={styles.kpiCardSingle}>
            <View style={styles.kpiRow}>
              <View>
                <Text style={styles.kpiLabel}>DESPACHADORES</Text>
                <Text style={styles.kpiValue}>
                  {activeCount} Activo{activeCount === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: activeCount > 0 ? '#4CAF50' : '#FF9800' }]} />
                <Text style={[styles.statusText, { color: activeCount > 0 ? '#4CAF50' : '#FF9800' }]}>
                  {activeCount > 0 ? 'En Ruta' : 'Sin Envíos Activos'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gráfico Semanal Editorial */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Ventas Semanales (S/.)</Text>
          <View style={styles.chartWrapper}>
            <View style={styles.chartBarsRow}>
              {weeklySales.map((item, index) => {
                const barHeight = (item.sales / maxSale) * CHART_HEIGHT;
                return (
                  <View key={index} style={styles.chartColumn}>
                    <View style={styles.barContainer}>
                      <View style={[styles.chartBar, { height: barHeight }]} />
                    </View>
                    <Text style={styles.chartLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Actividades Recientes */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Historial de Operaciones</Text>
          <View style={styles.activityList}>
            {recentActivities.map((act) => (
              <View key={act.id} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityCode}>{act.orderId}</Text>
                  <Text style={styles.activityDesc}>{act.desc}</Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityAmount}>{act.amount}</Text>
                  <Text style={styles.activityTime}>{act.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

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
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  welcomeBanner: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  bannerTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h1 - 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  bannerSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: theme.typography.lineHeights.bodyMedium,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  kpiContainerSingle: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  kpiCardSingle: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.soft,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
  },
  kpiValue: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2 + 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  kpiSubText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: theme.typography.weights.semibold,
  },
  cardSection: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.lg,
    letterSpacing: 0.5,
  },
  chartWrapper: {
    height: 160,
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.xs,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    width: 14,
  },
  chartBar: {
    width: 14,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.borderRadius.xs,
    borderTopRightRadius: theme.borderRadius.xs,
  },
  chartLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  activityList: {
    gap: theme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityLeft: {
    flex: 1.3,
  },
  activityCode: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  activityDesc: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  activityRight: {
    flex: 0.7,
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  activityTime: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
