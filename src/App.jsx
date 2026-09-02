import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'
import { Admin } from './pages/Admin'
import { Banned } from './pages/Banned'
import './styles/global.css'

function getRoute() {
  const hash = window.location.hash || ''
  if (hash === '#admin') return 'admin'
  return 'chat'
}

function Gate() {
  const { user, loading, isAdmin, isBanned } = useAuth()
  const [route, setRoute] = useState(getRoute())

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Loading…</span>
      </div>
    )
  }

  // /admin route
  if (route === 'admin') {
    if (!user) {
      window.location.hash = ''
      return <Login />
    }
    if (!isAdmin) {
      return (
        <div style={centreStyle}>
          <div style={{ fontSize: 48 }}>⛔</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 16 }}>You don't have admin access.</p>
          <button onClick={() => (window.location.hash = '')} style={btnStyle('var(--ink)', '#fff')}>
            ← Back to Chat
          </button>
        </div>
      )
    }
    return <Admin onBack={() => (window.location.hash = '')} />
  }

  // /chat (default) route
  if (!user) return <Login />
  if (isBanned) return <Banned />
  return <Chat onOpenAdmin={isAdmin ? () => (window.location.hash = 'admin') : null} />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Gate />
      </ThemeProvider>
    </AuthProvider>
  )
}

const centreStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 16,
}

function btnStyle(bg, color) {
  return {
    background: bg,
    color,
    border: '1px solid var(--paper-line)',
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}
