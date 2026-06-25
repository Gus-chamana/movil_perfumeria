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
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  email: string;
  rol: 'ADMIN' | 'CLIENTE' | 'MOTORIZADO';
  name: string;
  lastName: string;
  dni: string;
  address: string;
  district: string;
}

export default function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const { userToken, userProfile, logoutUser } = useAuth();
  
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/users', userToken || undefined);
      setUsers(data);
    } catch (error) {
      console.error('[Error al obtener usuarios]:', error);
      Alert.alert('Error', 'No se pudieron recuperar los usuarios del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = (userId: string, currentRole: string) => {
    // Evitar que el administrador se cambie su propio rol
    if (userId === userProfile?.id) {
      Alert.alert('Acción Denegada', 'No puedes modificar tu propia categoría de administrador.');
      return;
    }

    Alert.alert(
      'Modificar Categoría',
      `Selecciona el nuevo rol para este usuario (Rol actual: ${currentRole})`,
      [
        { text: 'Cliente (CLIENTE)', onPress: () => processRoleChange(userId, 'CLIENTE') },
        { text: 'Administrador (ADMIN)', onPress: () => processRoleChange(userId, 'ADMIN') },
        { text: 'Motorizado (MOTORIZADO)', onPress: () => processRoleChange(userId, 'MOTORIZADO') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const processRoleChange = async (userId: string, targetRole: 'ADMIN' | 'CLIENTE' | 'MOTORIZADO') => {
    // Actualización optimista
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: targetRole } : u));

    try {
      setActionId(userId);
      console.log(`🔌 Cambiando rol de usuario ${userId} a ${targetRole}...`);
      await apiClient.put(`/admin/users/${userId}/role`, { newRole: targetRole }, userToken || undefined);
      
      Alert.alert('¡Éxito!', `El usuario ahora tiene el rol de ${targetRole}.`);
    } catch (error: any) {
      console.error('[Error al cambiar rol]:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el rol en Supabase.');
      
      // Revertir cambio si falla
      fetchUsers();
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteUser = (userId: string, email: string) => {
    // Evitar autoeliminación
    if (userId === userProfile?.id) {
      Alert.alert('Acción Denegada', 'No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    Alert.alert(
      '⚠️ ELIMINAR USUARIO',
      `¿Estás absolutamente seguro de que deseas eliminar permanentemente a "${email}"?\n\nEsta acción eliminará su cuenta, perfiles y direcciones de Supabase en cascada de forma irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'ELIMINAR AHORA', 
          style: 'destructive',
          onPress: () => processDeleteUser(userId)
        }
      ]
    );
  };

  const processDeleteUser = async (userId: string) => {
    // Eliminación optimista de UI local
    setUsers(prev => prev.filter(u => u.id !== userId));

    try {
      setActionId(userId);
      console.log(`🗑️ Eliminando usuario ${userId} de Supabase...`);
      await apiClient.delete(`/admin/users/${userId}`, userToken || undefined);
      
      Alert.alert('Eliminado', 'El usuario fue removido correctamente de Supabase.');
    } catch (error: any) {
      console.error('[Error al eliminar usuario]:', error);
      Alert.alert('Error al Eliminar', error.message || 'No se pudo completar la eliminación.');
      
      // Revertir
      fetchUsers();
    } finally {
      setActionId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
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
          <Text style={styles.headerTitle}>Gobernanza</Text>
          <Text style={styles.headerSubtitle}>Gestión de usuarios y accesos Supabase</Text>
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
          <Text style={styles.loaderText}>RESCATANDO USUARIOS...</Text>
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isProcessing = actionId === item.id;
            return (
              <View style={styles.userCard}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>
                      {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text numberOfLines={1} style={styles.userName}>
                      {item.name} {item.lastName}
                    </Text>
                    <Text numberOfLines={1} style={styles.userEmail}>{item.email}</Text>
                  </View>
                  
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <View style={styles.badgeCol}>
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => handleChangeRole(item.id, item.rol)}
                        style={[
                          styles.roleBadge,
                          item.rol === 'ADMIN' ? styles.badgeAdmin : item.rol === 'MOTORIZADO' ? styles.badgeMoto : styles.badgeClient
                        ]}
                      >
                        <Text style={[
                          styles.roleBadgeText,
                          item.rol === 'ADMIN' ? styles.badgeAdminText : item.rol === 'MOTORIZADO' ? styles.badgeMotoText : styles.badgeClientText
                        ]}>
                          {item.rol} ⚙️
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsRow}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>DNI</Text>
                    <Text style={styles.detailVal}>{item.dni || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Dirección de Envío</Text>
                    <Text numberOfLines={1} style={styles.detailVal}>
                      {item.address} {item.district ? `(${item.district})` : ''}
                    </Text>
                  </View>
                </View>

                {item.id !== userProfile?.id && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      disabled={isProcessing}
                      onPress={() => handleDeleteUser(item.id, item.email)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EB5757" />
                      <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={48} color={theme.colors.border} />
          <Text style={styles.emptyTitle}>Sin Cuentas</Text>
          <Text style={styles.emptySubtitle}>No se encontraron usuarios en tu Supabase.</Text>
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
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarMiniText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  userInfo: {
    flex: 1.2,
  },
  userName: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  userEmail: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badgeCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  roleBadge: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.xs,
  },
  badgeAdmin: {
    backgroundColor: theme.colors.primaryTransparent,
    borderColor: theme.colors.primary,
  },
  badgeMoto: {
    backgroundColor: 'rgba(56, 178, 172, 0.08)',
    borderColor: '#38B2AC',
  },
  badgeClient: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: theme.colors.border,
  },
  roleBadgeText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  badgeAdminText: {
    color: theme.colors.primary,
  },
  badgeMotoText: {
    color: '#38B2AC',
  },
  badgeClientText: {
    color: theme.colors.textSecondary,
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
    fontSize: 9,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    marginTop: theme.spacing.md,
    paddingTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  deleteButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: '#EB5757',
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
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
