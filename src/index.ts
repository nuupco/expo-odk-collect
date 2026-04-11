// Reexport the native module. On web, it will be resolved to ExpoOdkCollectModule.web.ts
// and on native platforms to ExpoOdkCollectModule.ts
export { default } from './ExpoOdkCollectModule';
export { default as ExpoOdkCollectView } from './ExpoOdkCollectView';
export * from  './ExpoOdkCollect.types';
