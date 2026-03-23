const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const authMiddleware = require('../middleware/auth')

// Funzione per generare un invite code casuale
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// POST - Crea una nuova casa
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body

  try {
    // Crea la casa
    const { data: house, error: houseError } = await supabase
      .from('houses')
      .insert({
        name,
        invite_code: generateInviteCode()
      })
      .select()
      .single()

    if (houseError) return res.status(400).json({ error: houseError.message })

    // Aggiorna l'utente con il house_id
    const { error: userError } = await supabase
      .from('profiles')  // ← era 'users'
      .update({ house_id: house.id })
      .eq('id', req.user.id)
    if (userError) return res.status(400).json({ error: userError.message })

    res.status(201).json(house)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST - Entra in una casa con invite code
router.post('/join', authMiddleware, async (req, res) => {
  const { invite_code } = req.body

  try {
    // Cerca la casa con l'invite code
    const { data: house, error: houseError } = await supabase
      .from('houses')
      .select('*')
      .eq('invite_code', invite_code)
      .single()

    if (houseError || !house) {
      return res.status(404).json({ error: 'Codice invito non valido' })
    }

    // Aggiorna l'utente con il house_id
    const { error: userError } = await supabase
      .from('profiles')  // ← era 'users'
      .update({ house_id: house.id })
      .eq('id', req.user.id)
    if (userError) return res.status(400).json({ error: userError.message })

    res.json(house)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET - Info sulla casa corrente
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user.house_id) {
      return res.status(400).json({ error: 'Utente non assegnato a una casa' })
    }

    const { data, error } = await supabase
      .from('houses')
      .select(`
        *,
        profiles (
          id,
          name
        )
      `)
      .eq('id', req.user.house_id)
      .single()

    if (error) return res.status(400).json({ error: error.message })

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router