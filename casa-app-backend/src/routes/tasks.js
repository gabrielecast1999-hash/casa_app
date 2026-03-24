const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const authMiddleware = require('../middleware/auth')

// PUT - Modifica task
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { name, icon, frequency_days, last_done_at } = req.body

  try {
    // Aggiorna il task
    const { data, error } = await supabase
      .from('tasks')
      .update({ name, icon, frequency_days })
      .eq('id', id)
      .eq('house_id', req.user.house_id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    // Se è stata fornita una data aggiorna l'ultimo log
    if (last_done_at) {
      // Elimina tutti i log esistenti e ne crea uno nuovo con la data fornita
      await supabase
        .from('task_logs')
        .delete()
        .eq('task_id', id)

      await supabase
        .from('task_logs')
        .insert({
          task_id: id,
          user_id: req.user.id,
          done_at: last_done_at
        })
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET - Lista tutti i task della casa
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Per ora restituisci array vuoto se l'utente non ha una casa
    if (!req.user.house_id) {
      return res.json([])
    }

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_logs (
          id,
          done_at,
          user_id
        )
      `)
      .eq('house_id', req.user.house_id)
      .order('created_at', { ascending: true })

    if (error) return res.status(400).json({ error: error.message })

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST - Crea nuovo task
router.post('/', authMiddleware, async (req, res) => {
  const { name, icon, frequency_days } = req.body

  try {
    if (!req.user.house_id) {
      return res.status(400).json({ error: 'Utente non assegnato a una casa' })
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        name,
        icon,
        frequency_days,
        house_id: req.user.house_id
      })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST - Segna task come fatto
router.post('/:id/log', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabase
      .from('task_logs')
      .insert({
        task_id: id,
        user_id: req.user.id
      })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE - Elimina task
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    if (!req.user.house_id) {
      return res.status(400).json({ error: 'Utente non assegnato a una casa' })
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('house_id', req.user.house_id)

    if (error) return res.status(400).json({ error: error.message })

    res.json({ message: 'Task eliminato con successo' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router