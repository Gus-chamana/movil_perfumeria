export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: 'Amaderados' | 'Florales' | 'Cítricos' | 'Orientales';
  gender: 'men' | 'women' | 'unisex';
  size: '50ml' | '100ml' | '200ml';
  concentration: 'Eau de Parfum' | 'Parfum' | 'Eau de Toilette';
  isNew: boolean;
  description: string;
}

export const PRODUCTS_MOCK: Product[] = [
  {
    id: '1',
    brand: 'Noir Essence',
    name: 'Oud Mystique',
    price: 420.00,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400',
    category: 'Amaderados',
    gender: 'unisex',
    size: '100ml',
    concentration: 'Parfum',
    isNew: true,
    description: 'Una fragancia oscura y cautivadora, dominada por notas profundas de madera de Oud silvestre, sándalo cremoso y un toque de ámbar negro refinado. Ideal para las noches de misterio absoluto.'
  },
  {
    id: '2',
    brand: 'Noir Essence',
    name: 'Nuit Intense',
    price: 380.00,
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=400',
    category: 'Orientales',
    gender: 'men',
    size: '100ml',
    concentration: 'Eau de Parfum',
    isNew: true,
    description: 'El perfume definitivo para el hombre magnético. Una rica combinación de pimienta negra especiada, vainilla de Madagascar y cuero italiano curado. Intenso, audaz y persistente.'
  },
  {
    id: '3',
    brand: 'Noir Essence',
    name: 'Jardin d’Or',
    price: 360.00,
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=400',
    category: 'Florales',
    gender: 'women',
    size: '50ml',
    concentration: 'Eau de Parfum',
    isNew: false,
    description: 'Un viaje sensorial a través de un jardín bañado por el sol dorado. Notas de salida de jazmín sambac, seguidas por rosa de Grasse de terciopelo y un sutil fondo almizclado.'
  },
  {
    id: '4',
    brand: 'Noir Essence',
    name: 'Citron Sauvage',
    price: 310.00,
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400',
    category: 'Cítricos',
    gender: 'unisex',
    size: '200ml',
    concentration: 'Eau de Toilette',
    isNew: false,
    description: 'Frescúra cítrica elevada a su máxima expresión de lujo. Bergamota de Calabria triturada, menta helada y un toque de madera flotante marina. Estimulante y profundamente sofisticado.'
  },
  {
    id: '5',
    brand: 'Noir Essence',
    name: 'Ambre Céleste',
    price: 490.00,
    imageUrl: 'https://images.unsplash.com/photo-1588405748373-122b2321bc31?q=80&w=400',
    category: 'Orientales',
    gender: 'women',
    size: '100ml',
    concentration: 'Parfum',
    isNew: true,
    description: 'Una joya celestial de alta perfumería. Ámbar gris puro, resinas exóticas de incienso de Omán y un corazón cremoso de haba tonka tostada. Una experiencia opulenta que envuelve los sentidos.'
  },
  {
    id: '6',
    brand: 'Noir Essence',
    name: 'Forêt Royale',
    price: 395.00,
    imageUrl: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=400',
    category: 'Amaderados',
    gender: 'men',
    size: '100ml',
    concentration: 'Eau de Parfum',
    isNew: false,
    description: 'La serenidad majestuosa de un bosque antiguo. Notas robustas de cedro del Atlas, vetiver ahumado e higo maduro que aportan un equilibrio terroso insuperable.'
  }
];
