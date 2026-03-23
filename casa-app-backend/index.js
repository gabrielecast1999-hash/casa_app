const express = require('express')
const cors = require('cors')
require('dotenv').config()
const admin = require('firebase-admin')
const { startReminderJob } = require('./src/jobs/reminderNotifications')
const { startTaskNotificationJob } = require('./src/jobs/taskNotifications')

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

console.log('Firebase Admin inizializzato:', admin.apps.length > 0)
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID)
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL)
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY)

const housesRoutes = require('./src/routes/houses')
const tasksRoutes = require('./src/routes/tasks')
const remindersRoutes = require('./src/routes/reminders')
const notificationsRoutes = require('./src/routes/notifications')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/notifications', notificationsRoutes)
app.use('/reminders', remindersRoutes)
app.use('/houses', housesRoutes)
app.use('/tasks', tasksRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Casa App Backend funziona!' })
})

// Endpoint di test per debug
app.get('/debug', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ? 'SET' : 'NOT SET',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET'
    }
  })
})

app.post('/test-notification', async (req, res) => {
  try {
    const { token } = req.body
    console.log('Invio notifica a token:', token)

    const result = await admin.messaging().send({
      token,
      // Rimuovi notification e usa solo data
      data: {
        title: '🏠 Casa App',
        body: 'Le notifiche funzionano!'
      },
      android: {
        priority: 'high',
        ttl: 3600000,
      }
    })

    console.log('Risultato:', result)
    res.json({ message: 'Notifica inviata!', result })
  } catch (err) {
    console.error('Errore:', err)
    res.status(500).json({ error: err.message })
  }
})

startReminderJob()
startTaskNotificationJob()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`)
})