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
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { apiClient } from '../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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

  // Estados para Modal de Crear/Editar
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Campos del Formulario
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'CLIENTE' | 'MOTORIZADO'>('CLIENTE');
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormEmail('');
    setFormPassword('');
    setFormName('');
    setFormLastName('');
    setFormDni('');
    setFormAddress('');
    setFormDistrict('');
    setFormRole('CLIENTE');
    setModalVisible(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormPassword('');
    setFormName(user.name);
    setFormLastName(user.lastName);
    setFormDni(user.dni);
    setFormAddress(user.address);
    setFormDistrict(user.district);
    setFormRole(user.rol);
    setModalVisible(true);
  };

  const handleChangeRole = (userId: string, currentRole: string) => {
    if (userId === userProfile?.id) {
      Alert.alert('Acción Denegada', 'No puedes modificar tu propia categoría de administrador.');
      return;
    }
    const user = users.find(u => u.id === userId);
    if (user) {
      handleOpenEditModal(user);
    }
  };

  const handleSaveUser = async () => {
    if (!formEmail || !formName || !formLastName || !formDni || !formAddress || !formDistrict || !formRole) {
      Alert.alert('Campos Obligatorios', 'Por favor, completa todos los campos del formulario.');
      return;
    }

    if (!editingUser && !formPassword) {
      Alert.alert('Contraseña Requerida', 'Por favor, introduce una contraseña para el nuevo usuario.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: formEmail.trim(),
        password: formPassword ? formPassword : undefined,
        name: formName.trim(),
        lastName: formLastName.trim(),
        dni: formDni.trim(),
        address: formAddress.trim(),
        district: formDistrict.trim(),
        role: formRole
      };

      if (editingUser) {
        await apiClient.put(`/admin/users/${editingUser.id}`, payload, userToken || undefined);
        Alert.alert('¡Éxito!', 'Los datos del usuario fueron actualizados correctamente.');
      } else {
        await apiClient.post('/admin/users', payload, userToken || undefined);
        Alert.alert('¡Éxito!', 'El nuevo usuario fue registrado correctamente.');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      console.error('[Error al guardar usuario]:', error);
      Alert.alert('Error al Guardar', error.message || 'No se pudo guardar el usuario.');
    } finally {
      setSubmitting(false);
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
      `¿Estás absolutamente seguro de que deseas eliminar permanentemente a "${email}"?\n\nEsta acción eliminará su cuenta, perfiles y direcciones en cascada de forma irreversible.`,
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
      
      Alert.alert('Eliminado', 'El usuario fue removido correctamente.');
    } catch (error: any) {
      console.error('[Error al eliminar usuario]:', error);
      Alert.alert('Error al Eliminar', error.message || 'No se pudo completar la eliminación.');
      
      // Revertir
      fetchUsers();
    } finally {
      setActionId(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
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
          <Text style={styles.headerTitle}>Gobernanza</Text>
          <Text style={styles.headerSubtitle}>Gestión de usuarios y accesos</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleOpenCreateModal}
          style={styles.headerCreateButton}
        >
          <Ionicons name="person-add-outline" size={14} color="#000000" />
          <Text style={styles.headerCreateButtonText}>Crear</Text>
        </TouchableOpacity>

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
            const isCurrentUser = !!(item.id === userProfile?.id || 
              (item.email && userProfile?.email && item.email.toLowerCase() === userProfile.email.toLowerCase()));
            return (
              <View style={[styles.userCard, isCurrentUser && styles.activeUserCard]}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>
                      {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text numberOfLines={1} style={styles.userName}>
                      {item.name} {item.lastName}
                      {isCurrentUser && <Text style={styles.currentUserLabel}> (Sesión Activa)</Text>}
                    </Text>
                    <Text numberOfLines={1} style={styles.userEmail}>{item.email}</Text>
                  </View>
                  
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <View style={styles.badgeCol}>
                      <View 
                        style={[
                          styles.roleBadge,
                          item.rol === 'ADMIN' ? styles.badgeAdmin : item.rol === 'MOTORIZADO' ? styles.badgeMoto : styles.badgeClient
                        ]}
                      >
                        <Text style={[
                          styles.roleBadgeText,
                          item.rol === 'ADMIN' ? styles.badgeAdminText : item.rol === 'MOTORIZADO' ? styles.badgeMotoText : styles.badgeClientText
                        ]}>
                          {item.rol}
                        </Text>
                      </View>
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

                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => handleOpenEditModal(item)}
                    style={styles.editButton}
                  >
                    <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>

                  {!isCurrentUser && (
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      disabled={isProcessing}
                      onPress={() => handleDeleteUser(item.id, item.email)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EB5757" />
                      <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={48} color={theme.colors.border} />
          <Text style={styles.emptyTitle}>Sin Cuentas</Text>
          <Text style={styles.emptySubtitle}>No se encontraron usuarios.</Text>
        </View>
      )}

      {/* MODAL: Crear/Editar Usuario (UX Luxury) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nombre</Text>
              <TextInput
                style={styles.formInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ej. Juan Carlos"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.formLabel}>Apellido</Text>
              <TextInput
                style={styles.formInput}
                value={formLastName}
                onChangeText={setFormLastName}
                placeholder="Ej. Pérez"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.formLabel}>DNI</Text>
              <TextInput
                style={styles.formInput}
                value={formDni}
                onChangeText={setFormDni}
                placeholder="Ej. 70123456"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                maxLength={8}
              />

              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={formEmail}
                onChangeText={setFormEmail}
                placeholder="Ej. juan@gmail.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>
                {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
              </Text>
              <TextInput
                style={styles.formInput}
                value={formPassword}
                onChangeText={setFormPassword}
                placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Min. 6 caracteres'}
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Dirección de Envío</Text>
              <TextInput
                style={styles.formInput}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="Ej. Av. Larco 456, Dpto 402"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.formLabel}>Distrito</Text>
              <TextInput
                style={styles.formInput}
                value={formDistrict}
                onChangeText={setFormDistrict}
                placeholder="Ej. Miraflores"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.formLabel}>Rol / Categoría</Text>
              {(() => {
                const isEditingSelf = !!(editingUser && (editingUser.id === userProfile?.id || 
                  (editingUser.email && userProfile?.email && editingUser.email.toLowerCase() === userProfile.email.toLowerCase())));
                return (
                  <>
                    <View style={[styles.roleSelectorRow, isEditingSelf && { opacity: 0.5 }]}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={isEditingSelf}
                        onPress={() => setFormRole('CLIENTE')}
                        style={[styles.roleOptionChip, formRole === 'CLIENTE' && styles.roleOptionActive]}
                      >
                        <Text style={[styles.roleOptionText, formRole === 'CLIENTE' && styles.roleOptionTextActive]}>
                          CLIENTE
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={isEditingSelf}
                        onPress={() => setFormRole('MOTORIZADO')}
                        style={[styles.roleOptionChip, formRole === 'MOTORIZADO' && styles.roleOptionActive]}
                      >
                        <Text style={[styles.roleOptionText, formRole === 'MOTORIZADO' && styles.roleOptionTextActive]}>
                          MOTORIZADO
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={isEditingSelf}
                        onPress={() => setFormRole('ADMIN')}
                        style={[styles.roleOptionChip, formRole === 'ADMIN' && styles.roleOptionActive]}
                      >
                        <Text style={[styles.roleOptionText, formRole === 'ADMIN' && styles.roleOptionTextActive]}>
                          ADMIN
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {isEditingSelf && (
                      <Text style={{ fontSize: 9, color: theme.colors.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                        * No puedes modificar tu propio rol de administrador.
                      </Text>
                    )}
                  </>
                );
              })()}

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
                onPress={handleSaveUser}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
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
    marginBottom: theme.spacing.md,
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
  roleSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  roleOptionChip: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  roleOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTransparent,
  },
  roleOptionText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  roleOptionTextActive: {
    color: theme.colors.primary,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    marginRight: theme.spacing.md,
  },
  editButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  headerCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  headerCreateButtonText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: '#000000',
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  currentUserLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    fontStyle: 'italic',
  },
  activeUserCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
});

