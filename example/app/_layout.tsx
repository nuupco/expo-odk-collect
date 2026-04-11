/**
 * _layout.tsx — Layout raíz de la aplicación de ejemplo
 *
 * Este archivo define la estructura de navegación de toda la app usando expo-router.
 * También es el lugar ideal para escuchar errores globales del módulo expo-odk-collect,
 * ya que el layout raíz siempre está montado mientras la app está activa.
 *
 * ¿Por qué manejar errores aquí?
 * El módulo expo-odk-collect no lanza excepciones (throws). En cambio, emite un evento
 * nativo `onError` que podés escuchar desde cualquier componente con `useEvent`.
 * Colocarlo en el layout raíz garantiza que los errores ODK se capturen en toda la app,
 * sin necesidad de duplicar el listener en cada pantalla.
 *
 * Errores posibles:
 *   - ODK_NOT_INSTALLED     → ODK Collect no está instalado en el dispositivo
 *   - ACTIVITY_NOT_AVAILABLE → No se pudo abrir la pantalla solicitada de ODK Collect
 *   - FORMS_QUERY_FAILED    → Falló la consulta al ContentProvider de ODK Collect
 */

import { Stack } from 'expo-router';
import { useEvent } from 'expo-modules-core';
import { Alert } from 'react-native';
import { OdkCollectModule } from 'expo-odk-collect';
import type { OdkErrorPayload } from 'expo-odk-collect';

export default function RootLayout() {
  /**
   * useEvent escucha el evento nativo `onError` emitido por el módulo Kotlin.
   * Se dispara automáticamente cuando cualquier función del módulo falla
   * (por ejemplo, si ODK Collect no está instalado y se llama a startODKCollect()).
   *
   * El payload `event` tiene la forma:
   *   { code: OdkErrorCode, message: string, details?: string }
   */
  useEvent(OdkCollectModule, 'onError', (event: OdkErrorPayload) => {
    // Mensajes amigables para el usuario, indexados por código de error
    const messages: Record<string, string> = {
      ODK_NOT_INSTALLED: 'Instalá ODK Collect para usar esta función.',
      ACTIVITY_NOT_AVAILABLE: 'No se pudo abrir la pantalla solicitada de ODK Collect.',
      FORMS_QUERY_FAILED: 'No se pudieron leer los formularios de ODK Collect.',
    };

    Alert.alert(
      `Error ODK: ${event.code}`,
      // Si no hay mensaje mapeado, usamos el mensaje original del módulo
      messages[event.code] ?? event.message
    );
  });

  return (
    <Stack>
      {/* Pantalla principal: lista de acciones disponibles del módulo */}
      <Stack.Screen name="index" options={{ title: 'ODK Collect Demo' }} />

      {/* Pantalla de formularios: carga y gestiona instancias de ODK Collect */}
      <Stack.Screen name="forms" options={{ title: 'Lista de Formularios' }} />

      {/*
       * Pantalla de app externa: demuestra el flujo completo de external app.
       * ODK Collect abre esta pantalla, el usuario interactúa, y la app
       * devuelve datos de vuelta al formulario ODK con returnResult().
       */}
      <Stack.Screen name="external-app" options={{ title: 'Modo App Externa' }} />
    </Stack>
  );
}
