import { Platform } from 'react-native';

/**
 * Noir Essence - Sistema de Diseño Premium (2025-2026)
 * 
 * Este archivo centraliza los tokens de diseño de la aplicación móvil de perfumería de lujo.
 * Configurado minuciosamente con base en los mockups de alta fidelidad.
 * Cumple con principios de accesibilidad WCAG y ofrece un look & feel de alta gama (High-End).
 */

export const colors = {
  // Paleta Cromática Base (Luxurious Dark & Gold)
  background: '#0D0D0D', // Negro profundo absoluto para la identidad de lujo "Noir"
  surface: '#161616',    // Elevación nivel 1: fondo de tarjetas, inputs, contenedores
  surfaceElevated: '#222222', // Elevación nivel 2: modales, dropdowns y elementos flotantes
  
  // Acentos Metálicos y de Interacción
  primary: '#C9A84C',    // Oro real - Acento principal y llamadas a la acción (CTA)
  primaryDark: '#A68632', // Oro oxidado - Estados de presión (Pressed) y bordes seleccionados
  primaryLight: '#E0C36D', // Oro brillante - Resplandores, gradientes y destaques
  primaryTransparent: 'rgba(201, 168, 76, 0.1)', // Fondo de botones secundarios o etiquetas
  
  // Textos y Legibilidad (Contraste Asegurado)
  textPrimary: '#FFFFFF',   // Blanco absoluto para alta jerarquía y títulos principales
  textSecondary: '#A3A3A3', // Gris plata medio para descripciones, subtítulos e información secundaria
  textMuted: '#666666',     // Gris oscuro para placeholders, textos de ayuda y deshabilitados
  textGold: '#C9A84C',      // Texto dorado destacado para precios, marcas o insignias premium
  
  // Estados y Validaciones
  success: '#4CAF50', // Verde esmeralda para confirmación de compra y éxito
  error: '#D32F2F',   // Rojo rubí para alertas de validación y errores críticos
  warning: '#FFA000', // Ámbar de advertencia
  info: '#1976D2',    // Azul elegante para información de tracking
  
  // Elementos de UI y Separadores
  border: '#222222',       // Borde sutil y minimalista para fusionar con el fondo
  borderActive: '#C9A84C', // Borde dorado al hacer foco
  divider: '#1A1A1A',      // Línea divisoria muy tenue
  overlay: 'rgba(0, 0, 0, 0.75)', // Fondo semitransparente para modales
  heartActive: '#FF3366',  // Color vibrante para el botón de favoritos
};

export const typography = {
  // Configuración Tipográfica Premium
  fontFamily: {
    // Serif elegante para Títulos y Encabezados (Inspirado en la tipografía editorial de moda)
    title: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    // Sans-Serif moderna y limpia para lectura fluida y controles de UI (WCAG legibilidad)
    body: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'sans-serif',
    }),
    // Monospace para códigos de tracking o precios numéricos si se desea estilo técnico-lujoso
    mono: Platform.select({
      ios: 'Courier New',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  
  // Jerarquía de Tamaños (Escala Armónica)
  sizes: {
    hero: 32,      // Para pantallas de bienvenida o pantallas hero destacadas
    h1: 26,        // Título de pantalla principal (ej: Nombre del Perfume)
    h2: 20,        // Subtítulos principales de sección
    h3: 17,        // Títulos de tarjetas o títulos pequeños
    bodyLarge: 16, // Texto principal legible en formularios y descripciones
    bodyMedium: 14,// Texto general y etiquetas
    bodySmall: 12, // Notas al pie, metadatos y subtítulos menores
    caption: 10,   // Texto extremadamente pequeño (badges, marcas de agua)
  },
  
  // Pesos Visuales
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Ajustes de Interlineado (Line Heights para evitar colisiones tipográficas)
  lineHeights: {
    hero: 40,
    h1: 34,
    h2: 28,
    h3: 24,
    bodyLarge: 24,
    bodyMedium: 20,
    bodySmall: 16,
    caption: 12,
  },
};

export const spacing = {
  // Escala de Espaciado Modular basada en múltiplos de 4px/8px
  none: 0,
  xs: 4,      // Micro-espaciado para separaciones internas mínimas
  sm: 8,      // Espaciado interno de elementos pequeños
  md: 12,     // Espaciado estándar entre etiquetas e inputs
  lg: 16,     // Padding lateral recomendado para pantallas móviles
  xl: 24,     // Separación entre bloques o grupos lógicos de UI
  xxl: 32,    // Margen superior/inferior para títulos principales
  xxxl: 48,   // Espacios hero o secciones de gran respiro
};

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,      // Estándar para botones y inputs (lujoso pero moderno)
  lg: 12,     // Perfecto para tarjetas de productos (ProductCard)
  xl: 20,     // Para paneles de control expandibles o hojas de fondo (BottomSheet)
  round: 9999,// Círculos perfectos (botones de favoritos, avatares)
};

export const shadows = Platform.select({
  ios: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    premium: {
      shadowColor: '#C9A84C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
  },
  android: {
    soft: {
      elevation: 4,
    },
    premium: {
      elevation: 6,
    },
  },
  default: {
    soft: {},
    premium: {},
  },
});

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
export default theme;
