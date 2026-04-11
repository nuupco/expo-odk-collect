/**
 * forms.tsx — Pantalla de lista de formularios ODK
 *
 * Demuestra cómo obtener, listar y gestionar instancias de formularios
 * almacenadas en ODK Collect usando el módulo expo-odk-collect.
 *
 * Funciones demostradas:
 *  - getForms()           → consulta el ContentProvider de ODK y retorna las instancias
 *  - editODKInstance(id)  → abre ODK Collect para editar una instancia específica
 *  - sendODKInstance(id, serverUrl) → envía una instancia al servidor ODK configurado
 *
 * ¿Qué es una "instancia"?
 * En ODK, cada vez que un usuario llena un formulario, se crea una "instancia":
 * una copia del formulario con los datos ingresados. Las instancias pueden estar
 * en estado "incomplete" (incompleta), "complete" (lista para enviar) o "submitted"
 * (ya enviada al servidor).
 *
 * Requisitos:
 *  - ODK Collect instalado en el dispositivo Android
 *  - Al menos un formulario iniciado (aunque sea incompleto) en ODK Collect
 *  - El servidor configurado en SERVER_URL debe ser una instancia de ODK Central o KoboToolbox
 */

import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { getForms, editODKInstance, sendODKInstance } from 'expo-odk-collect';
import type { OdkFormInstance } from 'expo-odk-collect';

/**
 * URL del servidor ODK al que se enviarán las instancias.
 * Reemplazá este valor con la URL real de tu instancia de ODK Central o KoboToolbox.
 *
 * Ejemplo ODK Central: 'https://central.tudominio.com'
 * Ejemplo KoboToolbox: 'https://kf.kobo.nuup.org'
 */
const SERVER_URL = 'https://kf.kobo.nuup.org';

export default function FormsScreen() {
  // Lista de instancias cargadas desde ODK Collect
  const [forms, setForms] = useState<OdkFormInstance[]>([]);

  // Estado de carga mientras se consulta el ContentProvider
  const [loading, setLoading] = useState(false);

  /**
   * getForms()
   * Consulta el ContentProvider de ODK Collect y retorna todas las instancias
   * de formularios almacenadas en el dispositivo.
   *
   * Es una función síncrona — no usa async/await.
   * Si ODK Collect no está instalado, emite `onError` con código 'ODK_NOT_INSTALLED'.
   * Si la consulta falla por otro motivo, emite 'FORMS_QUERY_FAILED'.
   * Ambos errores se manejan globalmente en _layout.tsx.
   *
   * El objeto OdkFormInstance tiene estos campos:
   *   _id          → ID interno del ContentProvider (fila en la BD de ODK)
   *   displayName  → nombre legible del formulario
   *   jrFormId     → ID JavaRosa del formulario (definido en el XLSForm)
   *   jrVersion    → versión del formulario
   *   status       → "incomplete" | "complete" | "submitted" | etc.
   *   date         → timestamp de última modificación (milisegundos como string)
   *   deletedDate  → timestamp de eliminación si fue borrado, "" si no
   */
  function handleLoadForms() {
    setLoading(true);
    try {
      const result = getForms();
      setForms(result);
    } finally {
      setLoading(false);
    }
  }

  /**
   * editODKInstance(id)
   * Abre ODK Collect directamente en la pantalla de edición de la instancia indicada.
   * Usa el _id interno del ContentProvider (no el jrFormId ni el UUID del formulario).
   *
   * Caso de uso: el usuario quiere completar un formulario que quedó incompleto.
   */
  function handleEdit(form: OdkFormInstance) {
    editODKInstance(form._id);
  }

  /**
   * sendODKInstance(id, serverUrl)
   * Dispara el envío de una instancia específica al servidor ODK configurado.
   * ODK Collect maneja la comunicación con el servidor — esta función solo
   * indica a ODK qué instancia enviar y a qué URL.
   *
   * Pedimos confirmación antes de enviar porque es una acción irreversible
   * (una vez enviada, la instancia no se puede recuperar localmente).
   */
  function handleSend(form: OdkFormInstance) {
    Alert.alert(
      'Enviar instancia',
      `¿Subir "${form.displayName}" al servidor?\n\nServidor: ${SERVER_URL}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => sendODKInstance(form._id, SERVER_URL),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Botón para cargar las instancias desde ODK Collect.
          La carga es síncrona pero puede tardar si hay muchas instancias. */}
      <Button title="Cargar formularios de ODK" onPress={handleLoadForms} />

      {/* Indicador de carga mientras se consulta el ContentProvider */}
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      {/* Mensaje cuando no hay formularios cargados todavía */}
      {forms.length === 0 && !loading && (
        <Text style={styles.empty}>
          No hay formularios cargados.{'\n'}
          Tocá "Cargar formularios de ODK" para comenzar.
        </Text>
      )}

      {/* Lista de instancias con acciones por item */}
      <FlatList
        data={forms}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Nombre legible del formulario */}
            <Text style={styles.cardTitle}>{item.displayName}</Text>

            {/* Metadatos del formulario: ID y versión JavaRosa */}
            <Text style={styles.cardMeta}>
              Form ID: {item.jrFormId} · v{item.jrVersion}
            </Text>

            {/* Estado de la instancia: incomplete / complete / submitted */}
            <Text style={styles.cardMeta}>Estado: {item.status}</Text>

            {/* Acciones disponibles para esta instancia */}
            <View style={styles.cardActions}>
              {/* Editar → abre ODK Collect en la pantalla de edición */}
              <Button title="Editar" onPress={() => handleEdit(item)} />

              {/* Enviar → confirma y sube al servidor ODK */}
              <Button title="Enviar" onPress={() => handleSend(item)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
    lineHeight: 22,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: '#555', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
