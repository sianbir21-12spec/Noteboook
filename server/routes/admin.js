import express from 'express'

const router = express.Router()

// Basic auth middleware - checks Authorization header
// Format: Authorization: Basic base64(username:password)
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authorization required' })
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8')
  const [username, password] = credentials.split(':')

  const adminUser = process.env.ADMIN_USERNAME || 'admin'
  const adminPass = process.env.ADMIN_PASSWORD || 'admin'

  if (username !== adminUser || password !== adminPass) {
    return res.status(403).json({ error: 'Invalid credentials' })
  }

  next()
}

// Apply auth to all admin routes
router.use(basicAuth)

// GET /api/stats - Return room and user statistics
router.get('/stats', async (req, res) => {
  try {
    // TODO: Fetch real stats from Firebase Realtime Database
    const stats = {
      totalRooms: 0,
      totalUsers: 0,
      activeRooms: 0,
      online: 0,
      timestamp: new Date().toISOString()
    }

    res.status(200).json({ status: 'ok', stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// POST /api/admin/ban - Ban a user
router.post('/admin/ban', async (req, res) => {
  try {
    const { userId, reason, duration } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // TODO: Implement Firebase admin ban logic
    const banResult = {
      success: true,
      userId,
      reason: reason || 'No reason provided',
      duration: duration || 'permanent',
      bannedAt: new Date().toISOString()
    }

    res.status(200).json({ status: 'ok', result: banResult })
  } catch (error) {
    console.error('Error banning user:', error)
    res.status(500).json({ error: 'Failed to ban user' })
  }
})

// POST /api/admin/delete-room - Delete a room and its messages
router.post('/admin/delete-room', async (req, res) => {
  try {
    const { roomId } = req.body

    if (!roomId) {
      return res.status(400).json({ error: 'roomId is required' })
    }

    // TODO: Implement Firebase admin delete room logic
    const deleteResult = {
      success: true,
      roomId,
      deletedAt: new Date().toISOString()
    }

    res.status(200).json({ status: 'ok', result: deleteResult })
  } catch (error) {
    console.error('Error deleting room:', error)
    res.status(500).json({ error: 'Failed to delete room' })
  }
})

export default router
