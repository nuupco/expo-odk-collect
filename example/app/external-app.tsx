/**
 * external-app.tsx — Pantalla de modo "app externa" de ODK Collect
 *
 * Esta pantalla demuestra el flujo completo de una "external app" de ODK Collect:
 *
 *  Flujo:
 *  1. ODK Collect abre esta app usando startActivityForResult (Android Intent)
 *  2. ODK puede pasar datos al Intent (uuid del formulario, id de parcela, etc.)
 *  3. El usuario interactúa con la app (selecciona una parcela, llena datos, etc.)
 *  4. La app llama a returnResult(data) para devolver los datos a ODK y cerrarse
 *
 *  Funciones demostradas:
 *  - checkIfopenByODKform() → detecta si la app fue abierta por ODK Collect
 *  - getCurrentODKid()      → lee el UUID del Intent (shortcut de getIntentExtra('uuid'))
 *  - getIntentExtras()      → lee TODOS los campos que ODK envió al abrir la app
 *  - getIntentExtra(key)    → lee UN campo específico por nombre
 *  - returnResult(data)     → devuelve datos a ODK y cierra la Activity
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
import { useState } from 'react';
import {
  checkIfopenByODKform,
  getCurrentODKid,
  getIntentExtra,
  getIntentExtras,
  returnResult,
} from 'expo-odk-collect';

/**
 * Tipo de los datos que esta app devuelve a ODK Collect.
 *
 * En una app real, esto sería el resultado de la selección del usuario:
 * una parcela, un productor, un punto GPS, etc.
 * Los nombres de los campos deben coincidir con los que espera el formulario ODK.
 */
type SelectedData = {
  selected_id: string;
  selected_name: string;
  selected_area: string;
};

/**
 * Datos simulados que representan lo que el usuario "seleccionó".
 * En una app real, esto vendría de una lista, un mapa, una búsqueda, etc.
 */
const MOCK_SELECTION: SelectedData = {
  selected_id: 'R-99',
  selected_name: 'Finca Norte',
  selected_area: '5.2',
};

export default function ExternalAppScreen() {
  /**
   * checkIfopenByODKform()
   * true  → la app fue lanzada por ODK Collect como parte de un formulario
   * false → la app se abrió de forma independiente (desde el launcher, por ejemplo)
   *
   * Usamos esto para mostrar advertencias cuando el usuario prueba la pantalla
   * fuera del contexto ODK.
   */
  const isOdkContext = checkIfopenByODKform();

  /**
   * getCurrentODKid()
   * Retorna el valor del campo "uuid" del Intent con formato "uuid:<valor>".
   * Ejemplo: "uuid:550e8400-e29b-41d4-a716-446655440000"
   *
   * Si la app no fue abierta por ODK, retorna "".
   * Extraemos solo la parte del UUID (sin el prefijo "uuid:") para uso posterior.
   */
  const currentId = getCurrentODKid();
  const uuid = currentId ? currentId.split(':')[1] ?? null : null;

  // Estado para mostrar el resultado de getIntentExtras() en pantalla
  const [intentExtras, setIntentExtras] = useState<Record<string, unknown> | null>(null);

  // Estado para deshabilitar el botón mientras se ejecuta returnResult()
  const [sending, setSending] = useState(false);

  /**
   * Lee TODOS los extras del Intent de Android y los muestra en pantalla.
   *
   * getIntentExtras() devuelve un objeto plano { clave: valor } con todos
   * los campos que ODK Collect pasó al abrir la app.
   *
   * Ejemplo de lo que podría retornar:
   *   {
   *     uuid: "abc-123",
   *     producer_name: "Juan García",
   *     plot_id: "42",
   *     community: "San Marcos"
   *   }
   *
   * Esto es útil para debuggear qué campos está enviando el formulario ODK,
   * o para leer datos del contexto sin conocer los nombres de antemano.
   */
  function handleReadExtras() {
    const extras = getIntentExtras();
    setIntentExtras(extras);
  }

  /**
   * Lee UN campo específico del Intent usando getIntentExtra(key).
   *
   * getIntentExtra(key) retorna:
   *   - string con el valor si el campo existe
   *   - null si el campo no está en el Intent
   *
   * En este ejemplo leemos "uuid", que es el campo más común que ODK envía.
   * Podés reemplazarlo por cualquier otro campo que tu formulario ODK configure.
   */
  function handleReadSingleExtra() {
    const value = getIntentExtra('uuid');
    Alert.alert('getIntentExtra("uuid")', value || '(vacío — ODK no pasó este campo)');
  }

  /**
   * Envía los datos seleccionados de vuelta a ODK Collect y cierra la app.
   *
   * returnResult(data, options) hace tres cosas en Kotlin:
   *   1. Ejecuta options.onBeforeReturn(data) si está definido
   *      → aquí podés sincronizar con tu API antes de cerrar
   *   2. Llama a Activity.setResult(RESULT_OK) con data como Intent extras
   *   3. Llama a Activity.finish() → la app se cierra y ODK recibe los datos
   *
   * Importante: si la app no fue abierta por ODK (isOdkContext === false),
   * el módulo emite un error 'ACTIVITY_NOT_AVAILABLE' en vez de cerrar la app.
   * Ese error se maneja globalmente en _layout.tsx con useEvent.
   */
  async function handleReturnResult() {
    setSending(true);
    try {
      await returnResult(MOCK_SELECTION, {
        /**
         * onBeforeReturn se ejecuta ANTES de enviar los datos a ODK.
         * Usalo para persistir registros en tu propio backend, validar datos,
         * o cualquier lógica de negocio que deba ocurrir antes del cierre.
         *
         * Si onBeforeReturn lanza un error, returnResult lo propaga como
         * rechazo de la Promise — la app NO se cierra y ODK no recibe datos.
         *
         * Ejemplo de uso real:
         *   await myApi.createRecord({ ...data, uuid_odk: uuid });
         */
        onBeforeReturn: async (data) => {
          console.log('[ExternalApp] onBeforeReturn llamado con:', data, '| uuid ODK:', uuid);
          Alert.alert(
            'onBeforeReturn ejecutado',
            `A punto de enviar:\n  ID: ${data.selected_id}\n  Nombre: ${data.selected_name}\n\nUUID del formulario ODK:\n  ${uuid ?? '(no disponible)'}`
          );
        },
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modo App Externa</Text>

      {/* ──────────────────────────────────────────────
          SECCIÓN 1: Estado de contexto ODK
          Indica si la app fue abierta desde un formulario ODK.
          Verde = contexto ODK activo (flujo externo real)
          Rojo  = app abierta de forma independiente (solo para demo/debug)
          ────────────────────────────────────────────── */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>¿Abierta por ODK Collect?</Text>
        <Text style={[styles.value, { color: isOdkContext ? 'green' : 'red' }]}>
          {isOdkContext
            ? '✅ Sí — app abierta desde un formulario ODK'
            : '❌ No — abrila desde ODK Collect para probarlo'}
        </Text>
      </View>

      {/* ──────────────────────────────────────────────
          SECCIÓN 2: UUID del formulario ODK
          getCurrentODKid() es un shortcut de getIntentExtra('uuid').
          Retorna el identificador único de la instancia del formulario.
          ────────────────────────────────────────────── */}
      <View style={styles.infoCard}>
        <Text style={styles.label}>getCurrentODKid()</Text>
        <Text style={styles.value}>{currentId || '(vacío — no hay ODK ID)'}</Text>
        {uuid && (
          <Text style={styles.uuid}>
            UUID extraído: {uuid}
          </Text>
        )}
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
      <Button
        title='getIntentExtra("uuid") — Leer campo específico'
        onPress={handleReadSingleExtra}
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
          returnResult(data) empaqueta `data` como extras del Intent,
          llama a setResult(RESULT_OK) y luego a finish().
          ODK Collect recibe los datos y continúa el formulario.
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Devolver Resultado a ODK</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Datos simulados a devolver:</Text>
        <Text style={styles.value}>ID: {MOCK_SELECTION.selected_id}</Text>
        <Text style={styles.value}>Nombre: {MOCK_SELECTION.selected_name}</Text>
        <Text style={styles.value}>Área: {MOCK_SELECTION.selected_area} ha</Text>
      </View>

      <Button
        title={sending ? 'Enviando...' : 'returnResult() — Enviar y cerrar'}
        onPress={handleReturnResult}
        disabled={sending}
      />

      {/* Advertencia visible cuando la app no está en contexto ODK */}
      {!isOdkContext && (
        <Text style={styles.hint}>
          ⚠️ returnResult() solo funciona cuando la app fue abierta por ODK Collect
          como app externa. Si lo llamás fuera de ese contexto, el módulo emite
          un error 'ACTIVITY_NOT_AVAILABLE'.
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
  uuid: { fontSize: 13, color: '#555', marginTop: 2 },
  extra: { fontSize: 13, color: '#333', marginTop: 2 },
  extraVal: { fontWeight: '600', color: '#000' },
  hint: { color: '#e67e22', fontSize: 13, marginTop: 4 },
});
