import { useEffect, useState, useRef } from 'react'
import { ref, onValue, set, onDisconnect, remove } from 'firebase/database'
import { db } from '../firebase'
import { usePresence } from './usePresence'

/**
 * typingPath e.g. `rooms/general/typing` or `dms/{dmId}/typing`
 */
export function useTyping(typingPath, user) {
  const [typingUsers, setTypingUsers] = useState([])
  const { status, isOnline } = usePresence()
  const timeoutRef = useRef(null)

  // Derive the count of online users (state === 'online') from shared presence data.
  const onlineCount = Object.values(status).filter((s) => s?.state === 'online').length

  useEffect(() => {
    if (!typingPath) return
    const typingRef = ref(db, typingPath)
    const unsub = onValue(typingRef, (snap) => {
      const val = snap.val() || {}
      const others = Object.entries(val)
        .filter(([uid, data]) => uid !== user?.uid && data?.isTyping)
        .map(([uid, data]) => data.displayName || 'Someone')
      setTypingUsers(others)
    })
    return () => {
      unsub()
      clearTimeout(timeoutRef.current)
    }
  }, [typingPath, user])

  const setTyping = (isTyping) => {
    if (!typingPath || !user) return
    const myTypingRef = ref(db, `${typingPath}/${user.uid}`)
    set(myTypingRef, { isTyping, displayName: user.displayName || 'Someone' })
    onDisconnect(myTypingRef).remove()

    if (isTyping) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        remove(myTypingRef)
      }, 3000)
    }
  }

  return { typingUsers, setTyping, onlineCount, isOnline }
}
