import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { ref, onDisconnect, onValue, set, serverTimestamp } from 'firebase/database'
import { auth, db, googleProvider, githubProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsub
  }, [])

  // Write profile + wire up presence whenever a user logs in
  useEffect(() => {
    if (!user) return

    const profileRef = ref(db, `users/${user.uid}`)
    set(profileRef, {
      displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      photoURL: user.photoURL || '',
      email: user.email || '',
    })

    const statusRef = ref(db, `status/${user.uid}`)
    const connectedRef = ref(db, '.info/connected')

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return
      onDisconnect(statusRef)
        .set({ state: 'offline', lastSeen: serverTimestamp() })
        .then(() => {
          set(statusRef, { state: 'online', lastSeen: serverTimestamp() })
        })
    })

    return unsub
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInGoogle,
        signInGithub,
        signInEmail,
        createEmailAccount,
        signOut,
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
