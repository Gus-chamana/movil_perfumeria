import { registerRootComponent } from 'expo';
import App from './App';

// Registra el componente raíz directamente desde la raíz del proyecto.
// Esto soluciona por completo el error de resolución de rutas relativas
// en entornos Windows que utilizan PNPM al evitar el acceso a través de .pnpm/expo/AppEntry.js.
registerRootComponent(App);
