import { useState } from 'react'

export function NotificationPrompt({ permission, onRequest }) {
  const [dismissed, setDismissed] = useState(false)

  if (permission === 'granted' || permission === 'denied' || permission === 'unsupported' || dismissed) {
    return null
  }

  return (
    <div
      style={{
        background: 'var(--highlight)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: 14,
      }}
    >
      <span>Turn on notifications so you don't miss messages when you're on another tab.</span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onRequest}
          style={{
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Enable
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 13,
            cursor: 'pointer',
            color: 'var(--ink-soft)',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
