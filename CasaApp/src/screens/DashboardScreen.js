import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'
import HouseSetupScreen from './HouseSetupScreen'
import TasksScreen from './TasksScreen'
import TabNavigator from '../navigation/TabNavigator'

export default function DashboardScreen() {
  const [houseId, setHouseId] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkHouse = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: profile } = await supabase
      .from('profiles')
      .select('house_id')
      .eq('id', session.user.id)
      .single()

    setHouseId(profile?.house_id)
    setLoading(false)
  }

  useEffect(() => {
    checkHouse()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    )
  }

  if (!houseId) {
    return <HouseSetupScreen onHouseJoined={checkHouse} />
  }

  return <TabNavigator />

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
    fontSize: 48,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})