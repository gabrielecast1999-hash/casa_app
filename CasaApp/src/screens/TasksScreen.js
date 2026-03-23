import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
  StyleSheet,
} from 'react-native'
import Toast from 'react-native-toast-message'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import ConfirmDialog from '../components/ConfirmDialog'

const STATUS_COLORS = {
  ok: '#4CAF50',
  warning: '#FFC107',
  tomorrow: '#FF9800',
  danger: '#F44336',
}

const getDaysSince = (dateString) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const doneAt = new Date(dateString)
  const doneAtLocal = new Date(doneAt.getTime() - doneAt.getTimezoneOffset() * 60000)
  doneAtLocal.setHours(0, 0, 0, 0)
  return Math.round((today - doneAtLocal) / (1000 * 60 * 60 * 24))
}

const getTaskStatus = (taskLogs, frequencyDays) => {
  if (!taskLogs || taskLogs.length === 0) return 'danger'
  const lastLog = taskLogs.sort((a, b) => new Date(b.done_at) - new Date(a.done_at))[0]
  const daysSince = getDaysSince(lastLog.done_at)
  const daysUntilDue = frequencyDays - daysSince
  if (daysUntilDue <= 0) return 'danger'
  if (daysUntilDue === 1) return 'tomorrow'
  if (daysUntilDue <= frequencyDays * 0.5) return 'warning'
  return 'ok'
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskIcon, setNewTaskIcon] = useState('')
  const [newTaskFrequency, setNewTaskFrequency] = useState('')
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const shakeAnimations = useRef({})

  const getShakeAnimation = (taskId) => {
    if (!shakeAnimations.current[taskId]) {
      shakeAnimations.current[taskId] = new Animated.Value(0)
    }
    return shakeAnimations.current[taskId]
  }

  const startShake = (task) => {
    setEditingTaskId(task.id)
    const animation = getShakeAnimation(task.id)
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(animation, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ])
    ).start()
  }

  const stopShake = (taskId) => {
    setEditingTaskId(null)
    const animation = getShakeAnimation(taskId)
    animation.stopAnimation()
    animation.setValue(0)
  }

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch('/tasks', {}, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setTasks(data)
    } catch (err) {
      Alert.alert('Errore', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleLogTask = (taskId, taskName) => {
    setSelectedTask({ id: taskId, name: taskName })
    setConfirmVisible(true)
  }

  const confirmLogTask = async () => {
    setConfirmVisible(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch(`/tasks/${selectedTask.id}/log`, { method: 'POST' }, session)
      if (!response.ok) throw new Error('Errore nel log')
      Toast.show({
        type: 'success',
        text1: '✅ Completato!',
        text2: `${selectedTask.name} segnato come fatto`,
        position: 'top',
        visibilityTime: 3000,
      })
      fetchTasks()
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '❌ Errore',
        text2: err.message,
        position: 'top',
      })
    }
  }

  const handleDeleteTask = async () => {
    setDeleteConfirmVisible(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch(`/tasks/${selectedTask.id}`, { method: 'DELETE' }, session)
      if (!response.ok) throw new Error('Errore eliminazione')
      Toast.show({
        type: 'success',
        text1: '🗑️ Eliminato!',
        text2: `${selectedTask.name} eliminato`,
        position: 'top',
        visibilityTime: 3000,
      })
      fetchTasks()
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '❌ Errore',
        text2: err.message,
        position: 'top',
      })
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskName.trim() || !newTaskFrequency.trim()) {
      return Alert.alert('Errore', 'Compila tutti i campi')
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          name: newTaskName,
          icon: newTaskIcon || '🏠',
          frequency_days: parseInt(newTaskFrequency)
        })
      }, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setModalVisible(false)
      setNewTaskName('')
      setNewTaskIcon('')
      setNewTaskFrequency('')
      fetchTasks()
    } catch (err) {
      Alert.alert('Errore', err.message)
    }
  }

  const handleEditTask = async () => {
    if (!newTaskName.trim() || !newTaskFrequency.trim()) {
      return Alert.alert('Errore', 'Compila tutti i campi')
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch(`/tasks/${selectedTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newTaskName,
          icon: newTaskIcon || '🏠',
          frequency_days: parseInt(newTaskFrequency)
        })
      }, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setEditModalVisible(false)
      Toast.show({
        type: 'success',
        text1: '✅ Aggiornato!',
        text2: `${newTaskName} aggiornato`,
        position: 'top',
        visibilityTime: 3000,
      })
      fetchTasks()
    } catch (err) {
      Alert.alert('Errore', err.message)
    }
  }

  const openEditModal = (task) => {
    stopShake(task.id)
    setSelectedTask(task)
    setNewTaskName(task.name)
    setNewTaskIcon(task.icon || '')
    setNewTaskFrequency(String(task.frequency_days))
    setEditModalVisible(true)
  }

  const renderTask = ({ item }) => {
    const status = getTaskStatus(item.task_logs, item.frequency_days)
    const lastLog = item.task_logs?.sort((a, b) => new Date(b.done_at) - new Date(a.done_at))[0]
    const daysSince = lastLog ? getDaysSince(lastLog.done_at) : null
    const daysUntilDue = daysSince !== null ? item.frequency_days - daysSince : null
    const isEditing = editingTaskId === item.id
    const shakeAnim = getShakeAnimation(item.id)

    const getStatusText = () => {
      if (daysSince === null) return 'Mai fatto'
      if (daysUntilDue <= 0) return '🔴 Scaduto!'
      if (daysUntilDue === 1) return '⚠️ Scade domani'
      if (daysSince === 0) return 'Fatto oggi'
      return `${daysSince} giorni fa`
    }

    return (
      <Animated.View style={[
        styles.taskCard,
        { transform: [{ translateX: shakeAnim }] }
      ]}>
        <TouchableOpacity
          style={styles.taskInfo}
          onPress={() => {
            if (isEditing) {
              openEditModal(item)
            }
          }}
          onLongPress={() => startShake(item)}
        >
          <Text style={styles.taskName}>{item.icon} {item.name}</Text>
          <Text style={styles.taskMeta}>
            {getStatusText()}
            {' · '}ogni {item.frequency_days} giorni
          </Text>
        </TouchableOpacity>

        {isEditing ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              stopShake(item.id)
              setSelectedTask(item)
              setDeleteConfirmVisible(true)
            }}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: STATUS_COLORS[status] }]}
            onPress={() => handleLogTask(item.id, item.name)}
          >
            <Text style={styles.doneButtonText}>✓</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    )
  }

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#4285F4" />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Task</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nessun task. Aggiungine uno!</Text>
        }
      />

      {/* Overlay per disattivare shake su click esterno */}
      {editingTaskId && (
        <TouchableOpacity
          style={styles.shakeOverlay}
          onPress={() => stopShake(editingTaskId)}
          activeOpacity={1}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Confirm completamento */}
      <ConfirmDialog
        visible={confirmVisible}
        title="Conferma completamento"
        message={`Hai completato "${selectedTask?.name}"?`}
        confirmText="Sì, fatto! ✓"
        confirmColor="#4CAF50"
        onConfirm={confirmLogTask}
        onCancel={() => setConfirmVisible(false)}
      />

      {/* Confirm eliminazione */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Elimina task"
        message={`Vuoi eliminare "${selectedTask?.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        confirmColor="#F44336"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      {/* Modal crea task */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuovo Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome (es. Cambia lenzuola)"
              value={newTaskName}
              onChangeText={setNewTaskName}
            />
            <TextInput
              style={styles.input}
              placeholder="Icona (es. 🛏️)"
              value={newTaskIcon}
              onChangeText={setNewTaskIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ogni quanti giorni?"
              value={newTaskFrequency}
              onChangeText={setNewTaskFrequency}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateTask}>
              <Text style={styles.primaryButtonText}>Crea Task</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal modifica task */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifica Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={newTaskName}
              onChangeText={setNewTaskName}
            />
            <TextInput
              style={styles.input}
              placeholder="Icona"
              value={newTaskIcon}
              onChangeText={setNewTaskIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ogni quanti giorni?"
              value={newTaskFrequency}
              onChangeText={setNewTaskFrequency}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleEditTask}>
              <Text style={styles.primaryButtonText}>Salva modifiche</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  loader: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 16, fontWeight: '600' },
  taskMeta: { fontSize: 13, color: '#888', marginTop: 4 },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#4285F4',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
  shakeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelText: { textAlign: 'center', color: '#888', fontSize: 16 },
})