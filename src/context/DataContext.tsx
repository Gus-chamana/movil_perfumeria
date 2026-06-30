import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Product, PRODUCTS_MOCK } from '../assets/productsData';
import { getProductsFromAPI, assignMotorizadoAPI, createProductAPI } from '../services/apiService';
import { useAuth } from './AuthContext';

export interface TimelineEvent {
  title: string;
  time: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
}

export interface Order {
  id: string;
  clientName: string;
  address: string;
  phone: string;
  date: string;
  total: number;
  status: 'PENDIENTE' | 'PREPARANDO' | 'EN_RUTA' | 'ENTREGADO';
  motorizado: string | null;
  products: string;
  timeline: TimelineEvent[];
}

interface DataContextType {
  products: Product[];
  orders: Order[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  createOrder: (clientName: string, address: string, phone: string, items: any[], total: number) => string;
  assignMotorizado: (orderId: string, motorizadoId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, nextStatus: 'EN_RUTA' | 'ENTREGADO') => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS_MOCK);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProductsFromAPI();
        setProducts(data);
        console.log('Productos sincronizados exitosamente desde Supabase.');
      } catch (error) {
        console.warn('Usando catálogo local (fallback offline):', error);
      }
    };
    fetchProducts();
  }, []);

  // Órdenes iniciales de demostración
  const [orders, setOrders] = useState<Order[]>([
    { 
      id: 'NE-49201', 
      clientName: 'Gabriela Alva', 
      address: 'Av. Javier Prado Este 1024, San Borja', 
      phone: '987 654 321',
      date: '29/05/2026', 
      total: 420.00, 
      status: 'PENDIENTE', 
      motorizado: null,
      products: 'Oud Mystique (100ml) x1',
      timeline: [
        { title: 'Pedido Confirmado', time: '10:14 AM', description: 'Tu transacción ha sido validada de forma exitosa. Transmitido a bodega central.', status: 'completed' },
        { title: 'Preparación y Embalaje de Lujo', time: 'Estimado', description: 'Tu fragancia será sellada y empaquetada con envoltura protectora Noir Essence.', status: 'pending' },
        { title: 'En Camino a tu Destino', time: 'Estimado', description: 'El motorizado exclusivo saldrá del centro de distribución cuando sea asignado.', status: 'pending' },
        { title: 'Entrega en Puerta', time: 'Estimado', description: 'Fragancia entregada en mano propia bajo protocolos de seguridad.', status: 'pending' }
      ]
    },
    { 
      id: 'NE-38290', 
      clientName: 'Mateo Quispe', 
      address: 'Calle Las Flores 451, Miraflores', 
      phone: '955 123 456',
      date: '29/05/2026', 
      total: 760.00, 
      status: 'PREPARANDO', 
      motorizado: 'Juan Motorizado',
      products: 'Nuit Intense (100ml) x2',
      timeline: [
        { title: 'Pedido Confirmado', time: '09:30 AM', description: 'Tu transacción ha sido validada de forma exitosa. Transmitido a bodega central.', status: 'completed' },
        { title: 'Preparación y Embalaje de Lujo', time: '09:50 AM', description: 'Tu fragancia ha sido sellada y empaquetada con envoltura protectora Noir Essence.', status: 'completed' },
        { title: 'En Camino a tu Destino', time: 'En espera', description: 'El motorizado iniciará la ruta del despacho en breve.', status: 'active' },
        { title: 'Entrega en Puerta', time: 'Estimado', description: 'Fragancia entregada en mano propia.', status: 'pending' }
      ]
    },
    { 
      id: 'NE-28301', 
      clientName: 'Lucía Mendoza', 
      address: 'Jr. Ica 298, Centro de Lima', 
      phone: '944 888 777',
      date: '28/05/2026', 
      total: 310.00, 
      status: 'ENTREGADO', 
      motorizado: 'Juan Motorizado',
      products: 'Citron Sauvage (200ml) x1',
      timeline: [
        { title: 'Pedido Confirmado', time: '03:15 PM', description: 'Tu transacción ha sido validada de forma exitosa.', status: 'completed' },
        { title: 'Preparación y Embalaje de Lujo', time: '03:30 PM', description: 'Empacado y sellado completado.', status: 'completed' },
        { title: 'En Camino a tu Destino', time: '03:45 PM', description: 'El motorizado va en ruta.', status: 'completed' },
        { title: 'Entrega en Puerta', time: '04:15 PM', description: 'Entregado de manera exitosa en mano propia.', status: 'completed' }
      ]
    },
    { 
      id: 'NE-18302', 
      clientName: 'Daniel Rojas', 
      address: 'Av. La Marina 1520, San Miguel', 
      phone: '922 333 444',
      date: '28/05/2026', 
      total: 490.00, 
      status: 'PENDIENTE', 
      motorizado: null,
      products: 'Ambre Céleste (100ml) x1',
      timeline: [
        { title: 'Pedido Confirmado', time: '08:00 AM', description: 'Tu transacción ha sido validada de forma exitosa. Transmitido a bodega central.', status: 'completed' },
        { title: 'Preparación y Embalaje de Lujo', time: 'Estimado', description: 'Tu fragancia será sellada y empaquetada con envoltura protectora.', status: 'pending' },
        { title: 'En Camino a tu Destino', time: 'Estimado', description: 'Esperando asignación de motorizado.', status: 'pending' },
        { title: 'Entrega en Puerta', time: 'Estimado', description: 'Fragancia entregada en mano propia.', status: 'pending' }
      ]
    }
  ]);

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    if (token) {
      try {
        const createdProduct = await createProductAPI(newProduct, token);
        setProducts((prev: Product[]) => [createdProduct, ...prev]);
      } catch (error) {
        console.error('Error al guardar el producto en la base de datos:', error);
        setProducts((prev: Product[]) => {
          const nextId = (prev.length + 1).toString();
          return [...prev, { ...newProduct, id: nextId }];
        });
      }
    } else {
      setProducts((prev: Product[]) => {
        const nextId = (prev.length + 1).toString();
        return [...prev, { ...newProduct, id: nextId }];
      });
    }
  };

  const createOrder = (clientName: string, address: string, phone: string, items: any[], total: number): string => {
    const orderId = `NE-${Math.floor(100000 + Math.random() * 900000)}`;
    const productsString = items.map(i => `${i.product.name} (${i.product.size}) x${i.quantity}`).join(', ');
    
    // Obtener hora actual formateada
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeStr = `${hours % 12 || 12}:${minutes} ${ampm}`;

    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    const newOrder: Order = {
      id: orderId,
      clientName,
      address,
      phone,
      date: dateStr,
      total,
      status: 'PENDIENTE',
      motorizado: null,
      products: productsString,
      timeline: [
        { title: 'Pedido Confirmado', time: timeStr, description: 'Tu transacción ha sido validada de forma exitosa. Transmitido a bodega central.', status: 'completed' },
        { title: 'Preparación y Embalaje de Lujo', time: 'Estimado', description: 'Tu fragancia será sellada y empaquetada con envoltura protectora Noir Essence.', status: 'pending' },
        { title: 'En Camino a tu Destino', time: 'Estimado', description: 'El motorizado exclusivo saldrá del centro de distribución cuando sea asignado.', status: 'pending' },
        { title: 'Entrega en Puerta', time: 'Estimado', description: 'Fragancia entregada en mano propia bajo protocolos de seguridad.', status: 'pending' }
      ]
    };

    setOrders((prev: Order[]) => [newOrder, ...prev]);
    return orderId;
  };

  const assignMotorizado = async (orderId: string, motorizadoId: string) => {
    if (token) {
      try {
        const response = await assignMotorizadoAPI(orderId, motorizadoId, token);
        const motorizadoName = response.motorizado?.nombre || 'Motorizado';

        const now = new Date();
        const timeStr = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

        setOrders((prev: Order[]) => prev.map((order: Order) => {
          if (order.id === orderId) {
            const nextTimeline = order.timeline.map((event: TimelineEvent, idx: number) => {
              if (idx === 1) {
                // Embalaje completado tras la asignación
                return { ...event, status: 'completed' as const, time: timeStr };
              }
              if (idx === 2) {
                // Siguiente evento activo
                return { ...event, status: 'active' as const, description: `Asignado a ${motorizadoName}. El motorizado iniciará la ruta en breve.` };
              }
              return event;
            });
            return {
              ...order,
              motorizado: motorizadoName,
              status: 'PREPARANDO',
              timeline: nextTimeline,
            };
          }
          return order;
        }));
      } catch (error) {
        console.error('Error al asignar motorizado en el backend:', error);
        alert('No se pudo guardar la asignación del motorizado en Supabase.');
      }
    } else {
      console.warn('Usuario no autenticado, asignando de manera local');
    }
  };

  const updateOrderStatus = (orderId: string, nextStatus: 'EN_RUTA' | 'ENTREGADO') => {
    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    setOrders((prev: Order[]) => prev.map((order: Order) => {
      if (order.id === orderId) {
        const nextTimeline = order.timeline.map((event: TimelineEvent, idx: number) => {
          if (nextStatus === 'EN_RUTA') {
            if (idx === 2) {
              return { ...event, status: 'completed' as const, time: timeStr, description: 'El motorizado exclusivo ha salido del centro de distribución y va en ruta.' };
            }
            if (idx === 3) {
              return { ...event, status: 'active' as const, time: `Estimado ${timeStr}` };
            }
          }
          if (nextStatus === 'ENTREGADO') {
            if (idx === 2) {
              return { ...event, status: 'completed' as const };
            }
            if (idx === 3) {
              return { ...event, status: 'completed' as const, time: timeStr, description: 'Fragancia entregada en mano propia bajo estrictos protocolos de bioseguridad.' };
            }
          }
          return event;
        });
        return {
          ...order,
          status: nextStatus,
          timeline: nextTimeline,
        };
      }
      return order;
    }));
  };

  return (
    <DataContext.Provider
      value={{
        products,
        orders,
        addProduct,
        createOrder,
        assignMotorizado,
        updateOrderStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
