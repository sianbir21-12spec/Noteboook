export function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is writing…`
      : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ' and others' : ''} are writing…`

  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        color: 'var(--ink-soft)',
        padding: '2px 16px',
        minHeight: 24,
      }}
    >
      {label}
      <span className="dots" aria-hidden="true">
        <style>{`
          .dots::after {
            content: '';
            animation: dots 1.4s infinite;
          }
          @keyframes dots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
          }
        `}</style>
      </span>
    </div>
  )
}
