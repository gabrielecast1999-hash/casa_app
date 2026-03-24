const os = require('os')
const fs = require('fs')

// Trova l'IP WiFi automaticamente
const interfaces = os.networkInterfaces()
let ip = null

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      ip = iface.address
      break
    }
  }
  if (ip) break
}

if (!ip) {
  console.error('❌ IP non trovato!')
  process.exit(1)
}

// Leggi .env esistente
let envContent = ''
try {
  envContent = fs.readFileSync('.env', 'utf8')
} catch (e) {
  // .env non esiste ancora
}

// Aggiorna o aggiungi API_BASE_URL
if (envContent.includes('API_BASE_URL=')) {
  envContent = envContent.replace(
    /API_BASE_URL=.*/,
    `API_BASE_URL=http://${ip}:3000`
  )
} else {
  envContent += `\nAPI_BASE_URL=http://${ip}:3000`
}

fs.writeFileSync('.env', envContent)
console.log(`✅ IP aggiornato: http://${ip}:3000`)