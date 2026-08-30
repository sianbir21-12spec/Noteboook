import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { signInGoogle, signInGithub } = useAuth()

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
        <button onClick={signInGoogle} style={oauthButtonStyle('#fff', 'var(--ink)')}>
          Continue with Google
        </button>
        <button onClick={signInGithub} style={oauthButtonStyle('#24292e', '#fff')}>
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
