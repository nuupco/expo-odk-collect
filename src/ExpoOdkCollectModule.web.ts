import { NativeModule, requireNativeModule } from 'expo';
import { OdkModuleEvents } from './ExpoOdkCollect.types';


const warn = (fn: string) =>
  console.warn(
    `[expo-odk-collect] ${fn}() is not available on web. ODK Collect is an Android-only app.`
  );

class OdkCollectModule extends NativeModule<OdkModuleEvents> {
  isInstalled(): boolean {
    warn('isInstalled');
    return false;
  }

  launchCollect(): void {
    warn('launchCollect');
  }

  isOpenedByOdk(): boolean {
    warn('isOpenedByOdk');
    return false;
  }

  getForms(): Record<string, any>[] {
    warn('getForms');
    return [];
  }

  getInstances(): Record<string, any>[] {
    warn('getInstances');
    return [];
  }

  openFormsList(): void {
    warn('openFormsList');
  }

  openInstancesList(): void {
    warn('openInstancesList');
  }

  pickForm(): void {
    warn('pickForm');
  }

  pickInstance(): void {
    warn('pickInstance');
  }

  editInstance(instanceId: string): void {
    warn('editInstance');
  }

  returnResult(data: Record<string, unknown>): void {
    warn('returnResult');
  }

  getIntentExtras(): Record<string, string> {
    warn('getIntentExtras');
    return {};
  }
}


export default requireNativeModule<OdkCollectModule>('OdkCollect');