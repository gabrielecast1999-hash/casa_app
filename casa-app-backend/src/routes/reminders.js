const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const authMiddleware = require('../middleware/auth')

// GET - Lista promemoria
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user.house_id) {
      return res.json([])
    }

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('house_id', req.user.house_id)
      .order('date', { ascending: true })

    if (error) return res.status(400).json({ error: error.message })

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST - Crea promemoria
router.post('/', authMiddleware, async (req, res) => {
  const { title, date, repeat } = req.body

  try {
    if (!req.user.house_id) {
      return res.status(400).json({ error: 'Utente non assegnato a una casa' })
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        title,
        date,
        repeat: repeat || 'none',
        user_id: req.user.id,
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

// DELETE - Elimina promemoria
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    if (!req.user.house_id) {
      return res.status(400).json({ error: 'Utente non assegnato a una casa' })
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('house_id', req.user.house_id)

    if (error) return res.status(400).json({ error: error.message })

    res.json({ message: 'Promemoria eliminato' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router