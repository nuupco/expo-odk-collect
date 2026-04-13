# expo-odk-collect — Agent Instructions

## Skills (Auto-load based on context)

When you detect any of these contexts, IMMEDIATELY load the corresponding skill BEFORE writing any code.

| Context | Skill to load |
| ------- | ------------- |
| Working with `odk` client, `useOdk` hook, `OdkClient`, types, normalizers, or any `expo-odk-collect` code | `expo-odk-collect` |
| Integrating `expo-odk-collect` into an Expo/React Native project, building external-app screens, configuring ODK deep links, or querying ODK forms/instances | `expo-odk-collect-integration` |

Load skills BEFORE writing code. Apply ALL patterns.

Skills live in `.claude/skills/`.
