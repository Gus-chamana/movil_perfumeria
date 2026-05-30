// Configuración única de API y cliente de red para conectar la app móvil con el backend de Express

// ⚠️ REEMPLAZA ESTA IP por tu URL de Railway de producción
// Esto permite que el celular físico o emulador se conecte de inmediato desde cualquier lugar
export const API_URL = 'https://movilperfumeria-production.up.railway.app/api';

// Cliente de Peticiones HTTP genérico usando fetch nativo de JavaScript
export const apiClient = {
  // 1. Peticiones GET
  get: async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al procesar la petición.');
    }
    return data;
  },

  // 2. Peticiones POST
  post: async (endpoint: string, body: any, token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al procesar la petición.');
    }
    return data;
  },

  // 3. Peticiones PUT
  put: async (endpoint: string, body: any, token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al procesar la petición.');
    }
    return data;
  },

  // 4. Peticiones DELETE
  delete: async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al procesar la petición.');
    }
    return data;
  },
};
