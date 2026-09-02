import { useState } from 'react'
import { usePresence, useUserStatus } from '../hooks/usePresence'

const STATUS_COLORS = {
  online: 'var(--online)',  // green
  away: '#f0c040',           // yellow
  dnd: 'var(--margin-red)',  // red
}

export function UserAvatar({ photoURL, displayName, uid, showStatus = false, size = 36, userStatus }) {
  const { isOnline } = usePresence()
  const { status: selfStatus } = useUserStatus()
  const [imgFailed, setImgFailed] = useState(false)
  const initials = (displayName || '?').slice(0, 1).toUpperCase()
  const showImage = photoURL && !imgFailed

  const resolvedStatus = userStatus ?? (uid ? selfStatus : null)
  const indicatorColor = resolvedStatus && STATUS_COLORS[resolvedStatus]
    ? STATUS_COLORS[resolvedStatus]
    : (isOnline(uid) ? 'var(--online)' : '#b8ae98')
  const statusLabel = resolvedStatus || (isOnline(uid) ? 'Online' : 'Offline')

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {showImage ? (
        <img
          src={photoURL}
          alt={displayName}
          onError={() => setImgFailed(true)}
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
          title={statusLabel}
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            background: indicatorColor,
            border: '2px solid var(--paper)',
          }}
        />
      )}
    </div>
  )
}
