const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Vigilar la carpeta raíz del paquete para que Metro resuelva
// expo-odk-collect correctamente desde el monorepo local.
config.watchFolders = [...(config.watchFolders || []), packageRoot];

// Bloquear los node_modules del paquete padre para evitar conflictos
// con versiones duplicadas de react / react-native.
const blockListPatterns = [
  // via symlink (node_modules/expo-odk-collect/node_modules)
  new RegExp(
    path.resolve(__dirname, 'node_modules/expo-odk-collect/node_modules').replace(/[/\\]/g, '[/\\\\]')
  ),
  // via ruta real (../node_modules)
  new RegExp(
    path.resolve(packageRoot, 'node_modules').replace(/[/\\]/g, '[/\\\\]')
  ),
];

config.resolver.blockList = blockListPatterns;

module.exports = config;
