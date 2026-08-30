import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8080

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// Placeholder for future admin/moderation API routes that need to run
// server-side (e.g. with the Firebase Admin SDK) rather than client-side.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// SPA fallback — send index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`Notebook server running on port ${PORT}`)
})

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`)
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
