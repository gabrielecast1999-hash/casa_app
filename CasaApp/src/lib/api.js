import { API_BASE_URL } from '@env'

// Attenzione: su emulator Android usa 10.0.2.2 per l'host locale
// Su device reale usa l'IP del PC (es. 10.167.69.195) nel file .env
// Su iOS emulator usa localhost
const DEV_URL = API_BASE_URL || 'http://10.0.2.2:3000'
const PROD_URL = 'https://tuo-dominio.railway.app' // quando hai il server

const API_URL = __DEV__ ? DEV_URL : PROD_URL

export const apiFetch = async (endpoint, options = {}, session) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      ...options.headers,
    }
  })
  return response
}