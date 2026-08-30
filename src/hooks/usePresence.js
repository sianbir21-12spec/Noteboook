import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'

export function usePresence() {
  const [status, setStatus] = useState({})

  useEffect(() => {
    const statusRef = ref(db, 'status')
    const unsub = onValue(statusRef, (snap) => {
      setStatus(snap.val() || {})
    })
    return unsub
  }, [])

  const isOnline = (uid) => status[uid]?.state === 'online'

  return { status, isOnline }
}

export function useUsers() {
  const [users, setUsers] = useState({})

  useEffect(() => {
    const usersRef = ref(db, 'users')
    const unsub = onValue(usersRef, (snap) => {
      setUsers(snap.val() || {})
    })
    return unsub
  }, [])

  return users
}
