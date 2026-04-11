/**
 * index.tsx — Pantalla principal del ejemplo
 *
 * Esta pantalla sirve como punto de entrada para explorar todas las funciones
 * del módulo expo-odk-collect de forma interactiva.
 *
 * Está organizada en cuatro secciones:
 *
 *  1. Navegación ODK → abre pantallas de ODK Collect directamente
 *     (startODKCollect, openOdkForms, startInstanceUploaderList)
 *
 *  2. Contexto → verifica si la app fue abierta por ODK Collect
 *     (checkIfopenByODKform, getCurrentODKid)
 *
 *  3. Intent Extras → lee los datos que ODK Collect pasó al abrir la app
 *     (getIntentExtras, getIntentExtra)
 *
 *  4. Pantallas → navega a las pantallas de ejemplo más completas
 *
 * Nota: la mayoría de estas funciones solo tienen efecto real en Android
 * con ODK Collect instalado. En web o simulador sin ODK, retornan valores
 * vacíos y muestran advertencias en consola.
 */

import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  startODKCollect,
  openOdkForms,
  startInstanceUploaderList,
  checkIfopenByODKform,
  getCurrentODKid,
  getIntentExtra,
  getIntentExtras,
} from 'expo-odk-collect';

export default function HomeScreen() {
  const router = useRouter();

  /**
   * checkIfopenByODKform()
   * Retorna true si el Android Activity fue abierto por ODK Collect.
   * Internamente compara el referrer del Intent con
   * "android-app://org.odk.collect.android".
   *
   * Útil para cambiar el comportamiento de la app según si está actuando
   * como "external app" de ODK o como app autónoma.
   */
  const isOdkContext = checkIfopenByODKform();

  /**
   * Muestra en un Alert si la app fue iniciada desde ODK Collect.
   * El valor de isOdkContext se calcula una sola vez al montar el componente,
   * ya que el referrer del Intent no cambia en tiempo de ejecución.
   */
  function handleCheckContext() {
    Alert.alert(
      'Contexto ODK',
      isOdkContext
        ? '✅ La app fue abierta por ODK Collect'
        : '❌ La app NO fue abierta por ODK Collect'
    );
  }

  /**
   * getCurrentODKid()
   * Lee el campo "uuid" del Intent extra con el formato "uuid:<valor>".
   * Es un shortcut de getIntentExtra('uuid') que conserva el prefijo "uuid:".
   *
   * Retorna "" si el Intent no tiene ese campo (app no abierta por ODK).
   *
   * Para obtener solo el valor UUID sin prefijo:
   *   const uuid = id.split(':')[1]
   */
  function handleGetCurrentId() {
    const id = getCurrentODKid();
    Alert.alert(
      'ID ODK actual',
      id
        ? `Raw: ${id}\nUUID: ${id.split(':')[1] ?? 'none'}`
        : 'No hay ODK ID en el intent actual'
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>expo-odk-collect Demo</Text>

      {/* ──────────────────────────────────────────────
          SECCIÓN 1: Navegación hacia ODK Collect
          Estas funciones abren ODK Collect directamente
          usando Android Intents.
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Navegación ODK</Text>

      {/* startODKCollect() → abre la pantalla principal de ODK Collect */}
      <Button title="Abrir ODK Collect" onPress={startODKCollect} />

      {/* openOdkForms() → abre la lista de formularios disponibles en ODK */}
      <Button title="Ver lista de formularios ODK" onPress={openOdkForms} />

      {/* startInstanceUploaderList() → abre la pantalla de envío de formularios */}
      <Button title="Abrir cargador de instancias" onPress={startInstanceUploaderList} />

      {/* ──────────────────────────────────────────────
          SECCIÓN 2: Contexto de apertura
          Determinan si la app está corriendo como
          "external app" dentro de un formulario ODK.
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Contexto</Text>

      <Button title="¿Fue abierta por ODK?" onPress={handleCheckContext} />
      <Button title="Obtener ID ODK actual" onPress={handleGetCurrentId} />

      {/* ──────────────────────────────────────────────
          SECCIÓN 3: Intent Extras
          ODK Collect puede pasar datos al abrir tu app
          como "extras" del Intent de Android.
          Por ejemplo: uuid del formulario, id de parcela,
          nombre del productor, etc.

          getIntentExtras() → todos los campos como objeto
          getIntentExtra(key) → un campo específico como string
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Intent Extras</Text>

      <Button
        title="getIntentExtras() — Leer todos los campos"
        onPress={() => {
          const extras = getIntentExtras();
          const keys = Object.keys(extras);
          Alert.alert(
            'Intent Extras',
            keys.length === 0
              ? 'No hay extras en el intent actual.\n\nEsto es normal si la app no fue abierta por un formulario ODK.'
              : keys.map(k => `${k}: ${extras[k]}`).join('\n')
          );
        }}
      />

      <Button
        title='getIntentExtra("uuid") — Leer campo "uuid"'
        onPress={() => {
          // getIntentExtra lee un campo específico por nombre.
          // ODK Collect normalmente pasa el UUID del formulario como "uuid".
          const val = getIntentExtra('uuid');
          Alert.alert(
            'getIntentExtra("uuid")',
            val || '(vacío — ODK no pasó este campo)'
          );
        }}
      />

      {/* ──────────────────────────────────────────────
          SECCIÓN 4: Pantallas más completas
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Pantallas</Text>

      <Button
        title="→ Pantalla: Lista de Formularios"
        onPress={() => router.push('/forms')}
      />
      <Button
        title="→ Pantalla: Modo App Externa (flujo completo)"
        onPress={() => router.push('/external-app')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 4,
    color: '#555',
  },
});
