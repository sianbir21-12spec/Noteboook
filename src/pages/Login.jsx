import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const BENIGN_AUTH_ERRORS = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
])

function getAuthErrorMessage(err) {
  if (err?.code === 'auth/account-exists-with-different-credential') {
    return 'That email is already linked to a different sign-in method. Try the other provider.'
  }
  if (err?.code === 'auth/unauthorized-domain') {
    return 'This domain isn\u2019t authorized for sign-in yet.'
  }
  return 'Sign-in failed. Please try again.'
}

export function Login() {
  const { signInGoogle, signInGithub } = useAuth()
  const [error, setError] = useState('')

  const handleSignIn = async (signInFn) => {
    setError('')
    try {
      await signInFn()
    } catch (err) {
      if (!BENIGN_AUTH_ERRORS.has(err?.code)) {
        setError(getAuthErrorMessage(err))
        console.error('Sign-in error:', err)
      }
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
        {error && (
          <div style={{ color: 'var(--margin-red)', fontSize: 13, textAlign: 'center' }}>{error}</div>
        )}
        <button onClick={() => handleSignIn(signInGoogle)} style={oauthButtonStyle('#fff', 'var(--ink)')}>
          Continue with Google
        </button>
        <button onClick={() => handleSignIn(signInGithub)} style={oauthButtonStyle('#24292e', '#fff')}>
          Continue with GitHub
        </button>
      </div>
    </div>
  )
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
