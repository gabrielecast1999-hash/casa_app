const supabase = require('../db/supabase')

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token mancante' })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Token non valido' })
    }

    // Recupera il profilo con house_id
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Se il profilo non esiste, crealo
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email,
        })
        .select()
        .single()
      profile = newProfile
    }

    // Assegna l'utente con i dati del profilo
    req.user = user
    if (profile) {
      req.user.house_id = profile.house_id
      req.user.name = profile.name
      req.user.fcm_token = profile.fcm_token
    }
    next()
  } catch (err) {
    console.error('Errore auth:', err)
    return res.status(500).json({ error: 'Errore autenticazione' })
  }
}

module.exports = authMiddleware