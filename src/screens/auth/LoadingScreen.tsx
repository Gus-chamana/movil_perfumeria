import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  Animated, 
  ActivityIndicator, 
  StatusBar,
  Text
} from 'react-native';
import { theme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';

export default function LoadingScreen() {
  const navigation = useNavigation<any>();
  
  // Animaciones premium de opacidad y escala
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Iniciar secuencia de animación para el logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 15,
        friction: 5,
        useNativeDriver: true
      })
    ]).start();

    // Redirección elegante al Main después de 2.2 segundos
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.logoContainer}>
        {/* Logo animado de Noir Essence */}
        <Animated.Image 
          source={require('../../assets/icon.png')} 
          style={[
            styles.logo,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]} 
          resizeMode="contain"
        />
        
        {/* Marca Tipográfica Premium */}
        <Animated.Text style={[styles.brandText, { opacity: fadeAnim }]}>
          NOIR ESSENCE
        </Animated.Text>
        <Animated.Text style={[styles.subText, { opacity: fadeAnim }]}>
          L’Atelier des Fragrances Exclusives
        </Animated.Text>
      </View>

      {/* Indicador de carga dorado y elegante */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingLabel}>INICIANDO ATELIER...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fondo negro profundo premium
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: theme.spacing.lg,
  },
  brandText: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: 26,
    color: theme.colors.primary, // Oro
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 6,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  subText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 2,
    marginTop: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    gap: 8,
  },
  loadingLabel: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 9,
    color: theme.colors.primaryTransparent,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
