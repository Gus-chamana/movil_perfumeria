import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { theme } from '../../theme/theme';
import { useAuth } from '../../services/AuthContext';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { userToken } = useAuth();

  // 1. Vista si el usuario NO ha iniciado sesión (Bloqueo elegante)
  if (!userToken) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favoritos</Text>
          <Text style={styles.headerSubtitle}>Tu selección exclusiva</Text>
        </View>

        {/* Mensaje de Invitación al Login */}
        <View style={styles.loginPromptContainer}>
          <View style={styles.loginPromptCard}>
            <Ionicons name="heart-outline" size={48} color={theme.colors.primary} style={styles.loginPromptIcon} />
            <Text style={styles.loginPromptTitle}>Colección Privada</Text>
            <Text style={styles.loginPromptSubtitle}>
              Inicia sesión para resguardar tus fragancias predilectas y acceder a recomendaciones personalizadas de nuestro Atelier.
            </Text>
            <LuxuryButton
              title="Iniciar Sesión"
              onPress={() => navigation.navigate('Auth', { screen: 'Login', params: { redirectTo: 'FavoritesTab' } })}
              style={styles.loginPromptButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Vista si el usuario SÍ ha iniciado sesión (Colección vacía premium)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerSubtitle}>Tu selección exclusiva</Text>
      </View>

      {/* Estado Vacío */}
      <View style={styles.emptyContainer}>
        <Ionicons name="flask-outline" size={64} color={theme.colors.border} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Sin Preferidos</Text>
        <Text style={styles.emptySubtitle}>
          Aún no has añadido fragancias a tu colección personal de favoritos.
        </Text>
        <LuxuryButton
          title="Explorar Esencias"
          onPress={() => navigation.navigate('CatalogTab')}
          style={styles.exploreButton}
        />
      </View>
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
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  loginPromptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    ...theme.shadows.soft,
  },
  loginPromptIcon: {
    marginBottom: theme.spacing.md,
  },
  loginPromptTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.bodyMedium,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  loginPromptButton: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.bodyMedium,
    marginBottom: theme.spacing.xl,
  },
  exploreButton: {
    width: '80%',
  },
});
