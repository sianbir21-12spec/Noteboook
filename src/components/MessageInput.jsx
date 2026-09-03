import { useEffect, useRef, useState } from 'react'


const RATE_LIMIT_KEY = 'msg_rate_limit_timestamps'
const MAX_MESSAGES = 5
const WINDOW_MS = 10 * 1000

function loadTimestamps() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveTimestamps(timestamps) {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps))
  } catch {
    // ignore quota or serialization errors
  }
}

function pruneOld(timestamps, now) {
  return timestamps.filter((t) => now - t < WINDOW_MS)
}

export function MessageInput({ onSend, onEdit, onTyping, threadId, editingMessage, replyingTo, onCancelReply, numberingEnabled, onToggleNumbering, onWarning }) {
  const [text, setText] = useState('')
  const [numbering, setNumbering] = useState(numberingEnabled || false)
  const [warning, setWarning] = useState('')
  const [remaining, setRemaining] = useState(MAX_MESSAGES)

  // Load text into input when editing a message
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '')
    }
  }, [editingMessage?.id])

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const pruned = pruneOld(loadTimestamps(), now)
      setRemaining(Math.max(0, MAX_MESSAGES - pruned.length))
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!warning) return
    const id = setTimeout(() => setWarning(''), 2500)
    return () => clearTimeout(id)
  }, [warning])

  const handleChange = (e) => {
    setText(e.target.value)
    onTyping?.(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    // Handle edit submission
    if (editingMessage) {
      onEdit?.(editingMessage.id, text.trim())
      setText('')
      return
    }

    const now = Date.now()
    const recent = pruneOld(loadTimestamps(), now)

    if (recent.length >= MAX_MESSAGES) {
      const oldest = recent[0]
      const wait = Math.ceil((WINDOW_MS - (now - oldest)) / 1000)
      const msg = `Slow down! ${wait} seconds`
      setWarning(msg)
      onWarning?.(msg)
      return
    }

    onSend({ text: text.trim(), replyTo: replyingTo ? { id: replyingTo.id, displayName: replyingTo.displayName, text: replyingTo.text } : undefined })
    setText('')
    onCancelReply?.()
    onTyping?.(false)

    const updated = [...recent, now]
    saveTimestamps(updated)
    setRemaining(Math.max(0, MAX_MESSAGES - updated.length))
  }

  const handleCancelEdit = () => {
    setText('')
    onEdit?.(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: 8,
        padding: 14,
        borderTop: '1px dashed var(--paper-line)',
        background: 'var(--paper)',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {warning && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 14,
            marginBottom: 6,
            background: 'var(--margin-red)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontFamily: 'var(--font-body, system-ui)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          {warning}
        </div>
      )}
      {replyingTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: '#fff',
            border: '1px solid var(--paper-line)',
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 4,
            color: 'var(--ink-soft)',
          }}
        >
          <span>
            Replying to <strong>{replyingTo.displayName}</strong>: {replyingTo.text}
          </span>
          <button
            type="button"
            onClick={() => onCancelReply?.()}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 11,
              color: 'var(--margin-red)',
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <input
        value={text}
        onChange={handleChange}
        onBlur={() => onTyping?.(false)}
        placeholder={'Write something…'}
        style={{
          flex: 1,
          padding: '10px 16px',
          borderRadius: 20,
          border: '1px solid var(--paper-line)',
          background: '#fff',
          fontSize: 15,
        }}
      />
      <span
        aria-label={`${remaining} messages remaining`}
        title={`${remaining} of ${MAX_MESSAGES} messages remaining (10s window)`}
        style={{
          fontSize: 12,
          color: remaining === 0 ? 'var(--margin-red)' : 'var(--paper-line)',
          fontFamily: 'var(--font-body, system-ui)',
          minWidth: 56,
          textAlign: 'right',
        }}
      >
        {remaining}/{MAX_MESSAGES}
      </span>
      <label
        title="Show message numbers"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <input
          type="checkbox"
          checked={numbering}
          onChange={(e) => {
            setNumbering(e.target.checked)
            onToggleNumbering?.(e.target.checked)
          }}
          style={{ cursor: 'pointer', margin: 0 }}
        />
        # No.
      </label>
      {editingMessage && (
        <button
          type="button"
          onClick={handleCancelEdit}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--ink-soft)',
            fontSize: 13,
            fontFamily: 'var(--font-display)',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Cancel edit
        </button>
      )}
      <button
        type="submit"
        disabled={!text.trim()}
        style={{
          border: 'none',
          background: editingMessage ? 'var(--pencil-blue)' : 'var(--margin-red)',
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 700,
          padding: '9px 20px',
          borderRadius: 20,
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          opacity: text.trim() ? 1 : 0.5,
        }}
      >
        {editingMessage ? 'Save edit' : 'Send'}
      </button>
    </form>
  )
}
