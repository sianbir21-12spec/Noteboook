import { usePresence } from '../hooks/usePresence'

export function UserAvatar({ photoURL, displayName, uid, showStatus = false, size = 36 }) {
  const { isOnline } = usePresence()
  const initials = (displayName || '?').slice(0, 1).toUpperCase()

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--paper)',
            boxShadow: 'var(--shadow-tape)',
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'var(--pencil-blue)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.5,
            fontWeight: 700,
          }}
        >
          {initials}
        </div>
      )}
      {showStatus && uid && (
        <span
          title={isOnline(uid) ? 'Online' : 'Offline'}
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            background: isOnline(uid) ? 'var(--online)' : '#b8ae98',
            border: '2px solid var(--paper)',
          }}
        />
      )}
    </div>
  )
}
