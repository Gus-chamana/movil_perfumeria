import { PrismaClient } from '@prisma/client';

// Inicialización de la instancia única de Prisma Client para toda la API (Patrón Singleton)
const prisma = new PrismaClient();

export default prisma;
