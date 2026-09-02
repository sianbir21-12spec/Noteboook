import { ref, push, serverTimestamp, onValue, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '../firebase'

const ACTIVITY_PATH = 'admin/activity'
const MAX_EVENTS = 50

/**
 * Log an activity event to admin/activity.
 * @param {string} type - Event type: join, leave, ban, unban, message_sent, message_deleted, room_created, room_deleted, admin_granted, admin_revoked
 * @param {object} data - Additional event data (actorId, targetId, targetName, roomId, roomName, etc.)
 */
export async function logActivity(type, data = {}) {
  try {
    const activityRef = ref(db, ACTIVITY_PATH)
    await push(activityRef, {
      type,
      timestamp: serverTimestamp(),
      ...data,
    })
  } catch (error) {
    console.warn('Failed to log activity:', error)
  }
}

/**
 * Subscribe to the last N activity events.
 * @param {function} callback - Called with an array of { id, ...event } objects, newest last
 * @returns {function} Unsubscribe function
 */
export function subscribeActivityLogs(callback, limit = MAX_EVENTS) {
  const activityRef = ref(db, ACTIVITY_PATH)
  const q = query(activityRef, orderByChild('timestamp'), limitToLast(limit))
  const unsub = onValue(q, (snap) => {
    const raw = snap.val() || {}
    // Convert from { [id]: event } to sorted array (oldest first so newest appears last visually)
    const entries = Object.entries(raw).sort(([, a], [, b]) => (a.timestamp || 0) - (b.timestamp || 0))
    callback(entries.map(([id, event]) => ({ id, ...event })))
  })
  return unsub
}
