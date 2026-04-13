// -------- ERRORS --------

export type OdkErrorCode =
  | 'ODK_NOT_INSTALLED'
  | 'ACTIVITY_NOT_FOUND'
  | 'QUERY_FAILED'
  | 'INVALID_INTENT'
  | 'UNKNOWN_ERROR';

export type OdkErrorPayload = {
  code: OdkErrorCode;
  message: string;
  details?: string;
};

// -------- BASE --------

export type OdkBaseEntity = {
  id: string;
  displayName: string;
};

// -------- FORMS --------

export type OdkForm = OdkBaseEntity & {
  jrFormId: string;
  jrVersion?: string;
};

// -------- INSTANCES --------

export type OdkInstanceStatus =
  | 'incomplete'
  | 'complete'
  | 'submitted'
  | 'submissionFailed'
  | 'unknown';

export type OdkInstance = OdkBaseEntity & {
  instanceId: string;
  jrFormId: string;
  jrVersion?: string;
  status: OdkInstanceStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

// -------- ACTIVITY RESULT --------

export type OdkActivityResult = {
  requestCode: number;
  resultCode: number;
  uri?: string;
};

// -------- INTENT EXTRAS --------

export type OdkIntentExtras = Record<string, string>;

// -------- MODULE EVENTS --------

export type OdkModuleEvents = {
  onActivityResult: (params: OdkActivityResult) => void;
  onError: (params: OdkErrorPayload) => void;
};


export type OdkSubscription = {
  remove: () => void;
};


