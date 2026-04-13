import { OdkForm, OdkInstance } from './ExpoOdkCollect.types';

export const normalizeForm = (raw: Record<string, any>): OdkForm => ({
  id: raw._id ?? '',
  displayName: raw.displayName ?? 'Sin nombre',
  jrFormId: raw.jrFormId ?? '',
  jrVersion: raw.jrVersion ?? undefined,
});

export const normalizeInstance = (raw: Record<string, any>): OdkInstance => ({
  id: raw._id ?? '',
  instanceId: raw._id ?? '',
  displayName: raw.displayName ?? 'Sin nombre',
  jrFormId: raw.jrFormId ?? '',
  jrVersion: raw.jrVersion ?? undefined,
  status: raw.status ?? 'unknown',
  createdAt: raw.date,
  deletedAt: raw.deletedDate,
});