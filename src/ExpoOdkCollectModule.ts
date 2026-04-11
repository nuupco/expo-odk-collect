import { NativeModule, requireNativeModule } from 'expo';

import { ExpoOdkCollectModuleEvents } from './ExpoOdkCollect.types';

declare class ExpoOdkCollectModule extends NativeModule<ExpoOdkCollectModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoOdkCollectModule>('ExpoOdkCollect');
