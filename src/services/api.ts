// ⚠️ REEMPLAZA ESTA IP por la Dirección IPv4 real de tu computadora (la que te dio ipconfig)
// Esto permite que el celular físico o emulador se conecte de inmediato por tu red Wi-Fi
export const API_URL = 'http://192.168.18.17:3000/api';

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
