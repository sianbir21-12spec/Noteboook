import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Chat } from './pages/Chat'
import './styles/global.css'

function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Loading…</span>
      </div>
    )
  }

  return user ? <Chat /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
