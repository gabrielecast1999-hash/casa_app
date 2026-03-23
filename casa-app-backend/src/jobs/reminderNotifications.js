const cron = require('node-cron')
const supabase = require('../db/supabase')
const admin = require('firebase-admin')

const sendReminderNotifications = async () => {
  console.log('Controllo reminder scaduti...')

  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        profiles!reminders_user_id_fkey (
          fcm_token
        )
      `)
      .lte('date', new Date().toISOString())
      .is('notified_at', null)

    if (error) throw error
    if (!reminders || reminders.length === 0) return

    console.log(`Trovati ${reminders.length} reminder da notificare`)

    for (const reminder of reminders) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('fcm_token')
          .eq('house_id', reminder.house_id)
          .not('fcm_token', 'is', null)

        const tokens = profiles
          .map(p => p.fcm_token)
          .filter(Boolean)

        if (tokens.length === 0) continue

        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: '🔔 Promemoria',
            body: `⏰ ${reminder.title}`,
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'casa_app_channel',
              sound: 'default'
            }
          }
        })

        console.log(`Notifica inviata per reminder: ${reminder.title}`)

        // Gestisci ripetizione
        if (reminder.repeat === 'none') {
          await supabase
            .from('reminders')
            .update({ notified_at: new Date().toISOString() })
            .eq('id', reminder.id)
        } else {
          const nextDate = new Date(reminder.date)
          if (reminder.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1)
          if (reminder.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7)
          if (reminder.repeat === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1)

          await supabase
            .from('reminders')
            .update({ date: nextDate.toISOString() })
            .eq('id', reminder.id)
        }

      } catch (err) {
        console.error(`Errore notifica reminder ${reminder.id}:`, err)
      }
    }
  } catch (err) {
    console.error('Errore job notifiche:', err)
  }
}

// Esegui ogni minuto
const startReminderJob = () => {
  cron.schedule('* * * * *', sendReminderNotifications)
  console.log('Job notifiche reminder avviato')
}

module.exports = { startReminderJob }