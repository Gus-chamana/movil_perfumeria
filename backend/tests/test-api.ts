/**
 * Script de prueba de integración de la API de Noir Essence
 * Ejecuta un flujo de compra completo:
 * Registro -> Dirección -> Login -> Catálogo -> Carrito -> Pago (Checkout) -> Tracking -> Actualización de Estado.
 */

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testApi() {
  console.log('==================================================');
  console.log(' INICIANDO PRUEBAS DE INTEGRACIÓN DE NOIR ESSENCE  ');
  console.log('==================================================\n');

  try {
    // Generar datos únicos para evitar colisiones
    const email = `test.user.${Date.now()}@example.com`;
    const password = 'Password123!';
    const dni = Math.floor(10000000 + Math.random() * 90000000).toString();
    let token = '';
    let addressId = '';
    let productVariantId = '';
    let productId = '';
    let orderId = '';

    // 1. Registro Paso 1
    console.log('1. Probando Registro Paso 1...');
    const register1Res = await fetch(`${BASE_URL}/auth/register-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        nombre: 'Usuario',
        apellidoPaterno: 'Pruebas',
        dni
      })
    });
    const reg1Data = await register1Res.json() as any;
    if (!reg1Data.success) {
      throw new Error(`Paso 1 fallido: ${reg1Data.error}`);
    }
    console.log('✔ Paso 1 Completado con éxito.');
    token = reg1Data.data.token;

    // 2. Registro Paso 2
    console.log('\n2. Probando Registro Paso 2 (Dirección)...');
    const register2Res = await fetch(`${BASE_URL}/auth/register-step2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        direccion: 'Av. Diagonal 123, Of. 502',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores',
        referencia: 'Cerca a la Bajada Balta'
      })
    });
    const reg2Data = await register2Res.json() as any;
    if (!reg2Data.success) {
      throw new Error(`Paso 2 fallido: ${reg2Data.error}`);
    }
    console.log('✔ Paso 2 (Dirección) Completado con éxito.');
    addressId = reg2Data.data.direccion.id;

    // 3. Login
    console.log('\n3. Probando Inicio de Sesión...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json() as any;
    if (!loginData.success) {
      throw new Error(`Login fallido: ${loginData.error}`);
    }
    console.log('✔ Inicio de Sesión Completado con éxito.');
    token = loginData.data.token;

    // 4. Catálogo
    console.log('\n4. Consultando Catálogo de Productos...');
    const catalogRes = await fetch(`${BASE_URL}/products`);
    const catalogData = await catalogRes.json() as any;
    if (!catalogData.success || catalogData.data.length === 0) {
      throw new Error('No se pudieron obtener productos o catálogo está vacío.');
    }
    console.log(`✔ Catálogo obtenido. Total productos: ${catalogData.data.length}`);
    
    // Seleccionar el primer producto y su variante para pruebas
    const firstProduct = catalogData.data[0];
    productId = firstProduct.id;
    productVariantId = firstProduct.variantes[0].id;
    console.log(`   Producto seleccionado: ${firstProduct.marca} ${firstProduct.nombre} (ID: ${productId})`);
    console.log(`   Variante seleccionada SKU: ${firstProduct.variantes[0].sku} (ID: ${productVariantId})`);

    // 5. Detalle de Producto
    console.log('\n5. Consultando Detalle de un Producto...');
    const detailsRes = await fetch(`${BASE_URL}/products/${productId}`);
    const detailsData = await detailsRes.json() as any;
    if (!detailsData.success) {
      throw new Error(`Error obteniendo detalle: ${detailsData.error}`);
    }
    console.log(`✔ Detalle obtenido correctamente para: ${detailsData.data.nombre}`);

    // 6. Favoritos
    console.log('\n6. Probando alternar favorito...');
    const favToggleRes = await fetch(`${BASE_URL}/products/${productId}/favorite`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const favToggleData = await favToggleRes.json() as any;
    if (!favToggleData.success) {
      throw new Error(`Error en favoritos: ${favToggleData.error}`);
    }
    console.log(`✔ Estado favorito: ${favToggleData.isFavorite ? 'AÑADIDO' : 'REMOVIDO'}`);

    // Listar favoritos
    const favListRes = await fetch(`${BASE_URL}/products/favorites/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const favListData = await favListRes.json() as any;
    console.log(`✔ Total favoritos listados: ${favListData.data.length}`);

    // 7. Carrito de Compras
    console.log('\n7. Probando Carrito de Compras (Agregar Ítem)...');
    const addToCartRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productoVarianteId: productVariantId,
        cantidad: 2
      })
    });
    const cartData = await addToCartRes.json() as any;
    if (!cartData.success) {
      throw new Error(`Error agregando al carrito: ${cartData.error}`);
    }
    console.log(`✔ Producto agregado al carrito. Subtotal: S/. ${cartData.data.subtotal}`);

    // 8. Checkout / Proceso de Pago
    console.log('\n8. Creando Pedido y Pago (Checkout)...');
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        direccionEnvioId: addressId,
        metodoPago: 'YAPE',
        telefonoPago: '999888777',
        receptorNombre: 'Carlos Gómez Pruebas',
        receptorDni: '11223344'
      })
    });
    const orderData = await orderRes.json() as any;
    if (!orderData.success) {
      throw new Error(`Checkout fallido: ${orderData.error}`);
    }
    orderId = orderData.data.orderId;
    console.log(`✔ Pedido Creado Exitosamente.`);
    console.log(`   ID Orden: ${orderId}`);
    console.log(`   Código de Seguimiento: ${orderData.data.trackingNumber}`);
    console.log(`   Monto Pagado: S/. ${orderData.data.total}`);

    // 9. Historial de Órdenes
    console.log('\n9. Obteniendo Historial de Órdenes...');
    const historyRes = await fetch(`${BASE_URL}/orders/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const historyData = await historyRes.json() as any;
    console.log(`✔ Pedidos en historial: ${historyData.data.length}`);

    // 10. Seguimiento de Pedido
    console.log('\n10. Consultando Seguimiento de Pedido...');
    const trackingRes = await fetch(`${BASE_URL}/orders/${orderId}/tracking`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const trackingData = await trackingRes.json() as any;
    if (!trackingData.success) {
      throw new Error(`Error en tracking: ${trackingData.error}`);
    }
    console.log(`✔ Estado Actual: ${trackingData.data.estadoActual}`);
    console.log(`   Línea de Tiempo inicial (Estados registrados):`);
    trackingData.data.lineaTiempo.forEach((log: any) => {
      console.log(`     - [${log.estado}] a las ${new Date(log.fecha).toLocaleTimeString()}`);
    });

    // 11. Cambiar Estado (Simular Motorizado/Admin)
    // Para poder cambiar de estado necesitamos iniciar sesión como Admin/Motorizado
    console.log('\n11. Iniciando sesión como Administrador para asignar motorizado...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@noinessence.com',
        password: 'admin123'
      })
    });
    const adminLoginData = await adminLoginRes.json() as any;
    const adminToken = adminLoginData.data.token;

    // Obtener ID del usuario motorizado de prueba
    console.log('   Obteniendo cuenta del motorizado...');
    const motorizadoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'motorizado@noinessence.com',
        password: 'motorizado123'
      })
    });
    const motorizadoLoginData = await motorizadoLoginRes.json() as any;
    const motorizadoUserId = motorizadoLoginData.data.usuario.id;
    const motorizadoToken = motorizadoLoginData.data.token;

    console.log(`   Asignando motorizado (ID: ${motorizadoUserId}) a la orden...`);
    const assignRes = await fetch(`${BASE_URL}/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ motorizadoId: motorizadoUserId })
    });
    const assignData = await assignRes.json() as any;
    console.log(`✔ Motorizado asignado. Nuevo estado: ${assignData.data.estadoActual}`);

    // Actualizar estado a EN_RUTA como motorizado
    console.log('   Actualizando estado a [EN_RUTA] como motorizado...');
    const statusEnRutaRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${motorizadoToken}`
      },
      body: JSON.stringify({ estado: 'EN_RUTA' })
    });
    const statusEnRutaData = await statusEnRutaRes.json() as any;
    console.log(`✔ Estado actualizado: ${statusEnRutaData.data.estadoActual}`);

    // Actualizar estado a ENTREGADO como motorizado
    console.log('   Actualizando estado a [ENTREGADO] como motorizado...');
    const statusEntregadoRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${motorizadoToken}`
      },
      body: JSON.stringify({ estado: 'ENTREGADO' })
    });
    const statusEntregadoData = await statusEntregadoRes.json() as any;
    console.log(`✔ Estado actualizado: ${statusEntregadoData.data.estadoActual}`);

    // 12. Consultar Seguimiento Final
    console.log('\n12. Consultando Seguimiento de Pedido Final (Cliente)...');
    const finalTrackingRes = await fetch(`${BASE_URL}/orders/${orderId}/tracking`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalTrackingData = await finalTrackingRes.json() as any;
    console.log(`✔ Estado Final: ${finalTrackingData.data.estadoActual}`);
    console.log(`   Línea de Tiempo Final:`);
    finalTrackingData.data.lineaTiempo.forEach((log: any) => {
      console.log(`     - [${log.estado}] - Registrado: ${new Date(log.fecha).toLocaleTimeString()}`);
    });

    console.log('\n==================================================');
    console.log('     TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE    ');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ ERROR EN LA VERIFICACIÓN DE LA API:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
testApi();
