import { Product } from '../assets/productsData';
import { apiClient } from './api';

type FavoritesListener = (items: Product[]) => void;

class FavoritesService {
  private items: Product[] = [];
  private listeners: Set<FavoritesListener> = new Set();
  private userToken: string | null = null;

  // Cargar favoritos desde Supabase cuando se inicia sesión
  async loadFavorites(token: string | null) {
    this.userToken = token;
    if (!token) {
      this.items = [];
      this.notify();
      return;
    }
    try {
      const data = await apiClient.get('/favorites', token);
      if (Array.isArray(data)) {
        this.items = data;
        this.notify();
      }
    } catch (error) {
      console.error('[Error al cargar favoritos de Supabase]:', error);
    }
  }

  getFavorites(): Product[] {
    return [...this.items];
  }

  isFavorite(productId: string): boolean {
    return this.items.some(item => item.id === productId);
  }

  async toggleFavorite(product: Product) {
    const exists = this.items.some(item => item.id === product.id);
    
    // Actualización optimista local en el estado del frontend
    if (exists) {
      this.items = this.items.filter(item => item.id !== product.id);
    } else {
      this.items.push(product);
    }
    this.notify();

    // Sincronización asíncrona en segundo plano con Supabase
    if (this.userToken) {
      try {
        if (exists) {
          await apiClient.delete(`/favorites/${product.id}`, this.userToken);
        } else {
          await apiClient.post('/favorites', { productId: product.id }, this.userToken);
        }
      } catch (error) {
        console.error('[Error al sincronizar favorito en Supabase]:', error);
        // Fallback: Si falla la red, volvemos a cargar el estado real del servidor
        this.loadFavorites(this.userToken);
      }
    }
  }

  subscribe(listener: FavoritesListener) {
    this.listeners.add(listener);
    listener([...this.items]);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: FavoritesListener) {
    this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.items]));
  }
}

export const favoritesService = new FavoritesService();
