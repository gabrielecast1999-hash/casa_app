const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const authMiddleware = require('../middleware/auth')
const admin = require('firebase-admin')

// Inizializza Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  })
}

// Salva token FCM
router.post('/token', authMiddleware, async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Token FCM mancante' })

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', req.user.id)

    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Token salvato' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Invia notifica a tutti i coinquilini
router.post('/send', authMiddleware, async (req, res) => {
  const { title, body } = req.body

  try {
    if (!req.user.house_id) {
      return res.status(400).json({ error: 'Utente non assegnato a una casa' })
    }

    // Prendi tutti i token FCM della casa
    const { data: profiles } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('house_id', req.user.house_id)
      .not('fcm_token', 'is', null)

    const tokens = profiles.map(p => p.fcm_token).filter(Boolean)
    if (tokens.length === 0) return res.json({ message: 'Nessun dispositivo' })

    // Invia notifica
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body }
    })

    res.json({ message: 'Notifica inviata' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
