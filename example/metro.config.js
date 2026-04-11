const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// Vigilar la carpeta raíz del paquete para que Metro resuelva
// expo-odk-collect correctamente desde el monorepo local.
config.watchFolders = [...(config.watchFolders || []), packageRoot];

// Cuando Metro resuelve imports desde ../src/ (el paquete en desarrollo),
// necesita encontrar 'expo', 'react', etc. en los node_modules del example.
// nodeModulesPaths le indica dónde buscar en orden.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Bloquear SOLO react y react-native del paquete raíz para evitar
// versiones duplicadas. NO bloqueamos expo ni otras peerDeps porque
// ../src/ las necesita resolver desde example/node_modules.
config.resolver.blockList = [
  new RegExp(
    path.resolve(packageRoot, 'node_modules', 'react') + path.sep
  ),
  new RegExp(
    path.resolve(packageRoot, 'node_modules', 'react-native') + path.sep
  ),
];

module.exports = config;
