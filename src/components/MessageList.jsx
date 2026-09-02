import { useEffect, useRef, useState } from 'react'
import { UserAvatar } from './UserAvatar'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isImage(name = '') {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
}

// Message reaction display
function ReactionDisplay({ messageId, emojiCount, uid }) {
  if (!emojiCount || emojiCount === 0) return null

  // Get first user who reacted for display
  return (
    <span
      style={{
        fontSize: 14,
        marginLeft: 4,
        color: 'var(--pencil-blue)',
        cursor: 'pointer',
      }}
      onClick={() => {}}
    >
      {emojiCount} {emojiCount > 1 ? 'reactions' : 'reaction'}
    </span>
  )
}

export function MessageList({ messages, currentUser, onSeen, threadMemberCount = 2 }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Mark the latest messages as seen
    messages.slice(-10).forEach((m) => {
      if (!m.seenBy?.[currentUser?.uid]) {
        onSeen?.(m.id)
      }
    })
  }, [messages, currentUser, onSeen])

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
          }}
        >
          Nothing here yet — write the first line.
        </div>
      )}

      {messages.map((m) => {
        const mine = m.uid === currentUser?.uid
        const seenCount = Object.keys(m.seenBy || {}).length
        const seenByOthers = seenCount >= threadMemberCount

        return (
          <div
            key={m.id}
            style={{
              display: 'flex',
              gap: 10,
              flexDirection: mine ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              marginBottom: 14,
            }}
          >
            <UserAvatar photoURL={m.photoURL} displayName={m.displayName} size={30} uid={m.uid} />

            <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!mine && (
                <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, marginLeft: 4 }}>
                  {m.displayName}
                </span>
              )}

              <div
                style={{
                  background: mine ? 'var(--pencil-blue)' : '#fff',
                  color: mine ? '#fff' : 'var(--ink)',
                  padding: '10px 14px',
                  borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  boxShadow: 'var(--shadow-tape)',
                  wordBreak: 'break-word',
                }}
              >
                {/* Edit indicator */}
                {m.editedAt && (
                  <div style={{
                    fontSize: 10,
                    color: 'var(--ink-soft)',
                    marginBottom: 6,
                    fontStyle: 'italic',
                  }}>
                    ✎ Edited
                  </div>
                )}

                {m.text && <div>{m.text}</div>}

                {/* Reactions area */}
                {m.reactions && Object.keys(m.reactions).length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 12 }}>
                    {Object.entries(m.reactions).map(([emoji, users]) => {
                      const count = Object.keys(users).length
                      return (
                        <span key={emoji} style={{ cursor: 'pointer' }}>
                          {emoji} {count}
                        </span>
                      )
                    })}
                  </div>
                )}

                {m.fileURL && isImage(m.fileName) && (
                  <img
                    src={m.fileURL}
                    alt={m.fileName}
                    style={{
                      maxWidth: '100%',
                      borderRadius: 8,
                      marginTop: m.text ? 8 : 0,
                      display: 'block',
                    }}
                  />
                )}
                {m.fileURL && !isImage(m.fileName) && (
                  <a
                    href={m.fileURL}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      color: mine ? '#fff' : 'var(--pencil-blue)',
                      textDecoration: 'underline',
                      marginTop: m.text ? 8 : 0,
                    }}
                  >
                    📎 {m.fileName || 'Attachment'}
                  </a>
                )}

                {/* Reply indicator */}
                {m.replyTo && (
                  <div style={{
                    fontSize: 10,
                    color: 'var(--ink-soft)',
                    marginTop: 4,
                    fontWeight: 600,
                  }}>
                    ↳ Replying to {m.replyTo?.displayName || '...'}
                  </div>
                )}
              </div>

              <span
                style={{
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  marginInline: 4,
                }}
              >
                {formatTime(m.createdAt)}
                {mine && seenByOthers && ' · Seen'}
              </span>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
