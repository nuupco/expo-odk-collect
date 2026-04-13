---
name: expo-odk-collect
description: >
  Patterns and conventions for working with the expo-odk-collect package — a
  type-safe bridge between Expo/React Native apps and ODK Collect on Android.
  Trigger: When adding features, fixing bugs, writing tests, or using the odk client or useOdk hook.
license: Apache-2.0
metadata:
  author: nuup
  version: "1.0"
---

## When to Use

- Adding or modifying methods on the `OdkClient` interface
- Writing React Native screens that integrate with ODK Collect
- Implementing the "external app" flow (ODK opens your app, your app returns data)
- Adding new native Android methods to `ExpoOdkCollectModule`
- Writing tests for the module or consumer apps

---

## Architecture

```
src/
├── ExpoOdkCollect.types.ts      # All public TypeScript types
├── ExpoOdkCollect.sdk.ts        # odk client — wraps native module + EventEmitter
├── ExpoOdkCollect.hook.ts       # useOdk() hook — reactive wrapper over odk client
├── ExpoOdkCollect.normalizer.ts # Raw native data → typed domain objects
├── ExpoOdkCollectModule.ts      # Native module bindings (Android)
├── ExpoOdkCollectModule.web.ts  # Web stub (no-op)
└── index.ts                     # Public exports
```

**Android-only.** The web module exports stubs. Never add iOS code.

---

## Critical Patterns

### 1. Always check `isOpenedByOdk()` before `returnResult()`

```ts
const openedByOdk = await odk.isOpenedByOdk();
if (openedByOdk) {
  odk.returnResult({ field_one: 'value' });
}
```

Calling `returnResult()` when NOT opened by ODK will crash or produce undefined behavior.

### 2. Subscribe → cleanup in `useEffect`

```ts
useEffect(() => {
  const sub = odk.onResult((result) => { /* ... */ });
  return () => sub.remove();
}, []);
```

Always call `sub.remove()` in the cleanup function. Memory leaks otherwise.

### 3. Adding a new `OdkClient` method

1. Add the method signature to the `OdkClient` interface in `ExpoOdkCollect.sdk.ts`
2. Implement it on the `odk` object (same file) calling the native via `OdkNative.*`
3. Add the corresponding native function to `ExpoOdkCollectModule.ts`
4. Implement the Kotlin method in `android/src/main/java/.../ExpoOdkCollectModule.kt`
5. Export from `index.ts` if a new type was added

### 4. Normalizers for ContentProvider data

Raw data from the native ContentProvider always goes through a normalizer before reaching consumers:

```ts
// ExpoOdkCollect.normalizer.ts
export function normalizeForm(raw: any): OdkForm { ... }
export function normalizeInstance(raw: any): OdkInstance { ... }
```

Never return raw native data directly. Always normalize.

### 5. Errors via `onError` event — never throw

The native layer emits errors as `OdkErrorPayload` events, not exceptions.
Consumer apps must subscribe to `odk.onError()` or read `error` from `useOdk()`.

```ts
const sub = odk.onError((event) => {
  console.error(`[ODK] ${event.code}: ${event.message}`);
});
```

---

## Key Types

```ts
// All types live in ExpoOdkCollect.types.ts

OdkForm          → { id, displayName, jrFormId, jrVersion? }
OdkInstance      → { id, instanceId, displayName, jrFormId, jrVersion?, status, createdAt?, updatedAt?, deletedAt? }
OdkInstanceStatus → 'incomplete' | 'complete' | 'submitted' | 'submissionFailed' | 'unknown'
OdkActivityResult → { requestCode: number, resultCode: number, uri?: string }
OdkErrorPayload  → { code: OdkErrorCode, message: string, details?: string }
OdkErrorCode     → 'ODK_NOT_INSTALLED' | 'ACTIVITY_NOT_FOUND' | 'QUERY_FAILED' | 'INVALID_INTENT' | 'UNKNOWN_ERROR'
OdkIntentExtras  → Record<string, string>
OdkSubscription  → { remove: () => void }
```

### Request codes (onActivityResult)

| requestCode | Action |
|-------------|--------|
| `2001` | `pickForm` |
| `2002` | `pickInstance` |
| `2003` | `editInstance` |

---

## External App Flow

ODK Collect opens your app → your app reads extras → your app returns data:

```tsx
import { useEffect, useState } from 'react';
import { useOdk } from 'expo-odk-collect';

export default function ExternalAppScreen() {
  const { odk } = useOdk();
  const [openedByOdk, setOpenedByOdk] = useState(false);

  useEffect(() => {
    odk.isOpenedByOdk().then(setOpenedByOdk);
  }, []);

  const extras = await odk.getIntentExtras();
  // extras → { uuid: "uuid:abc-123", record_id: "42", ... }

  function handleSubmit() {
    if (!openedByOdk) return;
    odk.returnResult({ selected_id: '99', selected_name: 'Site Alpha' });
  }
}
```

`app.json` requirements:
- `scheme` defined (e.g. `"my-app"`)
- `android.launchMode: "singleTask"` — required, prevents duplicate Activity stacks
- `intentFilters` with `action: "VIEW"`, `data.host: "*"` — required on Android API 31+

---

## Commands

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Lint
npm run lint

# Android (requires Android Studio)
npm run open:android
```

---

## Resources

- **Types**: See [src/ExpoOdkCollect.types.ts](../../../src/ExpoOdkCollect.types.ts)
- **SDK**: See [src/ExpoOdkCollect.sdk.ts](../../../src/ExpoOdkCollect.sdk.ts)
- **Hook**: See [src/ExpoOdkCollect.hook.ts](../../../src/ExpoOdkCollect.hook.ts)
- **Full API docs**: See [README.md](../../../README.md)
