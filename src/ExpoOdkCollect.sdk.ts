import { EventEmitter } from 'expo-modules-core';

import { normalizeForm, normalizeInstance } from './ExpoOdkCollect.normalizer';
import {
  OdkForm,
  OdkInstance,
  OdkActivityResult,
  OdkErrorPayload,
  OdkSubscription,
  OdkModuleEvents,
} from './ExpoOdkCollect.types';
import OdkNative from './ExpoOdkCollectModule';

const emitter = new EventEmitter<OdkModuleEvents>(OdkNative);

export interface OdkClient {
  /** Returns true if ODK Collect is installed on the device. */
  isInstalled(): Promise<boolean>;

  /** Launches the ODK Collect main screen. */
  launch(): void;

  /** Returns true if the current Activity was opened by ODK Collect. */
  isOpenedByOdk(): Promise<boolean>;
  /** Queries the ODK ContentProvider and returns all forms. */
  getForms(): Promise<OdkForm[]>;

  /** Queries the ODK ContentProvider and returns all instances. */
  getInstances(): Promise<OdkInstance[]>;

  /** Opens the ODK Collect forms list screen. */
  openForms(): void;

  /** Opens the ODK Collect instances (uploader) list screen. */
  openInstances(): void;

  /**
   * Starts an ACTION_PICK intent for forms.
   * The selected form URI is returned via the `onActivityResult` event.
   */
  pickForm(): void;

  /**
   * Starts an ACTION_PICK intent for instances.
   * The selected instance URI is returned via the `onActivityResult` event.
   */
  pickInstance(): void;

  /**
   * Opens ODK Collect to edit the instance with the given ID.
   * Completion is signalled via the `onActivityResult` event.
   */
  editInstance(instanceId: string): void;

  /**
   * Opens ODK Collect to fill a blank form with the given form ID.
   * The created instance URI is returned via the `onActivityResult` event.
   */
  fillForm(formId: string): void;

  /**
   * Returns data to the ODK Collect form that opened this app and closes the
   * Activity. Must be called from an Activity opened by ODK Collect.
   */
  returnResult(data: Record<string, any>): void;

  /** Returns all Intent extras from the current Activity as a flat string map. */
  getIntentExtras(): Promise<Record<string, string>>;

  /** Subscribes to activity results (pickForm, pickInstance, editInstance). */
  onResult(callback: (event: OdkActivityResult) => void): OdkSubscription;

  /** Subscribes to module errors emitted by the native layer. */
  onError(callback: (event: OdkErrorPayload) => void): OdkSubscription;
}

export const odk: OdkClient = {
  isInstalled() {
    return Promise.resolve(OdkNative.isInstalled());
  },

  launch() {
    OdkNative.launchCollect();
  },

  isOpenedByOdk() {
    return Promise.resolve(OdkNative.isOpenedByOdk());
  },

  async getForms() {
    const raw = await OdkNative.getForms();
    return raw.map(normalizeForm);
  },

  async getInstances() {
    const raw = await OdkNative.getInstances();
    return raw.map(normalizeInstance);
  },

  openForms() {
    OdkNative.openFormsList();
  },

  openInstances() {
    OdkNative.openInstancesList();
  },

  pickForm() {
    OdkNative.pickForm();
  },

  pickInstance() {
    OdkNative.pickInstance();
  },

  editInstance(instanceId: string) {
    OdkNative.editInstance(instanceId);
  },

  fillForm(formId: string) {
    OdkNative.fillForm(formId);
  },

  returnResult(data) {
    OdkNative.returnResult(data);
  },

  getIntentExtras() {
    return Promise.resolve(OdkNative.getIntentExtras());
  },

  onResult(callback) {
    const sub = emitter.addListener('onActivityResult', callback);
    return { remove: () => sub.remove() };
  },

  onError(callback) {
    const sub = emitter.addListener('onError', callback);
    return { remove: () => sub.remove() };
  },
};
