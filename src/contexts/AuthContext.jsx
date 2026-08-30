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

const AuthContext = createContext(null)

const getAdminEmailList = () => {
  const envList = import.meta.env.VITE_ADMIN_EMAILS || ''
  return envList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

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

  // Write profile, check admin & ban status, and wire up presence
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setIsBanned(false)
      return
    }

    const adminEmails = getAdminEmailList()
    const isEmailAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false

    const profileRef = ref(db, `users/${user.uid}`)

    // Listen to user profile for real-time ban and admin changes
    const userUnsub = onValue(profileRef, (snap) => {
      const data = snap.val() || {}
      setIsBanned(Boolean(data.banned))

      const dbAdmin = Boolean(data.isAdmin)
      const currentAdminStatus = isEmailAdmin || dbAdmin
      setIsAdmin(currentAdminStatus)

      // Ensure profile fields are synced
      const updates = {}
      if (!data.displayName || data.displayName !== (user.displayName || user.email?.split('@')[0])) {
        updates.displayName = user.displayName || user.email?.split('@')[0] || 'Anonymous'
      }
      if (user.email && data.email !== user.email) {
        updates.email = user.email
      }
      if (data.photoURL !== (user.photoURL || '')) {
        updates.photoURL = user.photoURL || ''
      }
      if (isEmailAdmin && !data.isAdmin) {
        updates.isAdmin = true
      }

      if (Object.keys(updates).length > 0) {
        update(profileRef, updates).catch(() => {})
      }
    })

    const statusRef = ref(db, `status/${user.uid}`)
    const connectedRef = ref(db, '.info/connected')

    const connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return
      onDisconnect(statusRef)
        .set({ state: 'offline', lastSeen: serverTimestamp() })
        .then(() => {
          set(statusRef, { state: 'online', lastSeen: serverTimestamp() })
        })
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

  // Admin actions
  const setUserBanned = (uid, banned) => {
    return update(ref(db, `users/${uid}`), { banned })
  }

  const setUserAdmin = (uid, makeAdmin) => {
    return update(ref(db, `users/${uid}`), { isAdmin: makeAdmin })
  }

  const deleteUserData = async (uid) => {
    await remove(ref(db, `users/${uid}`))
    await remove(ref(db, `status/${uid}`))
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
        deleteUserData,
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
