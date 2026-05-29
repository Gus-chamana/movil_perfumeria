import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno del archivo .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_no_utilizar_en_produccion',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || ''
};

// Validación simple de variables críticas
if (!process.env.DATABASE_URL) {
  console.warn('ADVERTENCIA: La variable DATABASE_URL no está definida en el entorno.');
}
if (!process.env.JWT_SECRET) {
  console.warn('ADVERTENCIA: La variable JWT_SECRET no está definida. Usando valor por defecto.');
}
