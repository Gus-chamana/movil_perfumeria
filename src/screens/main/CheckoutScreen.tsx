import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from 'react-native';
import { theme } from '../../theme/theme';
import { CustomInput } from '../../components/CustomInput';
import { LuxuryButton } from '../../components/LuxuryButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

type PaymentMethodType = 'yape' | 'plin' | 'card' | null;

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  
  // Paso activo en el Checkout (1: Dirección, 2: Pago)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // ESTADOS PASO 1: DIRECCIÓN
  // ==========================================
  const [address, setAddress] = useState('Av. Javier Prado Este 1024, Dpto 402');
  const [city, setCity] = useState('San Borja, Lima');
  const [phone, setPhone] = useState('987 654 321');
  const [addressError, setAddressError] = useState('');
  const [cityError, setCityError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ==========================================
  // ESTADOS PASO 2: METODO DE PAGO
  // ==========================================
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(null);
  
  // Inputs de Pago
  const [walletPhone, setWalletPhone] = useState('987 654 321');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // Errores de Pago
  const [paymentError, setPaymentError] = useState('');

  // ==========================================
  // GESTIÓN DE FLUJO Y VALIDACIONES
  // ==========================================

  const handleNextStep = () => {
    let valid = true;
    setAddressError('');
    setCityError('');
    setPhoneError('');

    if (!address.trim()) {
      setAddressError('La dirección de entrega es obligatoria.');
      valid = false;
    }
    if (!city.trim()) {
      setCityError('El distrito/ciudad es obligatorio.');
      valid = false;
    }
    if (!phone.trim()) {
      setPhoneError('El teléfono de contacto es obligatorio.');
      valid = false;
    }

    if (valid) {
      setCheckoutStep(2);
    }
  };

  const handleConfirmOrder = () => {
    setPaymentError('');

    if (!paymentMethod) {
      setPaymentError('Por favor, selecciona un método de pago.');
      return;
    }

    // Validar Inputs específicos
    if ((paymentMethod === 'yape' || paymentMethod === 'plin') && !walletPhone.trim()) {
      setPaymentError('Ingresa el número celular asociado a tu billetera.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCVV) {
        setPaymentError('Por favor completa todos los datos de tu tarjeta.');
        return;
      }
      if (cardNumber.length < 16) {
        setPaymentError('El número de tarjeta no es válido.');
        return;
      }
    }

    // Simular Transacción Financiera
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Generar ID de pedido ficticio aleatorio
      const mockOrderId = `NE-${Math.floor(100000 + Math.random() * 900000)}`;
      // Redirigir directamente al Tracking con el ID del pedido
      navigation.replace('Tracking', { orderId: mockOrderId });
    }, 2200);
  };

  const handleBack = () => {
    if (checkoutStep === 2) {
      setCheckoutStep(1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Cabecera Premium */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pasarela de Pago</Text>
        
        {/* Barra de Progreso Interno de Compra */}
        <View style={styles.checkoutProgressTrack}>
          <View style={[styles.checkoutProgressBar, { width: checkoutStep === 1 ? '50%' : '100%' }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* PASO 1: DIRECCIÓN DE ENTREGA */}
          {checkoutStep === 1 && (
            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>1. Detalles del Despacho</Text>
              <Text style={styles.stepSubtitle}>
                Por favor, verifica la dirección donde entregaremos tu fragancia exclusiva.
              </Text>

              <CustomInput
                label="Dirección de Entrega"
                placeholder="Calle o Avenida y número"
                value={address}
                onChangeText={setAddress}
                error={addressError}
              />

              <CustomInput
                label="Distrito o Ciudad"
                placeholder="Ej. Miraflores, Lima"
                value={city}
                onChangeText={setCity}
                error={cityError}
              />

              <CustomInput
                label="Número de Contacto"
                placeholder="Ej. 999888777"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                error={phoneError}
              />

              <LuxuryButton
                title="Siguiente: Método de Pago"
                onPress={handleNextStep}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* PASO 2: METODO DE PAGO (ACORDEONES EXPANDIBLES) */}
          {checkoutStep === 2 && (
            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>2. Método de Pago</Text>
              <Text style={styles.stepSubtitle}>
                Selecciona la forma de pago preferida para concretar la adquisición.
              </Text>

              {/* OPCIÓN 1: YAPE (EXPANDIBLE) */}
              <View style={styles.methodCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod(paymentMethod === 'yape' ? null : 'yape')}
                  style={[styles.methodHeader, paymentMethod === 'yape' && styles.methodHeaderActive]}
                >
                  <Text style={styles.methodTitle}>📱 Yape (Billetera Digital)</Text>
                  <Text style={styles.methodToggle}>{paymentMethod === 'yape' ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {paymentMethod === 'yape' && (
                  <View style={styles.methodContent}>
                    <CustomInput
                      label="Celular registrado en Yape"
                      placeholder="987 654 321"
                      keyboardType="phone-pad"
                      value={walletPhone}
                      onChangeText={setWalletPhone}
                    />
                    <Text style={styles.helperText}>
                      Recibirás una notificación push en tu aplicación Yape para aprobar el pago.
                    </Text>
                  </View>
                )}
              </View>

              {/* OPCIÓN 2: PLIN (EXPANDIBLE) */}
              <View style={styles.methodCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod(paymentMethod === 'plin' ? null : 'plin')}
                  style={[styles.methodHeader, paymentMethod === 'plin' && styles.methodHeaderActive]}
                >
                  <Text style={styles.methodTitle}>⚡ Plin (Billetera Digital)</Text>
                  <Text style={styles.methodToggle}>{paymentMethod === 'plin' ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {paymentMethod === 'plin' && (
                  <View style={styles.methodContent}>
                    <CustomInput
                      label="Celular registrado en Plin"
                      placeholder="987 654 321"
                      keyboardType="phone-pad"
                      value={walletPhone}
                      onChangeText={setWalletPhone}
                    />
                    <Text style={styles.helperText}>
                      Ingresa el celular asociado y confirma el pago en tu banca móvil autorizada.
                    </Text>
                  </View>
                )}
              </View>

              {/* OPCIÓN 3: TARJETA DE CRÉDITO/DÉBITO (EXPANDIBLE) */}
              <View style={styles.methodCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod(paymentMethod === 'card' ? null : 'card')}
                  style={[styles.methodHeader, paymentMethod === 'card' && styles.methodHeaderActive]}
                >
                  <Text style={styles.methodTitle}>💳 Tarjeta de Crédito o Débito</Text>
                  <Text style={styles.methodToggle}>{paymentMethod === 'card' ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {paymentMethod === 'card' && (
                  <View style={styles.methodContent}>
                    <CustomInput
                      label="Número de la Tarjeta"
                      placeholder="4557 •••• •••• 4820"
                      keyboardType="number-pad"
                      maxLength={16}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                    />
                    <View style={styles.rowInputs}>
                      <View style={{ flex: 1.2 }}>
                        <CustomInput
                          label="Vencimiento"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChangeText={setCardExpiry}
                        />
                      </View>
                      <View style={{ flex: 0.8 }}>
                        <CustomInput
                          label="CVV"
                          placeholder="123"
                          keyboardType="number-pad"
                          maxLength={4}
                          isPassword={true}
                          value={cardCVV}
                          onChangeText={setCardCVV}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Render de Error Global de Pago */}
              {paymentError !== '' && (
                <Text style={styles.errorText}>{paymentError}</Text>
              )}

              {/* Botón CTA Confirmar Compra */}
              <LuxuryButton
                title="Confirmar y Pagar"
                onPress={handleConfirmOrder}
                loading={loading}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* Resumen Fijo de Costos */}
          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Resumen del Pedido</Text>
            <View style={styles.rowSummary}>
              <Text style={styles.labelSummary}>Envío Premium</Text>
              <Text style={styles.valSummary}>GRATIS (Colección Noir)</Text>
            </View>
            <View style={styles.rowSummary}>
              <Text style={styles.labelSummary}>Garantía de Envoltura Lujo</Text>
              <Text style={styles.valSummary}>Incluido</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    marginBottom: theme.spacing.sm,
  },
  backBtnText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
  },
  checkoutProgressTrack: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  checkoutProgressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  stepBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
    marginBottom: theme.spacing.lg,
  },
  stepTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  stepSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.lineHeights.bodyMedium,
  },
  actionBtn: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  methodCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  methodHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  methodTitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  methodToggle: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  methodContent: {
    padding: theme.spacing.md,
    backgroundColor: 'rgba(22, 22, 22, 0.3)',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  helperText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  orderSummary: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTitle: {
    fontFamily: theme.typography.fontFamily.title,
    fontSize: theme.typography.sizes.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  rowSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  labelSummary: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
  },
  valSummary: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
});
