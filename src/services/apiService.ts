import { Product } from '../assets/productsData';

// IP local de tu computadora para conectarse al backend en desarrollo
export const API_BASE_URL = 'http://192.168.18.13:3000/api';

/**
 * Mapea la estructura de producto devuelta por la API del backend (Prisma)
 * al modelo simplificado que utiliza el frontend.
 */
export const mapAPIProductToFrontend = (apiProduct: any): Product => {
  // Tomamos la primera variante disponible para extraer el precio e imagen
  const defaultVariant = apiProduct.variantes?.[0] || {};

  return {
    id: apiProduct.id,
    varianteId: defaultVariant.id, // Inyectamos el ID de la variante para el carrito
    brand: apiProduct.marca || 'Noir Essence',
    name: apiProduct.nombre || '',
    price: defaultVariant.precio ? parseFloat(defaultVariant.precio.toString()) : 0,
    imageUrl: defaultVariant.imagenUrl || undefined,
    category: apiProduct.categoria || 'Amaderados',
    gender: apiProduct.gender || 'unisex',
    size: defaultVariant.size || '100ml',
    concentration: defaultVariant.concentration || 'Parfum',
    isNew: apiProduct.esNuevo || false,
    description: apiProduct.descripcion || '',
  };
};

/**
 * Mapea un elemento del carrito devuelto por la API al formato local del móvil
 */
export const mapAPICartItemToFrontend = (apiItem: any): any => {
  return {
    product: {
      id: apiItem.producto.id,
      varianteId: apiItem.varianteId,
      brand: apiItem.producto.marca,
      name: apiItem.producto.nombre,
      price: apiItem.precio,
      imageUrl: apiItem.producto.imagenUrl || undefined,
      category: 'Amaderados',
      gender: 'unisex',
      size: apiItem.size || '100ml',
      concentration: apiItem.concentration || 'Parfum',
      isNew: false,
      description: '',
    },
    quantity: apiItem.cantidad,
  };
};

// ==========================================
// 1. PRODUCTOS
// ==========================================
export const getProductsFromAPI = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) {
    throw new Error('No se pudo establecer conexión con el backend de Noir Essence.');
  }
  const result = await response.json();
  if (result.success && Array.isArray(result.data)) {
    return result.data.map(mapAPIProductToFrontend);
  }
  throw new Error('Estructura de respuesta inesperada del servidor.');
};

// ==========================================
// 2. AUTENTICACIÓN (LOGIN & REGISTRO)
// ==========================================
export const loginAPI = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Credenciales inválidas.');
  }
  return result.data; // Devuelve { token, usuario: { id, email, rol, datosPersonales, direcciones } }
};

export const registerStep1API = async (userData: {
  email: string;
  password: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  dni: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/register-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error en el paso 1 de registro.');
  }
  return result.data; // Devuelve { token, usuario }
};

export const registerStep2API = async (
  addressData: {
    direccion: string;
    departamento: string;
    provincia: string;
    distrito: string;
    referencia?: string;
  },
  token: string
) => {
  const response = await fetch(`${API_BASE_URL}/auth/register-step2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(addressData),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al guardar la dirección del cliente.');
  }
  return result.data;
};

// ==========================================
// 3. CARRITO DE COMPRAS (SUPABASE)
// ==========================================
export const getCartAPI = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al obtener el carrito.');
  }
  return result.data.items.map(mapAPICartItemToFrontend);
};

export const addOrUpdateCartItemAPI = async (
  productoVarianteId: string,
  cantidad: number,
  token: string
) => {
  const response = await fetch(`${API_BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ productoVarianteId, cantidad }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al actualizar el carrito de compras.');
  }
  return result.data.items.map(mapAPICartItemToFrontend);
};

export const removeCartItemAPI = async (itemId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al eliminar el ítem del carrito.');
  }
  return result.data.items.map(mapAPICartItemToFrontend);
};

export const clearCartAPI = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al vaciar el carrito.');
  }
  return result.data.items.map(mapAPICartItemToFrontend);
};

// ==========================================
// 4. PEDIDOS / ÓRDENES Y SEGUIMIENTO (TRACKING)
// ==========================================
export const createOrderAPI = async (
  orderData: {
    direccionEnvioId?: string;
    nuevaDireccion?: {
      direccion: string;
      departamento: string;
      provincia: string;
      distrito: string;
      referencia?: string;
    };
    metodoPago: 'YAPE' | 'PLIN' | 'TARJETA';
    telefonoPago?: string;
    datosTarjeta?: {
      numeroTarjeta: string;
      fechaVencimiento: string;
      cvv: string;
    };
    receptorNombre: string;
    receptorDni: string;
  },
  token: string
) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al registrar el pedido.');
  }
  return result.data; // Devuelve { orderId, trackingNumber, total, transactionId }
};

export const getOrderByIdAPI = async (orderId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al consultar la orden.');
  }
  return result.data;
};

export const getMotorizadosAPI = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/tracking/motorizados`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al obtener la lista de motorizados.');
  }
  return result.data;
};

export const assignMotorizadoAPI = async (orderId: string, motorizadoId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/tracking/${orderId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ motorizadoId }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al asignar el motorizado.');
  }
  return result.data;
};

export const createProductAPI = async (productData: any, token: string) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al crear el producto.');
  }
  return result.data;
};

export const adminCreateUserAPI = async (userData: any, token: string) => {
  const response = await fetch(`${API_BASE_URL}/users/admin/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Error al registrar al usuario.');
  }
  return result.data;
};


