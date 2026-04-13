---
name: expo-odk-collect-integration
description: >
  Patterns and setup guide for integrating expo-odk-collect into a React Native
  Expo project. Covers installation, app.json config, the external-app flow,
  querying forms/instances, error handling, and XLSForm setup.
  Trigger: When adding expo-odk-collect to an Expo project, implementing ODK
  Collect integration, or building an external-app screen that returns data to ODK.
license: Apache-2.0
metadata:
  author: nuup
  version: "1.0"
---

## When to Use

- Setting up `expo-odk-collect` in a new or existing Expo project
- Building the "external app" screen (ODK opens your app, your app returns data)
- Listing or querying forms and instances from ODK Collect
- Configuring `app.json` for ODK deep link and intent filters
- Setting up XLSForm fields that launch your app as external app

---

## Prerequisites

- **Android only** — this module has no iOS support and no web implementation
- **ODK Collect** installed on the device (`org.odk.collect.android`)
- **Expo SDK 51+**
- `managed` or `bare` workflow with prebuild

---

## Installation

```bash
npx expo install expo-odk-collect
npx expo prebuild --platform android
```

> Do NOT run `npm install` directly. Always use `npx expo install` to ensure peer dep compatibility.

---

## app.json — Required Configuration

Add these fields to your `expo.android` section. **All three are required:**

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
            { "scheme": "my-app", "host": "*" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Why each field matters

| Field | Why it's required |
|-------|-------------------|
| `scheme` | Deep link scheme ODK uses to launch your app |
| `launchMode: "singleTask"` | Prevents duplicate Activity stacks. Without it you get _"App entry point named main was not registered"_ when ODK relaunches your app |
| `host: "*"` | Required on Android API 31+. Without a `host`, the system ignores the intent-filter when the URI includes a host component |

After editing `app.json`, always rebuild:

```bash
npx expo prebuild --platform android
# or
npx expo run:android
```

---

## Imports

```ts
// Client (direct use)
import { odk } from 'expo-odk-collect';

// Hook (recommended — reactive state + auto-cleanup)
import { useOdk } from 'expo-odk-collect';

// Types
import type {
  OdkForm,
  OdkInstance,
  OdkInstanceStatus,
  OdkActivityResult,
  OdkErrorPayload,
  OdkErrorCode,
  OdkSubscription,
  OdkIntentExtras,
} from 'expo-odk-collect';
```

---

## Core Usage Patterns

### Check if ODK Collect is installed

```ts
const installed = await odk.isInstalled(); // Promise<boolean>
```

Always check before calling any ODK function in production — show a friendly message if ODK is not installed.

### Hook vs client

Prefer `useOdk()` inside React components — it handles subscriptions and cleanup automatically:

```tsx
function MyScreen() {
  const { odk, result, error } = useOdk();
  // result → latest OdkActivityResult (pickForm, pickInstance, editInstance)
  // error  → latest OdkErrorPayload
}
```

Use `odk` directly (imported from `expo-odk-collect`) outside components or in service layers.

---

## External App Flow (ODK opens your app)

This is the most common integration pattern. ODK Collect launches your app as part of a form, your app returns data, ODK continues the form.

### Screen implementation

```tsx
import { useEffect, useState } from 'react';
import { Button } from 'react-native';
import { useOdk } from 'expo-odk-collect';

export default function ExternalAppScreen() {
  const { odk } = useOdk();
  const [openedByOdk, setOpenedByOdk] = useState(false);
  const [uuid, setUuid] = useState<string | null>(null);

  useEffect(() => {
    // 1. Detect if ODK opened this Activity
    odk.isOpenedByOdk().then(setOpenedByOdk);

    // 2. Read fields ODK passed to this Activity
    odk.getIntentExtras().then((extras) => {
      const raw = extras['uuid'];
      if (raw) {
        // ODK sends UUID as "uuid:<value>" — strip the prefix
        setUuid(raw.includes(':') ? raw.split(':')[1] : raw);
      }
    });
  }, []);

  function handleSubmit() {
    // CRITICAL: always guard with isOpenedByOdk before calling returnResult
    if (!openedByOdk) return;

    odk.returnResult({
      selected_id: '99',
      selected_name: 'Site Alpha',
      // Field names must match exactly what the XLSForm expects
    });
    // returnResult calls Activity.setResult(RESULT_OK) + Activity.finish()
    // The app closes and ODK resumes the form with these values
  }

  return <Button title="Enviar a ODK" onPress={handleSubmit} />;
}
```

### UUID parsing

ODK sends the form UUID with a `"uuid:"` prefix: `"uuid:550e8400-..."`.
Always strip it before using:

```ts
const raw = extras['uuid'];
const uuid = raw?.includes(':') ? raw.split(':')[1] : raw;
```

---

## Querying Forms and Instances

```tsx
import { useState } from 'react';
import { useOdk } from 'expo-odk-collect';
import type { OdkForm, OdkInstance } from 'expo-odk-collect';

function FormsScreen() {
  const { odk } = useOdk();
  const [forms, setForms] = useState<OdkForm[]>([]);
  const [instances, setInstances] = useState<OdkInstance[]>([]);

  async function loadForms() {
    const result = await odk.getForms();
    setForms(result);
  }

  async function loadInstances() {
    const result = await odk.getInstances();
    setInstances(result);
  }

  function editInstance(id: string) {
    // Opens ODK Collect on the edit screen for this instance
    // Result arrives via onActivityResult (requestCode 2003)
    odk.editInstance(id);
  }
}
```

---

## Error Handling

The module **never throws** — errors are emitted as events. You must subscribe.

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

Or with the raw client (outside components):

```ts
const sub = odk.onError((event) => {
  console.error(`[ODK] ${event.code}: ${event.message}`);
});
// Always clean up:
sub.remove();
```

### Error codes

| Code | When |
|------|------|
| `ODK_NOT_INSTALLED` | ODK Collect not installed |
| `ACTIVITY_NOT_FOUND` | ODK screen couldn't be opened |
| `QUERY_FAILED` | ContentProvider query failed |
| `INVALID_INTENT` | Intent couldn't be resolved |
| `UNKNOWN_ERROR` | Unexpected native error |

---

## Subscribing to Activity Results

```tsx
useEffect(() => {
  const sub = odk.onResult((result) => {
    // result.requestCode → 2001=pickForm, 2002=pickInstance, 2003=editInstance
    // result.resultCode  → -1=RESULT_OK, 0=RESULT_CANCELED
    // result.uri         → URI of selected item (if any)
    if (result.requestCode === 2001 && result.resultCode === -1) {
      console.log('Form selected:', result.uri);
    }
  });

  return () => sub.remove(); // ALWAYS clean up subscriptions
}, []);
```

---

## XLSForm Setup

For ODK to launch your app as external app, configure the XLSForm field:

### Single field (returns one value via `value` extra)

| type | name | appearance |
|------|------|------------|
| text | my_field | `ex:android.intent.action.VIEW(uri_data='my-app://external-app', uuid=${instanceID})` |

### Multiple fields (returns multiple values via field-list group)

| type | name | appearance | body::intent |
|------|------|------------|--------------|
| begin_group | my_group | field-list | `android.intent.action.VIEW(uri_data='my-app://external-app', uuid=${instanceID})` |
| text | selected_id | | |
| text | selected_name | | |
| end_group | | | |

> ⚠️ **Critical difference**: single field uses `ex:` prefix in `appearance`. Group uses `body::intent` column WITHOUT `ex:` prefix.

Field names in the group **must match exactly** the keys passed to `odk.returnResult()`.

---

## Commands

```bash
# Install package
npx expo install expo-odk-collect

# Rebuild native Android
npx expo prebuild --platform android

# Run on Android device/emulator
npx expo run:android
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling `returnResult()` without checking `isOpenedByOdk()` | Always guard: `if (!openedByOdk) return` |
| Forgetting `sub.remove()` in useEffect cleanup | Always return `() => sub.remove()` |
| Using `npm install` instead of `npx expo install` | Use `npx expo install` always |
| Missing `launchMode: "singleTask"` in app.json | Add it — required to prevent duplicate Activity stacks |
| Missing `host: "*"` in intentFilters | Required on Android API 31+, otherwise intent-filter is ignored |
| Field names in `returnResult()` not matching XLSForm | Names must be identical — ODK maps them by exact key name |
| Forgetting to rebuild after `app.json` changes | Run `npx expo prebuild` after every `app.json` change |
