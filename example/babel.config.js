const path = require('path');

module.exports = function (api) {
  api.cache(true);

  // Apuntamos explícitamente al babel-preset-expo que está dentro del
  // directorio de expo/ para que pueda resolver expo-router desde
  // example/node_modules/.
  //
  // En este monorepo, babel-preset-expo del root NO tiene expo-router en su
  // scope de resolución (expo-router solo está en example/node_modules/).
  // Sin este fix, hasModule('expo-router') devuelve false → el plugin
  // expoRouterBabelPlugin nunca se agrega → EXPO_ROUTER_APP_ROOT nunca
  // se reemplaza → error al bundlear.
  const expoDir = path.dirname(require.resolve('expo/package.json'));
  const babelPresetExpo = require.resolve('babel-preset-expo', { paths: [expoDir] });

  return {
    presets: [babelPresetExpo],
  };
};
