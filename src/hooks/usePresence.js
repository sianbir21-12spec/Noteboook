import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, update } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

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

export function useUserStatus() {
  const { user } = useAuth()
  const [status, setStatusState] = useState('online')

  useEffect(() => {
    if (!user) return
    const statusRef = ref(db, `users/${user.uid}/status`)
    const unsub = onValue(statusRef, (snap) => {
      const val = snap.val()
      if (val && ['online', 'away', 'dnd'].includes(val)) {
        setStatusState(val)
      } else if (val) {
        setStatusState('online')
      }
    })
    return unsub
  }, [user])

  const setStatus = useCallback(
    (newStatus) => {
      if (!user || !['online', 'away', 'dnd'].includes(newStatus)) return
      set(ref(db, `users/${user.uid}/status`), newStatus).catch((e) =>
        console.warn('Status update failed:', e)
      )
      setStatusState(newStatus)
    },
    [user]
  )

  return { status, setStatus }
}
