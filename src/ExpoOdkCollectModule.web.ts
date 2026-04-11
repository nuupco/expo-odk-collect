import { registerWebModule, NativeModule } from 'expo';

import { ExpoOdkCollectModuleEvents } from './ExpoOdkCollect.types';

class ExpoOdkCollectModule extends NativeModule<ExpoOdkCollectModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoOdkCollectModule, 'ExpoOdkCollectModule');
