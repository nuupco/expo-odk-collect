/**
 * _layout.tsx — Layout raíz de la aplicación de ejemplo
 *
 * Este archivo define la estructura de navegación de toda la app usando expo-router.
 * También es el lugar ideal para escuchar errores globales del módulo expo-odk-collect,
 * ya que el layout raíz siempre está montado mientras la app está activa.
 *
 * ¿Por qué manejar errores aquí?
 * El módulo expo-odk-collect no lanza excepciones (throws). En cambio, emite un evento
 * nativo `onError` que podés escuchar desde cualquier componente.
 * Colocarlo en el layout raíz garantiza que los errores ODK se capturen en toda la app,
 * sin necesidad de duplicar el listener en cada pantalla.
 *
 * Errores posibles:
 *   - ODK_NOT_INSTALLED  → ODK Collect no está instalado en el dispositivo
 *   - ACTIVITY_NOT_FOUND → No se pudo abrir la pantalla solicitada de ODK Collect
 *   - QUERY_FAILED       → Falló la consulta al ContentProvider de ODK Collect
 *
 * Navegación desde ODK:
 * Cuando ODK Collect lanza la app con un extra `screen`, este layout
 * lee ese extra al montar y navega a la ruta correspondiente automáticamente.
 * Ejemplo en XLSForm:
 *   ex:expo.modules.odkcollect.example(uuid=${instanceID}, screen='external-app')
 */

import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { odk } from 'expo-odk-collect';
import type { OdkErrorPayload } from 'expo-odk-collect';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    /**
     * Navegación automática basada en el extra `screen` del Intent.
     *
     * Cuando ODK abre la app con:
     *   ex:expo.modules.odkcollect.example(uuid=${instanceID}, screen='external-app')
     *
     * El extra `screen` llega como string. Lo leemos al montar y navegamos
     * a la ruta correspondiente. Si no hay extra `screen`, no hacemos nada
     * y la app queda en el index.
     *
     * ¿Por qué useEffect y no leer directo?
     * expo-router necesita que el layout esté completamente montado antes
     * de poder navegar. El useEffect garantiza eso.
     */
    odk.getIntentExtras().then((extras) => {
      const screen = extras['screen'];
      if (!screen) return;

      const routes: Record<string, string> = {
        'external-app': '/external-app',
        'forms': '/forms',
      };

      const route = routes[screen];
      if (route) {
        router.replace(route as any);
      }
    });
  }, []);

  useEffect(() => {
    /**
     * Listener global de errores ODK.
     * Se activa cuando cualquier función del módulo falla en el lado nativo.
     */
    const sub = odk.onError((event: OdkErrorPayload) => {
      if (!event) return;

      const messages: Record<string, string> = {
        ODK_NOT_INSTALLED: 'Instalá ODK Collect para usar esta función.',
        ACTIVITY_NOT_FOUND: 'No se pudo abrir la pantalla solicitada de ODK Collect.',
        QUERY_FAILED: 'No se pudieron leer los datos de ODK Collect.',
      };

      Alert.alert(
        `Error ODK: ${event.code}`,
        messages[event.code] ?? event.message
      );
    });

    return () => sub.remove();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'ODK Collect Demo' }} />
      <Stack.Screen name="forms" options={{ title: 'Lista de Formularios' }} />
      <Stack.Screen name="external-app" options={{ title: 'Modo App Externa' }} />
    </Stack>
  );
}
