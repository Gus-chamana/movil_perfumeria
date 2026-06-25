import { getProducts } from './controllers/productController';
import { Request, Response } from 'express';

// Simular Express req y res
const req = {
  query: {}
} as unknown as Request;

const res = {
  status: (code: number) => {
    console.log(`📡 Código de respuesta HTTP: ${code}`);
    return res;
  },
  json: (data: any) => {
    console.log("📦 Datos devueltos por el endpoint:");
    console.log(JSON.stringify(data, null, 2));
    return res;
  }
} as unknown as Response;

async function run() {
  console.log("🏁 Simulando llamada al controlador getProducts()...");
  await getProducts(req, res);
}

run();
