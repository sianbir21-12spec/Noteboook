import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { ref, onDisconnect, onValue, set, update, remove, serverTimestamp } from 'firebase/database'
import { auth, db, googleProvider, githubProvider } from '../firebase'
import { logActivity } from '../hooks/useActivityLogs'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBanned, setIsBanned] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsub
  }, [])

  // Sync the user's profile, read server-authoritative role/ban state,
  // and maintain Firebase presence.
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setIsBanned(false)
      return undefined
    }

    const profileRef = ref(db, `users/${user.uid}`)
    const userUnsub = onValue(profileRef, (snap) => {
      const data = snap.val() || {}
      setIsBanned(Boolean(data.banned))
      // Admin status is intentionally sourced only from RTDB. Do not grant
      // privileges from a Vite env variable because client-side values are
      // visible to every browser user.
      setIsAdmin(Boolean(data.isAdmin))

      const updates = {}
      const displayName = user.displayName || user.email?.split('@')[0] || 'Anonymous'
      if (data.displayName !== displayName) updates.displayName = displayName
      if (user.email && data.email !== user.email) updates.email = user.email
      const photoURL = user.photoURL || ''
      if (data.photoURL !== photoURL) updates.photoURL = photoURL

      if (Object.keys(updates).length > 0) {
        update(profileRef, updates).catch((error) => {
          console.warn('Profile sync failed:', error)
        })
      }
    })

    const statusRef = ref(db, `status/${user.uid}`)
    const connectedRef = ref(db, '.info/connected')
    const connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return
      onDisconnect(statusRef)
        .set({ state: 'offline', lastSeen: serverTimestamp() })
        .then(() => set(statusRef, { state: 'online', lastSeen: serverTimestamp() }))
        .catch((error) => console.warn('Presence setup failed:', error))
    })

    return () => {
      userUnsub()
      connectedUnsub()
    }
  }, [user])

  const signInGoogle = () => signInWithPopup(auth, googleProvider)
  const signInGithub = () => signInWithPopup(auth, githubProvider)
  const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const createEmailAccount = async ({ email, password, displayName }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(credential.user, { displayName })
      setUser(auth.currentUser)
    }
    return credential
  }

  const signOut = () => firebaseSignOut(auth)

  // Admin actions. Firebase RTDB rules are the final authorization layer.
  const setUserBanned = (uid, banned) => {
    logActivity(banned ? 'ban' : 'unban', { actorId: user?.uid, actorName: user?.displayName, targetId: uid })
    return update(ref(db, `users/${uid}`), { banned })
  }
  const setUserAdmin = (uid, makeAdmin) => {
    logActivity(makeAdmin ? 'admin_granted' : 'admin_revoked', { actorId: user?.uid, actorName: user?.displayName, targetId: uid })
    return update(ref(db, `users/${uid}`), { isAdmin: makeAdmin })
  }

  // Set the current user's custom presence status (online/away/dnd).
  // Stored at users/{uid}/status so it survives the connection-managed
  // presence at status/{uid} and can be read by other users.
  const setUserStatus = (newStatus) => {
    if (!user) return Promise.resolve()
    if (!['online', 'away', 'dnd'].includes(newStatus)) return Promise.resolve()
    return set(ref(db, `users/${user.uid}/status`), newStatus).catch((error) => {
      console.warn('Status update failed:', error)
    })
  }

  const deleteUserData = async (uid) => {
    await Promise.all([
      remove(ref(db, `users/${uid}`)),
      remove(ref(db, `status/${uid}`)),
    ])
  }

  const deleteAllRoomMessages = async (roomId) => {
    await remove(ref(db, `rooms/${roomId}/messages`))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isBanned,
        signInGoogle,
        signInGithub,
        signInEmail,
        createEmailAccount,
        signOut,
        setUserBanned,
        setUserAdmin,
        setUserStatus,
        deleteUserData,
        deleteAllRoomMessages,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
