import { useEffect, useRef } from 'react'
import { ref, onChildAdded, onValue } from 'firebase/database'
import { db } from '../firebase'

/**
 * Watches every room and every DM thread the user is part of.
 * Fires a browser Notification for new messages that:
 *  - weren't sent by the current user
 *  - arrived in a thread that isn't the one currently open, OR the tab isn't focused
 *
 * activeThreadKey: a string identifying the thread currently open in the UI
 *                  (e.g. `room:general` or `dm:abc123`), so we can skip notifying
 *                  for messages the user is already looking at.
 */
export function useGlobalMessageNotifications({ user, activeThreadKey, permission }) {
  const startTimeRef = useRef(Date.now())
  const knownRoomsRef = useRef({})
  const activeThreadKeyRef = useRef(activeThreadKey)

  // Keep the ref current without re-subscribing listeners
  useEffect(() => {
    activeThreadKeyRef.current = activeThreadKey
  }, [activeThreadKey])

  useEffect(() => {
    if (!user || permission !== 'granted') return

    const unsubscribers = []

    const roomsListRef = ref(db, 'rooms')
    const unsubRoomsList = onValue(roomsListRef, (snap) => {
      const rooms = snap.val() || {}
      Object.keys(rooms).forEach((roomId) => {
        const key = `room:${roomId}`
        if (knownRoomsRef.current[key]) return
        knownRoomsRef.current[key] = true

        const messagesRef = ref(db, `rooms/${roomId}/messages`)
        const unsub = onChildAdded(messagesRef, (msgSnap) => {
          notifyIfRelevant({
            msg: msgSnap.val(),
            threadKey: key,
            threadLabel: `# ${rooms[roomId]?.name || roomId}`,
            user,
            activeThreadKeyRef,
            startTime: startTimeRef.current,
          })
        })
        unsubscribers.push(unsub)
      })
    })
    unsubscribers.push(unsubRoomsList)

    const dmsRef = ref(db, 'dms')
    const unsubDms = onValue(dmsRef, (snap) => {
      const dms = snap.val() || {}
      Object.keys(dms).forEach((dmId) => {
        if (!dmId.includes(user.uid)) return
        const key = `dm:${dmId}`
        if (knownRoomsRef.current[key]) return
        knownRoomsRef.current[key] = true

        const messagesRef = ref(db, `dms/${dmId}/messages`)
        const unsub = onChildAdded(messagesRef, (msgSnap) => {
          const msg = msgSnap.val()
          notifyIfRelevant({
            msg,
            threadKey: key,
            threadLabel: msg.displayName || 'Direct message',
            user,
            activeThreadKeyRef,
            startTime: startTimeRef.current,
          })
        })
        unsubscribers.push(unsub)
      })
    })
    unsubscribers.push(unsubDms)

    return () => unsubscribers.forEach((unsub) => unsub && unsub())
  }, [user, permission])
}

function notifyIfRelevant({ msg, threadKey, threadLabel, user, activeThreadKeyRef, startTime }) {
  if (!msg) return
  if (msg.uid === user.uid) return // don't notify yourself
  if (msg.createdAt && msg.createdAt < startTime) return // skip history on first load

  const isViewingThread = activeThreadKeyRef.current === threadKey
  const tabFocused = document.visibilityState === 'visible' && document.hasFocus()
  if (isViewingThread && tabFocused) return // already looking at it

  const body = msg.text || (msg.fileName ? `📎 ${msg.fileName}` : 'Sent a message')

  const notification = new Notification(`${msg.displayName || 'Someone'} in ${threadLabel}`, {
    body,
    icon: msg.photoURL || '/favicon.ico',
    tag: threadKey, // collapses rapid-fire notifications from the same thread
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}
