/**
 * index.tsx — Pantalla principal del ejemplo
 *
 * Esta pantalla sirve como punto de entrada para explorar todas las funciones
 * del módulo expo-odk-collect de forma interactiva.
 *
 * Está organizada en cuatro secciones:
 *
 *  1. Navegación ODK → abre pantallas de ODK Collect directamente
 *     (odk.launch, odk.openForms, odk.openInstances)
 *
 *  2. Selección con resultado → inicia un flujo con retorno de URI
 *     (odk.pickForm, odk.pickInstance)
 *
 *  3. Intent Extras → lee los datos que ODK Collect pasó al abrir la app
 *     (odk.getIntentExtras)
 *
 *  4. Pantallas → navega a las pantallas de ejemplo más completas
 *
 * Nota: la mayoría de estas funciones solo tienen efecto real en Android
 * con ODK Collect instalado. En web o simulador sin ODK, retornan valores
 * vacíos y muestran advertencias en consola.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOdk } from 'expo-odk-collect';
import type { OdkActivityResult } from 'expo-odk-collect';

export default function HomeScreen() {
  const router = useRouter();
  const { odk, result, error } = useOdk();

  // Estado de instalación de ODK Collect
  const [installed, setInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    odk.isInstalled().then(setInstalled);
  }, []);

  /**
   * Muestra en un Alert el último resultado de actividad (pickForm, pickInstance, editInstance).
   * El hook useOdk() captura automáticamente los eventos onActivityResult del módulo.
   */
  useEffect(() => {
    if (!result) return;
    Alert.alert(
      'Resultado de actividad',
      `requestCode: ${result.requestCode}\nresultCode: ${result.resultCode}\nuri: ${result.uri ?? '(vacío)'}`
    );
  }, [result]);

  /**
   * Muestra errores del módulo en un Alert.
   * El hook useOdk() también captura onError — el _layout.tsx maneja los globales,
   * pero podés escuchar desde cualquier pantalla si necesitás reaccionar localmente.
   */
  useEffect(() => {
    if (!error) return;
    Alert.alert(`Error ODK [${error.code}]`, error.message);
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>expo-odk-collect Demo</Text>

      {/* Estado de instalación */}
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>
          ODK Collect:{' '}
          {installed === null
            ? 'verificando...'
            : installed
            ? '✅ instalado'
            : '❌ no instalado'}
        </Text>
      </View>

      {/* ──────────────────────────────────────────────
          SECCIÓN 1: Navegación hacia ODK Collect
          Estas funciones abren ODK Collect directamente
          usando Android Intents (sin retorno de resultado).
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Navegación ODK</Text>

      {/* odk.launch() → abre la pantalla principal de ODK Collect */}
      <Button title="Abrir ODK Collect" onPress={() => odk.launch()} />

      {/* odk.openForms() → abre la lista de formularios disponibles en ODK */}
      <Button title="Ver lista de formularios ODK" onPress={() => odk.openForms()} />

      {/* odk.openInstances() → abre la pantalla de instancias/envío */}
      <Button title="Abrir lista de instancias" onPress={() => odk.openInstances()} />

      {/* ──────────────────────────────────────────────
          SECCIÓN 2: Selección con resultado
          Estas funciones abren ODK Collect con ACTION_PICK.
          La URI del ítem seleccionado se recibe en el evento
          `onActivityResult` capturado por useOdk().
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Selección (con resultado)</Text>

      {/* odk.pickForm() → el usuario elige un formulario; retorna su URI */}
      <Button title="Seleccionar formulario (pickForm)" onPress={() => odk.pickForm()} />

      {/* odk.pickInstance() → el usuario elige una instancia; retorna su URI */}
      <Button title="Seleccionar instancia (pickInstance)" onPress={() => odk.pickInstance()} />

      {/* ──────────────────────────────────────────────
          SECCIÓN 3: Intent Extras
          ODK Collect puede pasar datos al abrir tu app
          como "extras" del Intent de Android.
          Por ejemplo: uuid del formulario, id de parcela,
          nombre del productor, etc.

          odk.getIntentExtras() → todos los campos como objeto
          ────────────────────────────────────────────── */}
      <Text style={styles.section}>Intent Extras</Text>

      <Button
        title="getIntentExtras() — Leer todos los campos"
        onPress={async () => {
          const extras = await odk.getIntentExtras();
          const keys = Object.keys(extras);
          Alert.alert(
            'Intent Extras',
            keys.length === 0
              ? 'No hay extras en el intent actual.\n\nEsto es normal si la app no fue abierta por un formulario ODK.'
              : keys.map((k) => `${k}: ${extras[k]}`).join('\n')
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  statusText: { fontSize: 14, color: '#333' },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 4,
    color: '#555',
  },
});
