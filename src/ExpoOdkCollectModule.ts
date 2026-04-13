import { NativeModule, requireNativeModule } from 'expo';
import { OdkModuleEvents } from './ExpoOdkCollect.types';





declare class OdkCollectModule extends NativeModule<OdkModuleEvents> {
  isInstalled(): boolean;

  launchCollect(): void;

  isOpenedByOdk(): boolean;

  openFormsList(): void;
  openInstancesList(): void;

  pickForm(): void;
  pickInstance(): void;

  editInstance(instanceId: string): void;

  getForms(): Record<string, any>[];
  getInstances(): Record<string, any>[];

  getIntentExtras(): Record<string, string>;

  returnResult(data: Record<string, unknown>): void;
}

export default requireNativeModule<OdkCollectModule>('OdkCollect');