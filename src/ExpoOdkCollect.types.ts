export type OdkErrorCode =
  | 'ODK_NOT_INSTALLED'
  | 'ACTIVITY_NOT_AVAILABLE'
  | 'FORMS_QUERY_FAILED';

export type OdkErrorPayload = {
  code: OdkErrorCode;
  message: string;
  details?: string;
};

export type OdkFormInstance = {
  _id: string;
  displayName: string;
  jrFormId: string;
  jrVersion: string;
  status: string;
  date: string;
  deletedDate: string;
};

export type OdkCollectConfig = {
  odkPackageId?: string;
  serverUrl?: string;
  messages?: {
    odkNotFound?: string;
    genericError?: string;
    odkAccessError?: string;
  };
};

export type ReturnResultOptions<TData extends Record<string, unknown> = Record<string, unknown>> = {
  onBeforeReturn?: (data: TData) => Promise<void>;
};

export type ChangeEventPayload = {
  value: string;
};

export type OdkModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onError: (params: OdkErrorPayload) => void;
};
