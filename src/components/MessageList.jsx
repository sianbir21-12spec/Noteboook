import { useEffect, useRef, useState } from 'react'
import { UserAvatar } from './UserAvatar'

const EDIT_WINDOW_MS = 5 * 60 * 1000

function canEdit(message, currentUser) {
  if (!message || !currentUser) return false
  if (message.uid !== currentUser.uid) return false
  if (message.editedAt) return false
  const createdAt = message.createdAt
  if (!createdAt) return false
  const created = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created <= EDIT_WINDOW_MS
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeTime(ts) {
  if (!ts) return { relative: '', exact: '' }
  const d = new Date(ts)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)

  const fmt = (date) =>
    date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const exact = fmt(d)

  if (diff < 60) {
    return { relative: 'now', exact }
  }
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return { relative: `${m}m ago`, exact }
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return { relative: `${h}h ago`, exact }
  }
  if (diff < 172800) {
    return { relative: 'yesterday', exact }
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400)
    return { relative: `${d}d ago`, exact }
  }
  if (diff < 2592000) {
    const w = Math.floor(diff / 604800)
    return { relative: `${w}w ago`, exact }
  }
  if (diff < 31536000) {
    const mo = Math.floor(diff / 2592000)
    return { relative: `${mo}mo ago`, exact }
  }
  const y = Math.floor(diff / 31536000)
  return { relative: `${y}y ago`, exact }
}

function isImage(name = '') {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
}

// Emoji picker that appears on hover
function EmojiPicker({ onSelect, onClose }) {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: 4,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        padding: '4px 8px',
        display: 'flex',
        gap: 2,
        zIndex: 10,
      }}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji)
            onClose()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 4px',
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.target.style.background = '#f0f0f0')}
          onMouseLeave={(e) => (e.target.style.background = 'none')}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// Message reaction display
function ReactionBadge({ messageId, reactions, uid, addReaction, removeReaction }) {
  const [showPicker, setShowPicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const badgeRef = useRef(null)

  const hasReactions = reactions && Object.keys(reactions).length > 0
  if (!hasReactions && !isHovered) return null

  const handleToggle = (emoji) => {
    const userReacted = reactions?.[emoji]?.[uid]
    if (userReacted) {
      removeReaction?.(messageId, emoji, uid) || removeReaction?.(messageId, emoji)
    } else {
      addReaction?.(messageId, emoji, uid) || addReaction?.(messageId, emoji)
    }
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', marginTop: 4 }}
      onMouseEnter={() => {
        setIsHovered(true)
        setShowPicker(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowPicker(false)
      }}
    >
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Object.entries(reactions || {}).map(([emoji, users]) => {
          const count = Object.keys(users).length
          const isActive = users[uid]
          return (
            <button
              key={emoji}
              ref={badgeRef}
              onClick={() => handleToggle(emoji)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                border: isActive ? '1.5px solid var(--pencil-blue)' : '1px solid #ddd',
                background: isActive ? 'rgba(37, 99, 235, 0.1)' : '#f8f8f8',
                cursor: 'pointer',
                fontSize: 13,
                color: isActive ? 'var(--pencil-blue)' : 'var(--ink)',
              }}
            >
              {emoji} {count}
            </button>
          )
        })}
        {isHovered && (
          <button
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px dashed #ccc',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--ink-soft)',
            }}
          >
            +
          </button>
        )}
      </div>
      {showPicker && (
        <EmojiPicker
          onSelect={(emoji) => handleToggle(emoji)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

export function MessageList({ messages, currentUser, onSeen, threadMemberCount = 2, onEdit, numberingEnabled = false, onReply, addReaction, removeReaction }) {
  const bottomRef = useRef(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Mark the latest messages as seen
    messages.slice(-10).forEach((m) => {
      if (!m.seenBy?.[currentUser?.uid]) {
        onSeen?.(m.id)
      }
    })
  }, [messages, currentUser, onSeen])

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

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

      {messages.map((m, index) => {
        const mine = m.uid === currentUser?.uid
        const seenCount = Object.keys(m.seenBy || {}).length
        const seenByOthers = seenCount >= threadMemberCount
        const editable = mine && canEdit(m, currentUser)

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
                  position: 'relative',
                }}
              >
                {numberingEnabled && (
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    ...(mine ? { right: 6 } : { left: 6 }),
                    fontSize: 10,
                    color: 'var(--ink-soft)',
                    opacity: 0.5,
                    fontFamily: 'monospace',
                    pointerEvents: 'none',
                  }}>
                    #{index + 1}
                  </span>
                )}
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

                {!mine && onReply && (
                  <button
                    onClick={() => onReply({ id: m.id, displayName: m.displayName, text: m.text || '' })}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '2px 6px',
                      fontSize: 11,
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                    title="Reply"
                  >
                    Reply
                  </button>
                )}
                {m.text && <div>{m.text}</div>}

                {/* Reactions area */}
                <ReactionBadge
                  messageId={m.id}
                  reactions={m.reactions}
                  uid={currentUser?.uid}
                  addReaction={addReaction}
                  removeReaction={removeReaction}
                />

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

                {m.replyTo && (
                  <div style={{
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    marginBottom: 6,
                    fontSize: 12,
                    color: 'var(--ink-soft)',
                    wordBreak: 'break-word',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {m.replyTo?.displayName || '...'}
                    </div>
                    <div style={{ opacity: 0.9 }}>
                      {m.replyTo?.text || ''}
                    </div>
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
                title={formatRelativeTime(m.createdAt).exact}
              >
                {formatRelativeTime(m.createdAt).relative}
                {mine && seenByOthers && ' · Seen'}
              </span>

              {mine && (
                <div
                  style={{ alignSelf: mine ? 'flex-end' : 'flex-start', marginInline: 4 }}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                >
                  <button
                    type="button"
                    onClick={() => onEdit?.(m)}
                    disabled={!editable}
                    title={editable ? 'Edit message' : 'Edit window expired (5 min)'}
                    style={{
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      marginInline: 4,
                      border: 'none',
                      background: 'transparent',
                      color: editable ? 'var(--pencil-blue)' : 'var(--ink-soft)',
                      fontSize: 11,
                      cursor: editable ? 'pointer' : 'not-allowed',
                      opacity: editable ? 1 : 0.5,
                      padding: '2px 6px',
                      borderRadius: 8,
                      fontFamily: 'inherit',
                    }}
                  >
                    ✎ Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
