export function TypingIndicator({ typingUsers, onlineCount }) {
  const hasTyping = typingUsers && typingUsers.length > 0

  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        color: 'var(--ink-soft)',
        padding: '2px 16px',
        minHeight: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {hasTyping ? (
        <>
          <span>
            {typingUsers.length === 1
              ? `${typingUsers[0]} is writing`
              : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ' and others' : ''} are writing`}
          </span>
          <span className="typing-dots" aria-label="typing" aria-hidden="true">
            <style>{`
              .typing-dots span {
                display: inline-block;
                width: 6px;
                height: 6px;
                margin: 0 1px;
                border-radius: 50%;
                background: var(--ink-soft);
                animation: bounce 1.4s infinite ease-in-out both;
              }
              .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
              .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0.3); opacity: 0.4; }
                40% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <span />
            <span />
            <span />
          </span>
        </>
      ) : (
        <span style={{ opacity: 0.7 }}>No one typing</span>
      )}

      {typeof onlineCount === 'number' && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: 'var(--ink-soft)',
            opacity: 0.85,
            fontFamily: 'var(--font-body)',
          }}
          aria-label={`${onlineCount} online users`}
        >
          {onlineCount} online
        </span>
      )}
    </div>
  )
}
