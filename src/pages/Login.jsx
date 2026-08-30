import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { signInGoogle, signInEmail, createEmailAccount } = useAuth()
  const [mode, setMode] = useState('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        await createEmailAccount({ email, password, displayName })
      } else {
        await signInEmail(email, password)
      }
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24,
        padding: 20,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="app-title" style={{ fontSize: 64, lineHeight: 1 }}>Notebook</div>
        <p style={{ color: 'var(--ink-soft)', marginTop: 4, fontSize: 16 }}>
          A page for you and your people.
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: 'var(--shadow-tape)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 280,
        }}
      >
        <div style={tabGroupStyle}>
          <button
            type="button"
            onClick={() => setMode('signin')}
            style={tabStyle(mode === 'signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={tabStyle(mode === 'signup')}
          >
            Create
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'signup' && (
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Name"
              style={inputStyle}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
            required
            style={inputStyle}
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button disabled={submitting} style={oauthButtonStyle('var(--ink)', '#fff')}>
            {submitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in with email'}
          </button>
        </form>

        <button onClick={signInGoogle} style={oauthButtonStyle('#fff', 'var(--ink)')}>
          Continue with Google
        </button>
      </div>
    </div>
  )
}

function getAuthErrorMessage(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Check your email and password.'
    case 'auth/weak-password':
      return 'Use at least 6 characters for the password.'
    default:
      return 'Sign-in failed. Try again.'
  }
}

const inputStyle = {
  border: '1px solid var(--paper-line)',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
}

const tabGroupStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 4,
  background: 'var(--paper)',
  border: '1px solid var(--paper-line)',
  borderRadius: 10,
  padding: 4,
}

function tabStyle(active) {
  return {
    background: active ? '#fff' : 'transparent',
    color: 'var(--ink)',
    border: 0,
    borderRadius: 7,
    padding: '8px 10px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: active ? '0 1px 4px rgba(51, 43, 34, 0.12)' : 'none',
  }
}

const errorStyle = {
  color: '#a33a2a',
  fontSize: 13,
  lineHeight: 1.3,
  margin: 0,
}

function oauthButtonStyle(bg, color) {
  return {
    background: bg,
    color,
    border: '1px solid var(--paper-line)',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  }
}
