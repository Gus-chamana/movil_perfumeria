const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro Configuration for Expo with PNPM Symlink Support
 * 
 * En Windows, al utilizar PNPM, las dependencias se guardan como enlaces simbólicos (symlinks) 
 * dentro de la carpeta oculta `.pnpm`. Esto causa que el Metro Bundler se pierda al intentar 
 * buscar el archivo de entrada 'App.tsx' en la raíz.
 * 
 * Habilitar 'unstable_enableSymlinks' le indica a Metro que siga y resuelva correctamente 
 * los enlaces simbólicos de pnpm.
 */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
