import { useEffect, useState } from 'react'
import { ref, push, query, orderByChild, onValue, serverTimestamp, update } from 'firebase/database'
import { db } from '../firebase'

/**
 * threadPath e.g. `rooms/general/messages` or `dms/{dmId}/messages`
 */
export function useMessages(threadPath) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!threadPath) return
    const messagesRef = query(ref(db, threadPath), orderByChild('createdAt'))
    const unsub = onValue(messagesRef, (snap) => {
      const val = snap.val() || {}
      const list = Object.entries(val)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      setMessages(list)
    })
    return unsub
  }, [threadPath])

  const sendMessage = ({ text, uid, displayName, photoURL, fileURL, fileName }) => {
    if (!threadPath) return
    const messagesRef = ref(db, threadPath)
    return push(messagesRef, {
      text: text || '',
      uid,
      displayName,
      photoURL: photoURL || '',
      fileURL: fileURL || '',
      fileName: fileName || '',
      createdAt: serverTimestamp(),
      seenBy: { [uid]: true },
    })
  }

  const markSeen = (messageId, uid) => {
    if (!threadPath || !messageId) return
    update(ref(db, `${threadPath}/${messageId}/seenBy`), { [uid]: true })
  }

  return { messages, sendMessage, markSeen }
}
