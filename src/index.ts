import OdkCollectModule from './ExpoOdkCollectModule';
import {
  ChangeEventPayload,
  OdkCollectConfig,
  OdkErrorCode,
  OdkErrorPayload,
  OdkFormInstance,
  OdkModuleEvents,
  ReturnResultOptions,
} from './ExpoOdkCollect.types';

export type {
  ChangeEventPayload,
  OdkCollectConfig,
  OdkErrorCode,
  OdkErrorPayload,
  OdkFormInstance,
  OdkModuleEvents,
  ReturnResultOptions,
};

// Exported for consumers that need the native module instance directly,
// e.g. to use useEvent() from expo-modules-core to listen to native events.
export { OdkCollectModule };

// The referrer string used by ODK Collect when it opens the host app
export const ODK_REFERRER = 'android-app://org.odk.collect.android';

export async function returnResult<TData extends Record<string, unknown>>(
  data: TData,
  options?: ReturnResultOptions<TData>
): Promise<void> {
  if (options?.onBeforeReturn) {
    await options.onBeforeReturn(data);
  }
  OdkCollectModule.returnResult(data);
}

export function getForms(): OdkFormInstance[] {
  return OdkCollectModule.getForms();
}

export function startODKCollect(): void {
  return OdkCollectModule.startODKCollect();
}

export function openOdkForms(): void {
  return OdkCollectModule.openOdkForms();
}

export function getCurrentODKid(): string {
  return OdkCollectModule.getCurrentODKid();
}

export function startInstanceUploaderList(): void {
  return OdkCollectModule.startInstanceUploaderList();
}

export function checkIfopenByODKform(): boolean {
  const referrer = OdkCollectModule.checkIfopenByODKform();
  return ODK_REFERRER === referrer;
}

export function editODKInstance(instanceId: string): void {
  return OdkCollectModule.editODKInstance(String(instanceId));
}

export function sendODKInstance(instanceId: string, serverUrl: string): void {
  return OdkCollectModule.sendODKInstance(String(instanceId), serverUrl);
}

export function getIntentExtra(key: string): string {
  return OdkCollectModule.getIntentExtra(key);
}

export function getIntentExtras(): Record<string, unknown> {
  return OdkCollectModule.getIntentExtras();
}
