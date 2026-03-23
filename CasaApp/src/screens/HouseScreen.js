import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  FlatList
} from 'react-native'
import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function HouseScreen() {
  const [house, setHouse] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchHouse = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await apiFetch('/houses', {}, session)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    setHouse(data)
  } catch (err) {
    Alert.alert('Errore', err.message)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchHouse()
  }, [])

  const handleShareInviteCode = () => {
    Share.share({
      message: `Unisciti alla mia casa su Casa App! Usa il codice: ${house.invite_code}`,
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#4285F4" />

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 {house?.name}</Text>

      {/* Codice invito */}
      <View style={styles.inviteCard}>
        <Text style={styles.inviteLabel}>Codice invito</Text>
        <Text style={styles.inviteCode}>{house?.invite_code}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareInviteCode}>
          <Text style={styles.shareButtonText}>Condividi codice</Text>
        </TouchableOpacity>
      </View>

      {/* Coinquilini */}
      <Text style={styles.sectionTitle}>Coinquilini</Text>
      <FlatList
        data={house?.profiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {item.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.memberName}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nessun coinquilino ancora</Text>
        }
      />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  loader: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  inviteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
  },
  inviteLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  inviteCode: { fontSize: 32, fontWeight: 'bold', letterSpacing: 4, color: '#4285F4', marginBottom: 16 },
  shareButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  memberName: { fontSize: 16 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})