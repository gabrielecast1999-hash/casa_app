import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native'
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '15688699451-gqgve2f23dd9qhcf4hu4h77oq8ku7h6n.apps.googleusercontent.com', // quello di tipo "Applicazione web"
    })
  }, [])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      })

      if (error) throw error

    } catch (err) {
      Alert.alert('Errore', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Casa App</Text>
      <Text style={styles.subtitle}>Gestisci la tua casa condivisa</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={handleGoogleLogin}
        />
      )}
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
    fontSize: 48,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 60,
  },
})
