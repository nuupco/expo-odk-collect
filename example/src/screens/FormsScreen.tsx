/**
 * FormsScreen.tsx — Pantalla de lista de formularios e instancias ODK
 *
 * Demuestra cómo obtener, listar y gestionar formularios e instancias
 * almacenadas en ODK Collect usando el módulo expo-odk-collect.
 *
 * Funciones demostradas:
 *  - odk.getForms()         → consulta el ContentProvider de ODK y retorna los formularios
 *  - odk.getInstances()     → consulta el ContentProvider y retorna las instancias
 *  - odk.editInstance(id)   → abre ODK Collect para editar una instancia específica
 *
 * ¿Qué es una "instancia"?
 * En ODK, cada vez que un usuario llena un formulario, se crea una "instancia":
 * una copia del formulario con los datos ingresados. Las instancias pueden estar
 * en estado "incomplete" (incompleta), "complete" (lista para enviar) o "submitted"
 * (ya enviada al servidor).
 *
 * ¿Qué es un "formulario"?
 * Los formularios son las plantillas (XLSForms) disponibles en ODK Collect.
 * No contienen datos ingresados — son la definición del formulario.
 *
 * Requisitos:
 *  - ODK Collect instalado en el dispositivo Android
 *  - Al menos un formulario descargado o instancia iniciada en ODK Collect
 */

import { View, Text, StyleSheet, FlatList, Button, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useOdk } from 'expo-odk-collect';
import type { OdkForm, OdkInstance } from 'expo-odk-collect';

export function FormsScreen() {
  const { odk } = useOdk();

  // Lista de formularios cargados desde ODK Collect
  const [forms, setForms] = useState<OdkForm[]>([]);

  // Lista de instancias cargadas desde ODK Collect
  const [instances, setInstances] = useState<OdkInstance[]>([]);

  // Estado de carga mientras se consulta el ContentProvider
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);

  /**
   * odk.getForms()
   * Consulta el ContentProvider de ODK Collect (content://...odk.forms/forms)
   * y retorna todos los formularios disponibles en el dispositivo.
   *
   * Cada OdkForm tiene:
   *   id          → ID interno del ContentProvider
   *   displayName → nombre legible del formulario
   *   jrFormId    → ID JavaRosa (definido en el XLSForm)
   *   jrVersion   → versión del formulario
   */
  async function handleLoadForms() {
    setLoadingForms(true);
    try {
      const result = await odk.getForms();
      setForms(result);
      if (result.length === 0) {
        Alert.alert('Sin formularios', 'No se encontraron formularios en ODK Collect.');
      }
    } finally {
      setLoadingForms(false);
    }
  }

  /**
   * odk.getInstances()
   * Consulta el ContentProvider de ODK Collect (content://...odk.instances/instances)
   * y retorna todas las instancias (formularios con datos) en el dispositivo.
   *
   * Cada OdkInstance tiene:
   *   id          → ID interno del ContentProvider
   *   instanceId  → mismo que id (alias semántico)
   *   displayName → nombre legible
   *   jrFormId    → ID del formulario base
   *   status      → 'incomplete' | 'complete' | 'submitted' | 'submissionFailed' | 'unknown'
   *   createdAt   → fecha de creación
   */
  async function handleLoadInstances() {
    setLoadingInstances(true);
    try {
      const result = await odk.getInstances();
      setInstances(result);
      if (result.length === 0) {
        Alert.alert('Sin instancias', 'No se encontraron instancias en ODK Collect.');
      }
    } finally {
      setLoadingInstances(false);
    }
  }

  /**
   * odk.editInstance(id)
   * Abre ODK Collect directamente en la pantalla de edición de la instancia indicada.
   * Usa el id interno del ContentProvider.
   *
   * El resultado (RESULT_OK / RESULT_CANCELED) llega via onActivityResult.
   * Caso de uso: el usuario quiere completar un formulario que quedó incompleto.
   */
  function handleEdit(instance: OdkInstance) {
    odk.editInstance(instance.id);
  }

  return (
    <View style={styles.container}>
      {/* ── Formularios ── */}
      <Text style={styles.sectionTitle}>Formularios</Text>
      <Button
        title={loadingForms ? 'Cargando...' : 'Cargar formularios'}
        onPress={handleLoadForms}
        disabled={loadingForms}
      />
      {loadingForms && <ActivityIndicator style={{ marginTop: 8 }} />}

      {forms.length > 0 && (
        <FlatList
          data={forms}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.displayName}</Text>
              <Text style={styles.cardMeta}>
                Form ID: {item.jrFormId}
                {item.jrVersion ? ` · v${item.jrVersion}` : ''}
              </Text>
            </View>
          )}
        />
      )}

      {/* ── Instancias ── */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Instancias</Text>
      <Button
        title={loadingInstances ? 'Cargando...' : 'Cargar instancias'}
        onPress={handleLoadInstances}
        disabled={loadingInstances}
      />
      {loadingInstances && <ActivityIndicator style={{ marginTop: 8 }} />}

      {instances.length === 0 && !loadingInstances && (
        <Text style={styles.empty}>
          No hay instancias cargadas.{'\n'}
          Tocá "Cargar instancias" para comenzar.
        </Text>
      )}

      <FlatList
        data={instances}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Nombre legible de la instancia */}
            <Text style={styles.cardTitle}>{item.displayName}</Text>

            {/* Metadatos: formulario base y versión */}
            <Text style={styles.cardMeta}>
              Form ID: {item.jrFormId}
              {item.jrVersion ? ` · v${item.jrVersion}` : ''}
            </Text>

            {/* Estado de la instancia */}
            <Text style={[styles.cardMeta, styles[`status_${item.status}` as keyof typeof styles] ?? {}]}>
              Estado: {item.status}
            </Text>

            {item.createdAt && (
              <Text style={styles.cardMeta}>Creada: {item.createdAt}</Text>
            )}

            {/* Acciones disponibles para esta instancia */}
            <View style={styles.cardActions}>
              {/* Editar → abre ODK Collect en la pantalla de edición */}
              <Button title="Editar" onPress={() => handleEdit(item)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
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
  // Status colors
  status_incomplete: { color: '#e67e22' },
  status_complete: { color: '#27ae60' },
  status_submitted: { color: '#2980b9' },
  status_submissionFailed: { color: '#e74c3c' },
  status_unknown: { color: '#95a5a6' },
});
