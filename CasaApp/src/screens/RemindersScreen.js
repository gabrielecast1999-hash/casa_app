import React, { useEffect, useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

const REPEAT_OPTIONS = ['none', 'daily', 'weekly', 'monthly']
const REPEAT_LABELS = { none: 'Mai', daily: 'Ogni giorno', weekly: 'Ogni settimana', monthly: 'Ogni mese' }

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [repeat, setRepeat] = useState('none')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const fetchReminders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch('/reminders', {}, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setReminders(data)
    } catch (err) {
      Alert.alert('Errore', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const handleCreate = async () => {
    if (!title.trim()) return Alert.alert('Errore', 'Inserisci il titolo')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify({ title, date: selectedDate.toISOString(), repeat })
      }, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setModalVisible(false)
      setTitle('')
      setSelectedDate(new Date())
      setRepeat('none')
      fetchReminders()
    } catch (err) {
      Alert.alert('Errore', err.message)
    }
  }

  const handleDelete = async (id) => {
    Alert.alert('Elimina', 'Vuoi eliminare questo promemoria?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            await apiFetch(`/reminders/${id}`, { method: 'DELETE' }, session)
            fetchReminders()
          } catch (err) {
            Alert.alert('Errore', err.message)
          }
        }
      }
    ])
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const renderReminder = ({ item }) => (
    <TouchableOpacity
      style={styles.reminderCard}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.reminderInfo}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        <Text style={styles.reminderDate}>{formatDate(item.date)}</Text>
        {item.repeat !== 'none' && (
          <Text style={styles.reminderRepeat}>🔄 {REPEAT_LABELS[item.repeat]}</Text>
        )}
      </View>
    </TouchableOpacity>
  )

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#4285F4" />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Promemoria</Text>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderReminder}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nessun promemoria. Aggiungine uno!</Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuovo Promemoria</Text>

            <TextInput
              style={styles.input}
              placeholder="Titolo (es. Pagare affitto)"
              value={title}
              onChangeText={setTitle}
            />
            <TouchableOpacity
  style={styles.input}
  onPress={() => setShowDatePicker(true)}
>
  <Text style={{ fontSize: 16, color: selectedDate ? '#000' : '#aaa' }}>
    {selectedDate
      ? selectedDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Seleziona data'}
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.input}
  onPress={() => setShowTimePicker(true)}
>
  <Text style={{ fontSize: 16, color: selectedDate ? '#000' : '#aaa' }}>
    {selectedDate
      ? selectedDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      : 'Seleziona ora'}
  </Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={selectedDate}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowDatePicker(false)
      if (date) setSelectedDate(date)
    }}
  />
)}

{showTimePicker && (
  <DateTimePicker
    value={selectedDate}
    mode="time"
    display="default"
    onChange={(event, time) => {
      setShowTimePicker(false)
      if (time) setSelectedDate(time)
    }}
  />
)}

            <Text style={styles.repeatLabel}>Ripeti:</Text>
            <View style={styles.repeatOptions}>
              {REPEAT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.repeatOption, repeat === option && styles.repeatOptionActive]}
                  onPress={() => setRepeat(option)}
                >
                  <Text style={[styles.repeatOptionText, repeat === option && styles.repeatOptionTextActive]}>
                    {REPEAT_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
              <Text style={styles.primaryButtonText}>Crea Promemoria</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
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
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  reminderDate: { fontSize: 13, color: '#888' },
  reminderRepeat: { fontSize: 13, color: '#4285F4', marginTop: 4 },
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
  repeatLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  repeatOptions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  repeatOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  repeatOptionActive: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
  repeatOptionText: { color: '#666' },
  repeatOptionTextActive: { color: '#fff' },
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