const cron = require('node-cron')
const supabase = require('../db/supabase')
const admin = require('firebase-admin')

const sendTaskNotifications = async () => {
  console.log('Controllo task in scadenza...')

  try {
    // Prendi tutti i task con i loro ultimi log
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_logs (
          id,
          done_at
        ),
        houses (
          id
        )
      `)

    if (error) throw error
    if (!tasks || tasks.length === 0) return

    for (const task of tasks) {
      try {
        // Calcola giorni mancanti alla scadenza
        const lastLog = task.task_logs
          ?.sort((a, b) => new Date(b.done_at) - new Date(a.done_at))[0]

        let daysUntilDue

        if (!lastLog) {
          // Mai fatto — già scaduto
          daysUntilDue = 0
        } else {
          const lastDone = new Date(lastLog.done_at)
          const dueDate = new Date(lastDone)
          dueDate.setDate(dueDate.getDate() + task.frequency_days)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          dueDate.setHours(0, 0, 0, 0)
          daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24))
        }

        // Notifica solo se mancano 1 giorno o 0 giorni
        if (daysUntilDue > 1 || daysUntilDue < 0) continue

        // Prendi i token FCM della casa
        const { data: profiles } = await supabase
          .from('profiles')
          .select('fcm_token')
          .eq('house_id', task.house_id)
          .not('fcm_token', 'is', null)

        const tokens = profiles
          .map(p => p.fcm_token)
          .filter(Boolean)

        if (tokens.length === 0) continue

        const title = daysUntilDue === 1
          ? `⚠️ ${task.icon} ${task.name} scade domani!`
          : `🔴 ${task.icon} ${task.name} scade oggi!`

        const body = daysUntilDue === 1
          ? 'Ricordati di farlo entro domani'
          : 'È il momento di farlo!'

        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
          android: {
            priority: 'high',
            notification: {
              channelId: 'casa_app_channel',
              sound: 'default'
            }
          }
        })

        console.log(`Notifica inviata per task: ${task.name} (mancano ${daysUntilDue} giorni)`)

      } catch (err) {
        console.error(`Errore notifica task ${task.id}:`, err)
      }
    }
  } catch (err) {
    console.error('Errore job task notifiche:', err)
  }
}

// Esegui ogni giorno alle 9:00
const startTaskNotificationJob = () => {
  //cron.schedule('0 9 * * *', sendTaskNotifications)
  // Ogni minuto per testare
    cron.schedule('* * * * *', sendTaskNotifications)
    console.log('Job notifiche task avviato')
}

module.exports = { startTaskNotificationJob }