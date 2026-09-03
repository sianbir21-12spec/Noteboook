import express from 'express'

const router = express.Router()

// Basic auth middleware - checks Authorization header
// Format: Authorization: Basic base64(username:password)
//
// SECURITY: This API is disabled unless ADMIN_USERNAME and ADMIN_PASSWORD
// are explicitly set as environment variables. There is no default
// username/password — a default credential here would let anyone on the
// internet reach these routes with a well-known login.
const basicAuth = (req, res, next) => {
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD

  if (!adminUser || !adminPass) {
    return res.status(503).json({
      error: 'Admin API is disabled. Set ADMIN_USERNAME and ADMIN_PASSWORD to enable it.',
    })
  }

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authorization required' })
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8')
  const [username, password] = credentials.split(':')

  if (username !== adminUser || password !== adminPass) {
    return res.status(403).json({ error: 'Invalid credentials' })
  }

  next()
}

// Apply auth to all admin routes
router.use(basicAuth)

// NOTE: /stats, /admin/ban, and /admin/delete-room are not implemented.
// They do not connect to Firebase - previously they returned fake "success"
// responses without doing anything, which is misleading to any caller.
// The working admin panel (src/pages/Admin.jsx) uses the Firebase client
// SDK directly and does not depend on these routes. Implement these with
// firebase-admin + a service account if a server-side API is genuinely
// needed later.

router.get('/stats', async (req, res) => {
  res.status(501).json({ error: 'Not implemented. Use the in-app Admin panel instead.' })
})

router.post('/admin/ban', async (req, res) => {
  res.status(501).json({ error: 'Not implemented. Use the in-app Admin panel instead.' })
})

router.post('/admin/delete-room', async (req, res) => {
  res.status(501).json({ error: 'Not implemented. Use the in-app Admin panel instead.' })
})

export default router
