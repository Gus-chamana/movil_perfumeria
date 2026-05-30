import { Product } from '../assets/productsData';

export interface CartItem {
  product: Product;
  quantity: number;
}

type CartListener = (items: CartItem[]) => void;

class CartService {
  private items: CartItem[] = [];
  private listeners: Set<CartListener> = new Set();

  constructor() {
    // Inicializamos con el mock inicial que tenía CartScreen para conservar el mockup inicial del usuario
    // y no romper la interfaz al inicio, pero ahora 100% dinámico.
    this.items = [];
  }

  getCart(): CartItem[] {
    return [...this.items];
  }

  addToCart(product: Product, quantity: number = 1) {
    const existing = this.items.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ product, quantity });
    }
    this.notify();
  }

  increaseQty(productId: string) {
    const item = this.items.find(i => i.product.id === productId);
    if (item) {
      item.quantity += 1;
      this.notify();
    }
  }

  decreaseQty(productId: string) {
    const item = this.items.find(i => i.product.id === productId);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        this.items = this.items.filter(i => i.product.id !== productId);
      }
      this.notify();
    }
  }

  removeFromCart(productId: string) {
    this.items = this.items.filter(item => item.product.id !== productId);
    this.notify();
  }

  clearCart() {
    this.items = [];
    this.notify();
  }

  subscribe(listener: CartListener) {
    this.listeners.add(listener);
    // Notificación inmediata al suscribirse para sincronizar
    listener([...this.items]);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: CartListener) {
    this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.items]));
  }
}

export const cartService = new CartService();
