import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'
import { Admin } from './pages/Admin'
import { Banned } from './pages/Banned'
import './styles/global.css'

function Gate() {
  const { user, loading, isAdmin, isBanned } = useAuth()
  const [view, setView] = useState('chat') // 'chat' | 'admin'

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Loading…</span>
      </div>
    )
  }

  if (!user) return <Login />

  if (isBanned) return <Banned />

  if (view === 'admin' && isAdmin) {
    return <Admin onBack={() => setView('chat')} />
  }

  return <Chat onOpenAdmin={isAdmin ? () => setView('admin') : null} />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
