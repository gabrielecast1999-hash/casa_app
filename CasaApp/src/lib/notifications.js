import messaging from '@react-native-firebase/messaging'
import { supabase } from './supabase'
import { apiFetch } from './api'
import Toast from 'react-native-toast-message'

// Chiedi permesso per le notifiche
export const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission()
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL

  if (enabled) {
    await saveFCMToken()
  }

  return enabled
}

// Salva il token FCM nel backend
export const saveFCMToken = async () => {
  try {
    const fcmToken = await messaging().getToken()
    if (!fcmToken) {
      console.warn('FCM token non disponibile')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.warn('Nessuna sessione Supabase, impossibile salvare token FCM')
      return
    }

    const response = await apiFetch('/notifications/token', {
      method: 'POST',
      body: JSON.stringify({ token: fcmToken }),
    }, session)

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Errore backend salvataggio token FCM: ${response.status} - ${text}`)
    }

    console.log('Token FCM salvato con successo sul backend')
  } catch (err) {
    console.error('Errore salvataggio token FCM:', err)
  }
}

// Ascolta notifiche in foreground
export const setupForegroundNotifications = () => {
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    Toast.show({
      type: 'info',
      text1: remoteMessage.notification?.title || '🔔 Promemoria',
      text2: remoteMessage.notification?.body || '',
      position: 'top',
      visibilityTime: 4000,
    })
  })

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Notifica background:', remoteMessage)
  })

  return unsubscribeForeground
}