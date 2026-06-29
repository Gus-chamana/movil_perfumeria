import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Alert
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Stats {
  totalSales: number;
  totalOrders: number;
  totalClients: number;
  lowStockProducts: number;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { userToken, logoutUser } = useAuth();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta de Administrador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => {
            logoutUser();
            navigation.navigate('Auth');
          }
        }
      ]
    );
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/stats', userToken || undefined);
      setStats(data);
    } catch (error) {
      console.error('[Error al obtener estadísticas]:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
          <Text style={styles.headerTitle}>Consola Imperial</Text>
          <Text style={styles.headerSubtitle}>Indicadores clave de Noir Essence</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleLogout}
          style={styles.logoutHeaderBtn}
        >
          <Ionicons name="log-out-outline" size={22} color="#EB5757" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>CALCULANDO MÉTRICAS...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tarjeta de Ventas Totales */}
          <View style={[styles.card, styles.goldCard]}>
            <Ionicons name="cash" size={32} color={theme.colors.background} style={styles.cardIcon} />
            <Text style={styles.cardLabelGold}>VENTAS TOTALES</Text>
            <Text style={styles.cardValGold}>S/. {stats?.totalSales.toFixed(2)}</Text>
            <Text style={styles.cardHelperGold}>Ingresos aprobados</Text>
          </View>

          {/* Fila de KPIs secundarios */}
          <View style={styles.statsRow}>
            {/* Pedidos */}
            <View style={styles.statsCol}>
              <View style={styles.card}>
                <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} style={styles.miniIcon} />
                <Text style={styles.miniLabel}>PEDIDOS</Text>
                <Text style={styles.miniVal}>{stats?.totalOrders}</Text>
                <Text style={styles.miniHelper}>Ordenes totales</Text>
              </View>
            </View>

            {/* Clientes */}
            <View style={styles.statsCol}>
              <View style={styles.card}>
                <Ionicons name="people-outline" size={24} color={theme.colors.primary} style={styles.miniIcon} />
                <Text style={styles.miniLabel}>CLIENTES VIP</Text>
                <Text style={styles.miniVal}>{stats?.totalClients}</Text>
                <Text style={styles.miniHelper}>Cuentas registradas</Text>
              </View>
            </View>
          </View>

          {/* Alerta de Stock Bajo */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminProducts' as any)}
            style={[
              styles.card, 
              stats && stats.lowStockProducts > 0 ? styles.warningCard : styles.successCard
            ]}
          >
            <View style={styles.warningHeader}>
              <Ionicons 
                name={stats && stats.lowStockProducts > 0 ? "alert-circle" : "checkmark-circle"} 
                size={28} 
                color={stats && stats.lowStockProducts > 0 ? "#EB5757" : theme.colors.primary} 
              />
              <Text style={[
                styles.warningTitle, 
                { color: stats && stats.lowStockProducts > 0 ? "#EB5757" : theme.colors.primary }
              ]}>
                {stats && stats.lowStockProducts > 0 ? "¡Alerta de Inventario!" : "Inventario Saludable"}
              </Text>
            </View>
            <Text style={styles.warningDesc}>
              {stats && stats.lowStockProducts > 0 
                ? `Tienes ${stats.lowStockProducts} variantes de perfumes con stock crítico (5 unidades o menos). Pulsa aquí para gestionar stock.`
                : "Todas las esencias cuentan con suficiente inventario para atender pedidos en Lima Metropolitana."
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={fetchStats}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={16} color={theme.colors.primary} />
            <Text style={styles.refreshButtonText}>Actualizar Consola</Text>
          </TouchableOpacity>

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
  logoutHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(235, 87, 87, 0.2)',
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
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  goldCard: {
    backgroundColor: theme.colors.primary, // Fondo oro premium
    borderColor: theme.colors.primary,
    minHeight: 140,
  },
  cardIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.25,
  },
  cardLabelGold: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.background,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.5,
  },
  cardValGold: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 32,
    color: theme.colors.background,
    fontWeight: theme.typography.weights.bold,
    marginVertical: theme.spacing.xs,
  },
  cardHelperGold: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: 'rgba(13, 13, 13, 0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statsCol: {
    flex: 1,
  },
  miniIcon: {
    marginBottom: theme.spacing.sm,
  },
  miniLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  miniVal: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginVertical: 2,
  },
  miniHelper: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  warningCard: {
    borderColor: 'rgba(235, 87, 87, 0.3)',
    backgroundColor: 'rgba(235, 87, 87, 0.05)',
  },
  successCard: {
    borderColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  warningTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
  },
  warningDesc: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.bodyMedium,
    marginTop: 4,
  },
  refreshButton: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.sm,
  },
  refreshButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
