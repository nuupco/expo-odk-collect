import { NativeModule, registerWebModule } from 'expo';
import { OdkModuleEvents, OdkFormInstance } from './ExpoOdkCollect.types';

const warn = (fn: string) =>
  console.warn(
    `[expo-odk-collect] ${fn}() is not available on web. ODK Collect is an Android-only app.`
  );

class OdkCollectModule extends NativeModule<OdkModuleEvents> {
  returnResult(_data: Record<string, unknown>): void { warn('returnResult'); }
  getForms(): OdkFormInstance[] { warn('getForms'); return []; }
  openOdkForms(): void { warn('openOdkForms'); }
  startODKCollect(): void { warn('startODKCollect'); }
  startInstanceUploaderList(): void { warn('startInstanceUploaderList'); }
  getCurrentODKid(): string { warn('getCurrentODKid'); return ''; }
  checkIfopenByODKform(): string { warn('checkIfopenByODKform'); return ''; }
  getIntentExtra(_key: string): string { warn('getIntentExtra'); return ''; }
  getIntentExtras(): Record<string, unknown> { warn('getIntentExtras'); return {}; }
  editODKInstance(_instanceId: string): void { warn('editODKInstance'); }
  sendODKInstance(_instanceId: string, _serverUrl: string): void { warn('sendODKInstance'); }
}

export default registerWebModule(OdkCollectModule, 'OdkCollect');
