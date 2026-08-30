import { useAuth } from '../contexts/AuthContext'

export function Banned() {
  const { signOut, user } = useAuth()

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: 'var(--shadow-tape)',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          border: '1px solid var(--paper-line)',
        }}
      >
        <div style={{ fontSize: 48 }}>🚫</div>
        <div className="app-title" style={{ fontSize: 32, color: 'var(--margin-red)' }}>
          Account Suspended
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>
          Your account (<strong>{user?.email || user?.displayName || user?.uid}</strong>) has been
          suspended by an administrator. You currently do not have access to Notebook.
        </p>
        <button
          onClick={signOut}
          style={{
            marginTop: 8,
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
