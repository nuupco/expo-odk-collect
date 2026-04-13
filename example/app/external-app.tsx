/**
 * external-app.tsx — Pantalla de modo "app externa" de ODK Collect
 *
 * Esta pantalla demuestra el flujo completo de una "external app" de ODK Collect:
 *
 *  Flujo:
 *  1. ODK Collect abre esta app usando startActivityForResult (Android Intent)
 *  2. ODK puede pasar datos al Intent (uuid del formulario, id de parcela, etc.)
 *  3. El usuario interactúa con la app (selecciona una parcela, llena datos, etc.)
 *  4. La app llama a odk.returnResult(data) para devolver los datos a ODK y cerrarse
 *
 *  Funciones demostradas:
 *  - odk.isInstalled()    → detecta si ODK Collect está instalado
 *  - odk.getIntentExtras() → lee TODOS los campos que ODK envió al abrir la app
 *  - odk.returnResult(data) → devuelve datos a ODK y cierra la Activity
 *
 *  Para probar esta pantalla en contexto real:
 *  1. Instalá ODK Collect en tu dispositivo Android
 *  2. Creá un formulario que use un campo de tipo "external app"
 *     con el package name de tu app
 *  3. Al llenar ese campo, ODK abrirá esta pantalla
 *  4. Tocá "returnResult() — Enviar y cerrar"
 *  5. ODK recibe los datos y continúa el formulario
 */

import { View, Text, StyleSheet, Button, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useOdk } from 'expo-odk-collect';

/**
 * Tipo de los datos que esta app devuelve a ODK Collect.
 *
 * En una app real, esto sería el resultado de la selección del usuario:
 * una parcela, un productor, un punto GPS, etc.
 * Los nombres de los campos deben coincidir con los que espera el formulario ODK.
 */
type SelectedData = {
  nombre_parcela: string;
  uuid_parcela: string;
  id_parcela: string;
};

/**
 * Datos simulados que representan lo que el usuario "seleccionó".
 * En una app real, esto vendría de una lista, un mapa, una búsqueda, etc.
 */
const MOCK_SELECTION: SelectedData = {
  nombre_parcela: 'Finca Norte',
  uuid_parcela: 'abc-123',
  id_parcela: '42',
};

export default function ExternalAppScreen() {
  const { odk } = useOdk();

  /**
   * odk.isInstalled()
   * Retorna Promise<boolean>:
   *   true  → ODK Collect está instalado en el dispositivo
   *   false → ODK Collect no está instalado
   *
   * Usamos esto para mostrar advertencias cuando el usuario prueba la pantalla
   * fuera del contexto ODK.
   */
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  /**
   * odk.isOpenedByOdk()
   * Retorna Promise<boolean>:
   *   true  → la Activity fue abierta por ODK Collect (via Activity.referrer)
   *   false → la app fue abierta de otra forma (launcher, deeplink, etc.)
   *
   * Útil para saber si tiene sentido llamar a returnResult().
   */
  const [openedByOdk, setOpenedByOdk] = useState<boolean | null>(null);

  /**
   * uuid extraído de los Intent extras enviados por ODK Collect.
   * ODK normalmente pasa el UUID de la instancia del formulario como el extra "uuid".
   */
  const [uuid, setUuid] = useState<string | null>(null);

  // Estado para mostrar el resultado de getIntentExtras() en pantalla
  const [intentExtras, setIntentExtras] = useState<Record<string, string> | null>(null);

  // Estado para deshabilitar el botón mientras se ejecuta returnResult()
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Verificar instalación
    odk.isInstalled().then(setIsInstalled);

    // Verificar si la app fue abierta por ODK Collect
    odk.isOpenedByOdk().then(setOpenedByOdk);

    // Leer el UUID del Intent (enviado por ODK al abrir la app)
    odk.getIntentExtras().then((extras) => {
      const rawUuid = extras['uuid'];
      if (rawUuid) {
        // ODK envía el UUID con formato "uuid:<valor>" — extraemos solo el valor
        setUuid(rawUuid.includes(':') ? (rawUuid.split(':')[1] ?? rawUuid) : rawUuid);
      }
    });
  }, []);

  /**
   * Lee TODOS los extras del Intent de Android y los muestra en pantalla.
   *
   * odk.getIntentExtras() devuelve un objeto plano { clave: valor } con todos
   * los campos que ODK Collect pasó al abrir la app.
   *
   * Ejemplo de lo que podría retornar:
   *   {
   *     uuid: "uuid:abc-123",
   *     producer_name: "Juan García",
   *     plot_id: "42",
   *     community: "San Marcos"
   *   }
   *
   * Esto es útil para debuggear qué campos está enviando el formulario ODK,
   * o para leer datos del contexto sin conocer los nombres de antemano.
   */
  async function handleReadExtras() {
    const extras = await odk.getIntentExtras();
    setIntentExtras(extras);
  }

  /**
   * Envía los datos seleccionados de vuelta a ODK Collect y cierra la app.
   *
   * odk.returnResult(data) hace en Kotlin:
   *   1. Llama a Activity.setResult(RESULT_OK) con data como Intent extras
   *   2. Llama a Activity.finish() → la app se cierra y ODK recibe los datos
   *
   * Importante: si la app no fue abierta por ODK, el módulo emite un error
   * 'ACTIVITY_NOT_FOUND' o simplemente cierra la Activity sin enviar resultado.
   */
  async function handleReturnResult() {
    setSending(true);
    try {
      /**
       * Podés agregar lógica aquí antes de llamar a returnResult:
       *   - Persistir datos en tu propio backend
       *   - Validar que los datos estén completos
       *   - Registrar un log
       *
       * Si algo falla antes de llamar a returnResult, la app no se cierra
       * y ODK no recibe datos — el usuario puede reintentar.
       */
      console.log('[ExternalApp] returnResult con:', MOCK_SELECTION, '| uuid ODK:', uuid);
      Alert.alert(
        'A punto de enviar a ODK',
        `nombre_parcela: ${MOCK_SELECTION.nombre_parcela}\nuuid_parcela: ${MOCK_SELECTION.uuid_parcela}\nid_parcela: ${MOCK_SELECTION.id_parcela}\n\nUUID formulario ODK:\n${uuid ?? '(no disponible)'}`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setSending(false) },
          {
            text: 'Enviar',
            onPress: () => {
              odk.returnResult(MOCK_SELECTION);
              setSending(false);
            },
          },
        ]
      );
    } catch (err) {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modo App Externa</Text>

      {/* ──────────────────────────────────────────────
          SECCIÓN 1: Estado de ODK Collect
          Indica si ODK Collect está instalado.
          Verde = instalado y disponible
          Rojo  = no instalado
          ────────────────────────────────────────────── */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>¿ODK Collect instalado?</Text>
        <Text style={[styles.value, { color: isInstalled ? 'green' : isInstalled === false ? 'red' : '#aaa' }]}>
          {isInstalled === null
            ? '⏳ verificando...'
            : isInstalled
            ? '✅ Sí — ODK Collect disponible'
            : '❌ No — instalá ODK Collect para usar esta función'}
        </Text>
      </View>

      {/* ──────────────────────────────────────────────
          SECCIÓN 2: ¿Fue abierta por ODK Collect?
          Usa Activity.referrer para detectar si ODK fue
          quien lanzó esta Activity. Determina si tiene
          sentido llamar a returnResult().
          ────────────────────────────────────────────── */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>¿Abierta por ODK Collect?</Text>
        <Text style={[styles.value, { color: openedByOdk ? 'green' : openedByOdk === false ? '#e67e22' : '#aaa' }]}>
          {openedByOdk === null
            ? '⏳ verificando...'
            : openedByOdk
            ? '✅ Sí — returnResult() enviará datos a ODK'
            : '⚠️ No — la app no fue abierta por ODK Collect'}
        </Text>
      </View>

      {/* ──────────────────────────────────────────────
          SECCIÓN 3: UUID del formulario ODK
          Leído desde los extras del Intent al montar la pantalla.
          Retorna el identificador único de la instancia del formulario.
          ────────────────────────────────────────────── */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>UUID del formulario ODK</Text>
        <Text style={styles.value}>
          {uuid ?? '(vacío — la app no fue abierta con contexto ODK)'}
        </Text>
      </View>

      {/* ──────────────────────────────────────────────
          SECCIÓN 3: Lectura de Intent Extras
          ODK Collect puede pasar campos del formulario al abrir la app.
          Estos campos llegan como "extras" del Intent de Android.
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Leer Intent Extras</Text>

      <Button
        title="getIntentExtras() — Leer todos los campos"
        onPress={handleReadExtras}
      />

      {/* Resultado visual de getIntentExtras() */}
      {intentExtras !== null && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Campos enviados por el formulario ODK:</Text>
          {Object.keys(intentExtras).length === 0 ? (
            <Text style={styles.value}>
              (ninguno — la app no fue abierta por ODK con contexto de formulario)
            </Text>
          ) : (
            Object.entries(intentExtras).map(([key, val]) => (
              <Text key={key} style={styles.extra}>
                {key}:{' '}
                <Text style={styles.extraVal}>{String(val)}</Text>
              </Text>
            ))
          )}
        </View>
      )}

      {/* ──────────────────────────────────────────────
          SECCIÓN 4: Devolución de resultado a ODK
          odk.returnResult(data) empaqueta `data` como extras del Intent,
          llama a setResult(RESULT_OK) y luego a finish().
          ODK Collect recibe los datos y continúa el formulario.
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Devolver Resultado a ODK</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Datos simulados a devolver:</Text>
        <Text style={styles.value}>nombre_parcela: {MOCK_SELECTION.nombre_parcela}</Text>
        <Text style={styles.value}>uuid_parcela: {MOCK_SELECTION.uuid_parcela}</Text>
        <Text style={styles.value}>id_parcela: {MOCK_SELECTION.id_parcela}</Text>
      </View>

      <Button
        title={sending ? 'Enviando...' : 'returnResult() — Enviar y cerrar'}
        onPress={handleReturnResult}
        disabled={sending}
      />

      {/* Advertencia visible cuando ODK Collect no está instalado */}
      {isInstalled === false && (
        <Text style={styles.hint}>
          ⚠️ returnResult() solo funciona cuando la app fue abierta por ODK Collect
          como app externa. Instalá ODK Collect para usar esta función.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: 'bold' },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#555',
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  label: { fontSize: 13, color: '#888', marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '500' },
  extra: { fontSize: 13, color: '#333', marginTop: 2 },
  extraVal: { fontWeight: '600', color: '#000' },
  hint: { color: '#e67e22', fontSize: 13, marginTop: 4 },
});
