import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

export default function HouseSetupScreen({ onHouseJoined }) {
  const [houseName, setHouseName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(null) // 'create' o 'join'

  const handleCreateHouse = async () => {
    if (!houseName.trim()) return Alert.alert('Errore', 'Inserisci un nome per la casa')
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch('/houses', {
        method: 'POST',
        body: JSON.stringify({ name: houseName })
      }, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
        onHouseJoined()
      } catch (err) {
      Alert.alert('Errore', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHouse = async () => {
    if (!inviteCode.trim()) return Alert.alert('Errore', 'Inserisci il codice invito')
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await apiFetch('/houses/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode.toUpperCase() })
      }, session)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      onHouseJoined()
    } catch (err) {
      Alert.alert('Errore', err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏠 Benvenuto!</Text>
        <Text style={styles.subtitle}>Per iniziare, crea una casa o unisciti a una esistente</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setMode('create')}>
          <Text style={styles.primaryButtonText}>Crea una casa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('join')}>
          <Text style={styles.secondaryButtonText}>Unisciti con codice invito</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'create' ? '🏠 Crea casa' : '🔑 Unisciti'}
      </Text>

      {mode === 'create' ? (
        <TextInput
          style={styles.input}
          placeholder="Nome della casa (es. Casa Milano)"
          value={houseName}
          onChangeText={setHouseName}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Codice invito (es. ABC123)"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={mode === 'create' ? handleCreateHouse : handleJoinHouse}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {mode === 'create' ? 'Crea' : 'Unisciti'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(null)}>
        <Text style={styles.backText}>← Indietro</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  secondaryButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
})