# expo-odk-collect

Expo module to integrate with [ODK Collect](https://docs.getodk.org/collect-intro/) for Android. Provides a type-safe bridge between your React Native / Expo app and the ODK Collect data collection app via Android Intents and ContentProviders.

> **Platform support**: Android only. Web exports are no-ops with console warnings.

---

## Table of Contents

- [Installation](#installation)
- [Android Setup](#android-setup)
- [How it works](#how-it-works)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
  - [returnResult](#returnresult)
  - [getIntentExtra](#getintentextra)
  - [getIntentExtras](#getintentextras)
  - [getForms](#getforms)
  - [startODKCollect](#startodk-collect)
  - [openOdkForms](#openodkforms)
  - [getCurrentODKid](#getcurrentodkid)
  - [startInstanceUploaderList](#startinstanceuploadlist)
  - [checkIfopenByODKform](#checkifopenbyodkform)
  - [editODKInstance](#editodkinstance)
  - [sendODKInstance](#sendodkinstance)
- [Types](#types)
- [Constants](#constants)
- [Migration](#migration)
- [License](#license)

---

## Installation

```sh
npx expo install expo-odk-collect
```

Then run prebuild to generate native Android files:

```sh
npx expo prebuild
```

> Requires **Expo SDK 51** and an Android device or emulator with **ODK Collect** installed (`org.odk.collect.android`).

---

## Android Setup

The module automatically merges a `<queries>` declaration into your app's `AndroidManifest.xml` via manifest merge — no manual step needed.

If for any reason you need to add it manually, include the following inside the `<manifest>` tag of your `android/app/src/main/AndroidManifest.xml`:

```xml
<queries>
  <package android:name="org.odk.collect.android" />
</queries>
```

---

## How it works

This module enables your app to act as an **ODK Collect external app** — a pattern where ODK Collect launches your app as part of a form, waits for a result, and resumes the form with the data your app returns.

The full flow:

1. **ODK Collect opens your app** via `startActivityForResult`. The form can pass field values as Intent extras (e.g. a UUID, a record ID, a status flag).

2. **Your app reads those extras** using `getIntentExtras()` (all fields) or `getIntentExtra(key)` (a single field). This lets you know which record the form is asking about.

3. **The user interacts** with your app — browses a list, selects a record, fills a local form, etc.

4. **Your app calls `returnResult(data)`**. This calls `setResult(RESULT_OK)` on the Android Activity, packs `data` as Intent extras, and calls `finish()`. ODK Collect receives the result and continues the form with the returned values.

**Full example:**

```tsx
import { getIntentExtras, getIntentExtra, returnResult } from 'expo-odk-collect';

// 1. Read what the form sent
const extras = getIntentExtras();
// → { uuid: "abc-123", record_type: "survey", record_id: "42", ... }

// 2. Read a specific field
const recordId = getIntentExtra('record_id'); // "42"

// 3. Return the result to ODK (closes the app)
await returnResult(
  { selected_id: '99', selected_name: 'Site Alpha' },
  {
    onBeforeReturn: async (data) => {
      // Persist to your own API before handing control back to ODK
      await myApi.save({ ...data, uuid_odk: getIntentExtra('uuid') });
    },
  }
);
```

---

## Error Handling

The module emits an `onError` event (instead of throwing) for runtime failures. Listen for it using `useEvent` from `expo-modules-core`:

```tsx
import { useEvent } from 'expo-modules-core';
import { OdkCollectModule } from 'expo-odk-collect';
import type { OdkErrorPayload } from 'expo-odk-collect';

export function useOdkErrors() {
  useEvent(OdkCollectModule, 'onError', (event: OdkErrorPayload) => {
    console.error(`[ODK] ${event.code}: ${event.message}`);

    switch (event.code) {
      case 'ODK_NOT_INSTALLED':
        Alert.alert(
          'ODK Collect not found',
          'Please install ODK Collect to use this feature.'
        );
        break;
      case 'ACTIVITY_NOT_AVAILABLE':
        Alert.alert('Error', 'Could not open ODK Collect screen.');
        break;
      case 'FORMS_QUERY_FAILED':
        Alert.alert('Error', 'Could not read forms from ODK Collect.');
        break;
    }
  });
}
```

### Error Codes

| Code | When it fires |
|------|---------------|
| `ODK_NOT_INSTALLED` | ODK Collect is not installed on the device |
| `ACTIVITY_NOT_AVAILABLE` | The requested ODK Collect screen could not be opened |
| `FORMS_QUERY_FAILED` | The ContentProvider query for forms failed |

---

## API Reference

### `returnResult`

> **Android only.**

Sends data back to the ODK Collect form that opened your app. Optionally runs an async callback **before** returning data to ODK — use it to persist records to your own API.

Internally calls `setResult(RESULT_OK)` with `data` packed as Intent extras, then calls `finish()`.

```ts
returnResult<TData extends Record<string, unknown>>(
  data: TData,
  options?: ReturnResultOptions<TData>
): Promise<void>
```

**Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `data` | `TData` | Key-value object to send back to the ODK form |
| `options.onBeforeReturn` | `(data: TData) => Promise<void>` | Optional async callback executed before the result is sent |

**Example — basic**

```tsx
import { returnResult } from 'expo-odk-collect';

await returnResult({ record_id: '42', record_name: 'Survey North' });
```

**Example — with pre-sync callback**

```tsx
import { returnResult, getIntentExtra } from 'expo-odk-collect';

await returnResult(formData, {
  onBeforeReturn: async (data) => {
    const uuid = getIntentExtra('uuid'); // field sent by the ODK form
    if (uuid) {
      await myApi.createRecord({ ...data, uuid_odk: uuid });
    }
  },
});
```

---

### `getIntentExtra`

> **Android only.**

Reads a single field from the Intent extras of the current Activity. Returns the value as a string, or `null` if the key is not present.

Use this when ODK Collect passes specific form fields to your app when launching it.

```ts
getIntentExtra(key: string): string | null
```

**Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `key` | `string` | The Intent extra key to read |

**Example**

```tsx
import { getIntentExtra } from 'expo-odk-collect';

const recordId = getIntentExtra('record_id'); // "42" or null
const uuid     = getIntentExtra('uuid');       // "abc-123" or null
```

---

### `getIntentExtras`

> **Android only.**

Reads **all** Intent extras from the current Activity as a flat key-value object. Useful for debugging or when you don't know in advance which fields the form will send.

```ts
getIntentExtras(): Record<string, string>
```

**Example**

```tsx
import { getIntentExtras } from 'expo-odk-collect';

const extras = getIntentExtras();
// → { uuid: "abc-123", record_type: "survey", record_id: "42" }

console.log(Object.keys(extras)); // see all fields ODK sent
```

---

### `getForms`

Returns the list of ODK Collect form instances by querying the ODK ContentProvider.

```ts
getForms(): OdkFormInstance[]
```

Emits `onError` with code `ODK_NOT_INSTALLED` if ODK Collect is not present, or `FORMS_QUERY_FAILED` if the query fails.

**Example**

```tsx
import { getForms } from 'expo-odk-collect';
import type { OdkFormInstance } from 'expo-odk-collect';

const forms: OdkFormInstance[] = getForms();
forms.forEach(f => console.log(f.displayName, f.status));
```

---

### `startODKCollect`

Opens the ODK Collect main screen.

```ts
startODKCollect(): void
```

**Example**

```tsx
import { startODKCollect } from 'expo-odk-collect';

<Button title="Open ODK Collect" onPress={startODKCollect} />
```

---

### `openOdkForms`

Opens the ODK Collect form list screen (where users can start filling a form).

```ts
openOdkForms(): void
```

**Example**

```tsx
import { openOdkForms } from 'expo-odk-collect';

<Button title="Browse Forms" onPress={openOdkForms} />
```

---

### `getCurrentODKid`

Reads the ODK instance UUID from the current Android Activity's intent. Returns `""` if there is no UUID in the intent (i.e. the app was not opened by ODK Collect with a form context).

```ts
getCurrentODKid(): string  // e.g. "uuid:550e8400-e29b-41d4-a716-446655440000"
```

**Example**

```tsx
import { getCurrentODKid } from 'expo-odk-collect';

const rawId = getCurrentODKid();          // "uuid:550e8400-..." or ""
const uuid = rawId.split(':')[1] ?? null; // "550e8400-..." or null
```

> **Tip**: always guard against the empty string before splitting.

---

### `startInstanceUploaderList`

Opens the ODK Collect instance uploader screen, where users can review and manually upload completed forms.

```ts
startInstanceUploaderList(): void
```

**Example**

```tsx
import { startInstanceUploaderList } from 'expo-odk-collect';

<Button title="Upload Forms" onPress={startInstanceUploaderList} />
```

---

### `checkIfopenByODKform`

Returns `true` if the current Activity was opened by ODK Collect (i.e. the Android referrer matches `android-app://org.odk.collect.android`).

Use this to conditionally show or hide UI based on whether the app is acting as an ODK external app.

```ts
checkIfopenByODKform(): boolean
```

**Example**

```tsx
import { checkIfopenByODKform } from 'expo-odk-collect';

const isOdkContext = checkIfopenByODKform();

if (isOdkContext) {
  // Show ODK-specific UI (record selector, form data, etc.)
} else {
  // Show normal app UI
}
```

---

### `editODKInstance`

Opens ODK Collect to edit a specific form instance by its ID.

```ts
editODKInstance(instanceId: string): void
```

**Example**

```tsx
import { editODKInstance } from 'expo-odk-collect';

editODKInstance('550e8400-e29b-41d4-a716-446655440000');
```

---

### `sendODKInstance`

Triggers an upload of a specific form instance to the given ODK server URL.

```ts
sendODKInstance(instanceId: string, serverUrl: string): void
```

**Example**

```tsx
import { sendODKInstance } from 'expo-odk-collect';

sendODKInstance(
  '550e8400-e29b-41d4-a716-446655440000',
  'https://my-odk-server.example.com'
);
```

---

## Types

```ts
import type {
  OdkFormInstance,
  OdkErrorPayload,
  OdkErrorCode,
  OdkCollectConfig,
  ReturnResultOptions,
} from 'expo-odk-collect';
```

### `OdkFormInstance`

Represents a single ODK Collect form instance returned by `getForms()`.

```ts
type OdkFormInstance = {
  _id: string;           // Internal ContentProvider row ID
  displayName: string;   // Human-readable form name
  jrFormId: string;      // JavaRosa form ID
  jrVersion: string;     // Form version string
  status: string;        // e.g. "incomplete", "complete"
  date: string;          // Last modified date (ms since epoch as string)
  deletedDate: string;   // Deletion date if soft-deleted, otherwise ""
};
```

### `OdkErrorPayload`

Event payload emitted via the `onError` event.

```ts
type OdkErrorPayload = {
  code: OdkErrorCode;
  message: string;
  details?: string;   // Optional extra diagnostic info
};

type OdkErrorCode =
  | 'ODK_NOT_INSTALLED'
  | 'ACTIVITY_NOT_AVAILABLE'
  | 'FORMS_QUERY_FAILED';
```

### `ReturnResultOptions<TData>`

Options for `returnResult`.

```ts
type ReturnResultOptions<TData extends Record<string, unknown> = Record<string, unknown>> = {
  onBeforeReturn?: (data: TData) => Promise<void>;
};
```

### `OdkCollectConfig` *(future use)*

Configuration type intended for future use by consumers. Not yet consumed by the module itself.

```ts
type OdkCollectConfig = {
  odkPackageId?: string;  // Default: 'org.odk.collect.android'
  serverUrl?: string;
  messages?: {
    odkNotFound?: string;
    genericError?: string;
    odkAccessError?: string;
  };
};
```

---

## Constants

```ts
import { ODK_REFERRER } from 'expo-odk-collect';

// ODK_REFERRER = 'android-app://org.odk.collect.android'
```

Used internally by `checkIfopenByODKform()`. Export it in case your app needs to compare referrers in custom logic.

---

## Migration

### From v1

If you were using `getCurrentODKid()` to read the ODK UUID, switch to `getIntentExtra` — it gives you direct access to any field the form sends, not just the UUID:

```ts
// Before (v1) — only UUID, via a raw string parse
import { getCurrentODKid } from 'expo-odk-collect';

const rawId = getCurrentODKid();    // "uuid:abc-123"
const uuid  = rawId.split(':')[1];  // "abc-123"

// After (v2) — any Intent extra, by name
import { getIntentExtra, getIntentExtras } from 'expo-odk-collect';

const uuid      = getIntentExtra('uuid');      // "abc-123"
const recordId  = getIntentExtra('record_id'); // "42"
const allExtras = getIntentExtras();           // { uuid: "abc-123", record_id: "42", ... }
```

> `getCurrentODKid()` still works — it now delegates to `getIntentExtra('uuid')` internally.

---

## License

MIT © [nuup](https://nuup.mx)
