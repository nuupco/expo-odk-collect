import { NativeModule, requireNativeModule } from 'expo';
import { OdkModuleEvents, OdkFormInstance } from './ExpoOdkCollect.types';

declare class OdkCollectModule extends NativeModule<OdkModuleEvents> {
  returnResult(data: Record<string, unknown>): void;
  getForms(): OdkFormInstance[];
  openOdkForms(): void;
  startODKCollect(): void;
  startInstanceUploaderList(): void;
  getCurrentODKid(): string;
  checkIfopenByODKform(): string;
  getIntentExtra(key: string): string;
  getIntentExtras(): Record<string, unknown>;
  editODKInstance(instanceId: string): void;
  sendODKInstance(instanceId: string, serverUrl: string): void;
}

export default requireNativeModule<OdkCollectModule>('OdkCollect');
