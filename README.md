# @nuup/expo-odk-collect

![npm version](https://img.shields.io/npm/v/@nuup/expo-odk-collect?color=blue)
![license](https://img.shields.io/github/license/nuupco/expo-odk-collect)
![build status](https://github.com/nuupco/expo-odk-collect/actions/workflows/verify.yml/badge.svg)
![npm downloads](https://img.shields.io/npm/dm/@nuup/expo-odk-collect)
![GitHub issues](https://img.shields.io/github/issues/nuupco/expo-odk-collect)
![GitHub pull requests](https://img.shields.io/github/issues-pr/nuupco/expo-odk-collect)
Expo module to integrate with [ODK Collect](https://docs.getodk.org/collect-intro/) for Android. Provides a type-safe bridge between your React Native / Expo app and the ODK Collect data collection app via Android Intents and ContentProviders.

> **Platform support**: Android only.

> **Navigation support (current)**: at the moment, integration is documented and supported only with React Navigation.

---

## Table of Contents

- [Installation](#installation)
- [Android Setup](#android-setup)
- [External App Setup](#external-app-setup)
- [How it works](#how-it-works)
- [Usage](#usage)
  - [useOdk hook](#useodk-hook)
  - [odk client](#odk-client)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [Types](#types)
- [AI Agent Skills](#ai-agent-skills)
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

> Requires **Expo SDK 51+** and an Android device or emulator with **ODK Collect** installed (`org.odk.collect.android`).

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

## External App Setup

For your app to be **launched by ODK Collect** as an external app, you need two things in your `app.json`: a deep link scheme and the right `intentFilters`.

### 1. Configure `app.json`

```json
{
  "expo": {
    "scheme": "my-app",
    "android": {
      "launchMode": "singleTask",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": false,
          "data": [
            {
              "scheme": "my-app",
              "host": "*"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

> **`launchMode: "singleTask"`** — required so Android brings the existing Activity to the foreground instead of creating a new one on top. Without it, you may hit the _"App entry point named main was not registered"_ error when ODK relaunches your app.

> **`host: "*"`** — required on Android API 31+. Without the `host` attribute, the system ignores the `intent-filter` when resolving URIs that include a host component (e.g. `my-app://some-screen`). Using `"*"` matches any host under your scheme.

After editing `app.json`, run prebuild to regenerate the native Android files:

```sh
npx expo prebuild --platform android
# or
npx expo run:android
```

### 2. Configure the XLSForm

In your XLSForm, use `android.intent.action.VIEW` with `uri_data` to launch your app via deep link. This is the recommended approach because it creates a fresh Android Activity rather than reusing an existing one.

**Single field** (uses the `value` extra):

| type | name | appearance |
|------|------|------------|
| text | my_field | `ex:android.intent.action.VIEW(uri_data='my-app://external-app', uuid=${instanceID})` |

**Multiple fields** (uses a `field-list` group):

| type | name | appearance | body::intent |
|------|------|------------|--------------|
| begin_group | my_group | field-list | `android.intent.action.VIEW(uri_data='my-app://external-app', uuid=${instanceID})` |
| text | field_one | | |
| text | field_two | | |
| end_group | | | |

> **Note**: for the multi-field group, `body::intent` does **not** use the `ex:` prefix. For the single-field `appearance`, it **does** use `ex:`.

The field names inside the group must match exactly the keys you pass to `odk.returnResult()` in your app:

```tsx
odk.returnResult({
  field_one: 'value A',
  field_two: 'value B',
});
```

### 3. Read the extras in your app

When ODK Collect launches your app, it passes the extras you declared in the XLSForm (e.g. `uuid`). Read them with `odk.getIntentExtras()`:

```tsx
import { odk } from 'expo-odk-collect';

const extras = await odk.getIntentExtras();
console.log(extras.uuid); // e.g. "uuid:550e8400-..."
```

---

## How it works

This module enables your app to act as an **ODK Collect external app** — a pattern where ODK Collect launches your app as part of a form, waits for a result, and resumes the form with the data your app returns.

The full flow:

1. **ODK Collect opens your app** via `startActivityForResult`. The form can pass field values as Intent extras (e.g. a UUID, a record ID, a status flag).

2. **Your app reads those extras** using `odk.getIntentExtras()`. This lets you know which record the form is asking about.

3. **The user interacts** with your app — browses a list, selects a record, fills a local form, etc.

4. **Your app calls `odk.returnResult(data)`**. This calls `setResult(RESULT_OK)` on the Android Activity, packs `data` as Intent extras, and calls `finish()`. ODK Collect receives the result and continues the form with the returned values.

---

## Usage

### `useOdk` hook

The recommended way to use the module. Returns the `odk` client and reactive state for results and errors.

```tsx
import { useOdk } from 'expo-odk-collect';

function MyScreen() {
  const { odk, result, error } = useOdk();

  // result → last OdkActivityResult (from pickForm, pickInstance, editInstance)
  // error  → last OdkErrorPayload from the native module
}
```

### `odk` client

You can also import the `odk` client directly without the hook:

```tsx
import { odk } from 'expo-odk-collect';

// Check installation
const installed = await odk.isInstalled();

// Detect if the Activity was opened by ODK Collect
const openedByOdk = await odk.isOpenedByOdk();

// Open ODK Collect screens
odk.launch();
odk.openForms();
odk.openInstances();

// Pick a form or instance (result arrives via onResult callback)
odk.pickForm();
odk.pickInstance();

// Edit an existing instance
odk.editInstance('42');

// Query data
const forms     = await odk.getForms();     // OdkForm[]
const instances = await odk.getInstances(); // OdkInstance[]

// Read Intent extras (when opened by ODK Collect)
const extras = await odk.getIntentExtras(); // Record<string, string>

// Return result to ODK and close the app
odk.returnResult({ field_one: 'value', field_two: 'other' });

// Subscribe to events
const sub = odk.onResult((result) => {
  console.log(result.requestCode, result.resultCode, result.uri);
});
sub.remove(); // cleanup
```

**Full external app example:**

```tsx
import { useEffect, useState } from 'react';
import { Button } from 'react-native';
import { useOdk } from 'expo-odk-collect';

export default function ExternalAppScreen() {
  const { odk } = useOdk();
  const [uuid, setUuid] = useState<string | null>(null);
  const [openedByOdk, setOpenedByOdk] = useState(false);

  useEffect(() => {
    odk.isOpenedByOdk().then(setOpenedByOdk);
    odk.getIntentExtras().then((extras) => {
      const raw = extras['uuid'];
      if (raw) setUuid(raw.includes(':') ? raw.split(':')[1] : raw);
    });
  }, []);

  function handleReturn() {
    if (!openedByOdk) return; // guard: only call when opened by ODK
    odk.returnResult({
      selected_id: '99',
      selected_name: 'Site Alpha',
    });
  }

  return <Button title="Enviar a ODK" onPress={handleReturn} />;
}
```

---

## Error Handling

The module emits an `onError` event (instead of throwing) for runtime failures. Listen to it via the `useOdk` hook or subscribing directly:

```tsx
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useOdk } from 'expo-odk-collect';

function useOdkErrors() {
  const { error } = useOdk();

  useEffect(() => {
    if (!error) return;
    Alert.alert(`Error ODK [${error.code}]`, error.message);
  }, [error]);
}
```

Or directly with the `odk` client:

```tsx
import { odk } from 'expo-odk-collect';

const sub = odk.onError((event) => {
  console.error(`[ODK] ${event.code}: ${event.message}`);
});
// sub.remove() to stop listening
```

### Error Codes

| Code | When it fires |
|------|---------------|
| `ODK_NOT_INSTALLED` | ODK Collect is not installed on the device |
| `ACTIVITY_NOT_FOUND` | The requested ODK Collect screen could not be opened |
| `QUERY_FAILED` | The ContentProvider query failed |
| `INVALID_INTENT` | The Intent could not be resolved |
| `UNKNOWN_ERROR` | Unexpected native error |

---

## API Reference

### `odk.isInstalled()`

Returns `Promise<boolean>` — `true` if ODK Collect is installed.

```ts
const installed = await odk.isInstalled();
```

---

### `odk.launch()`

Opens the ODK Collect main screen.

```ts
odk.launch();
```

---

### `odk.isOpenedByOdk()`

Returns `Promise<boolean>` — `true` if the current Activity was opened by ODK Collect (detected via `Activity.referrer`). Use this before calling `odk.returnResult()` to confirm the app is running in the expected context.

```ts
const openedByOdk = await odk.isOpenedByOdk();

if (openedByOdk) {
  odk.returnResult({ selected_id: '42' });
}
```

> **Note**: `Activity.referrer` is only populated when the Activity is started via `startActivityForResult`. If the user opened your app from the launcher or a deeplink, this returns `false`.

---

### `odk.openForms()`

Opens the ODK Collect form list screen.

```ts
odk.openForms();
```

---

### `odk.openInstances()`

Opens the ODK Collect instance (uploader) list screen.

```ts
odk.openInstances();
```

---

### `odk.pickForm()`

Starts an `ACTION_PICK` intent for forms. The selected form URI is returned via the `onActivityResult` event (`requestCode = 2001`).

```ts
odk.pickForm();
odk.onResult((result) => {
  if (result.requestCode === 2001) {
    console.log('Selected form URI:', result.uri);
  }
});
```

---

### `odk.pickInstance()`

Starts an `ACTION_PICK` intent for instances. The selected instance URI is returned via the `onActivityResult` event (`requestCode = 2002`).

```ts
odk.pickInstance();
```

---

### `odk.editInstance(instanceId)`

Opens ODK Collect to edit the instance with the given ID (`requestCode = 2003`).

```ts
odk.editInstance('42');
```

---

### `odk.getForms()`

Queries the ODK ContentProvider and returns all available forms.

```ts
const forms: OdkForm[] = await odk.getForms();
forms.forEach(f => console.log(f.displayName, f.jrFormId));
```

---

### `odk.getInstances()`

Queries the ODK ContentProvider and returns all stored instances.

```ts
const instances: OdkInstance[] = await odk.getInstances();
instances.forEach(i => console.log(i.displayName, i.status));
```

---

### `odk.getIntentExtras()`

Returns all Intent extras from the current Activity as a flat string map. Use this when ODK Collect opens your app to read the fields the form passed.

```ts
const extras: Record<string, string> = await odk.getIntentExtras();
// → { uuid: "uuid:abc-123", record_type: "survey", record_id: "42" }

const uuid = extras['uuid'];
```

---

### `odk.returnResult(data)`

Sends data back to the ODK Collect form that opened your app and closes the Activity. Must be called from an Activity opened by ODK Collect.

```ts
odk.returnResult({
  selected_id: '99',
  selected_name: 'Site Alpha',
});
```

---

### `odk.onResult(callback)`

Subscribes to activity results (from `pickForm`, `pickInstance`, `editInstance`). Returns a subscription with a `remove()` method.

```ts
const sub = odk.onResult((result: OdkActivityResult) => {
  console.log(result.requestCode, result.resultCode, result.uri);
});

// Cleanup:
sub.remove();
```

---

### `odk.onError(callback)`

Subscribes to errors emitted by the native module. Returns a subscription with a `remove()` method.

```ts
const sub = odk.onError((error: OdkErrorPayload) => {
  console.error(error.code, error.message);
});
```

---

## Types

```ts
import type {
  OdkForm,
  OdkInstance,
  OdkInstanceStatus,
  OdkActivityResult,
  OdkErrorPayload,
  OdkErrorCode,
  OdkSubscription,
  OdkIntentExtras,
  OdkModuleEvents,
} from 'expo-odk-collect';
```

### `OdkForm`

```ts
type OdkForm = {
  id: string;           // Internal ContentProvider row ID
  displayName: string;  // Human-readable form name
  jrFormId: string;     // JavaRosa form ID
  jrVersion?: string;   // Form version string
};
```

### `OdkInstance`

```ts
type OdkInstance = {
  id: string;
  instanceId: string;    // Same as id — semantic alias
  displayName: string;
  jrFormId: string;
  jrVersion?: string;
  status: OdkInstanceStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

type OdkInstanceStatus =
  | 'incomplete'
  | 'complete'
  | 'submitted'
  | 'submissionFailed'
  | 'unknown';
```

### `OdkActivityResult`

Event payload from `pickForm`, `pickInstance`, and `editInstance`.

```ts
type OdkActivityResult = {
  requestCode: number;  // 2001=pickForm, 2002=pickInstance, 2003=editInstance
  resultCode: number;   // Android Activity.RESULT_OK (-1) or RESULT_CANCELED (0)
  uri?: string;         // URI of the selected item (if any)
};
```

### `OdkErrorPayload`

```ts
type OdkErrorPayload = {
  code: OdkErrorCode;
  message: string;
  details?: string;
};

type OdkErrorCode =
  | 'ODK_NOT_INSTALLED'
  | 'ACTIVITY_NOT_FOUND'
  | 'QUERY_FAILED'
  | 'INVALID_INTENT'
  | 'UNKNOWN_ERROR';
```

### `OdkSubscription`

```ts
type OdkSubscription = {
  remove: () => void;
};
```

---

## AI Agent Skills

This repository includes [agent skills](https://github.com/nuupco/expo-odk-collect/tree/main/.claude/skills) for AI coding assistants (Claude, Copilot, etc.) that help enforce correct usage patterns automatically.

| Skill | Audience | Trigger |
|-------|----------|---------|
| [`expo-odk-collect`](.claude/skills/expo-odk-collect/SKILL.md) | **Contributors** — working on the package itself | Editing `OdkClient`, types, normalizers, native module, or Kotlin code |
| [`expo-odk-collect-integration`](.claude/skills/expo-odk-collect-integration/SKILL.md) | **Consumers** — integrating the package into an Expo project | Setting up `app.json`, building external-app screens, querying forms/instances |

### What the skills cover

**`expo-odk-collect`** (contributors):

- File architecture and responsibility of each `src/` file
- How to add a new `OdkClient` method end-to-end (TypeScript → Kotlin)
- Normalizer contract for ContentProvider data
- Error event pattern (never throw, always emit)

**`expo-odk-collect-integration`** (consumers):

- Installation and required `app.json` config (`launchMode`, `host: "*"`, `scheme`)
- Full external-app flow with `isOpenedByOdk()` guard and UUID parsing
- Querying forms and instances, subscribing to activity results
- XLSForm configuration for single-field and multi-field groups
- Common mistakes table

---

## License

MIT © [nuup](https://nuup.org)
