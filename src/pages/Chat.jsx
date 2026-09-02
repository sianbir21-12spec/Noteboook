import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMessages } from '../hooks/useMessages'
import { useTyping } from '../hooks/useTyping'
import { useNotificationPermission } from '../hooks/useNotificationPermission'
import { useGlobalMessageNotifications } from '../hooks/useGlobalMessageNotifications'
import { Sidebar } from '../components/Sidebar'
import { MessageList } from '../components/MessageList'
import { MessageInput } from '../components/MessageInput'
import { TypingIndicator } from '../components/TypingIndicator'
import { UserAvatar } from '../components/UserAvatar'
import { NotificationPrompt } from '../components/NotificationPrompt'

export function Chat({ onOpenAdmin }) {
  const { user } = useAuth()
  const [activeThread, setActiveThread] = useState({ type: 'room', id: 'general', label: 'general' })
  const [filterEnabled, setFilterEnabled] = useState(() => {
    try { return localStorage.getItem('profanityFilter') === 'true' } catch (e) { return false }
  })
  useEffect(() => { try { localStorage.setItem('profanityFilter', String(filterEnabled)) } catch (e) {} }, [filterEnabled])
  const [editingMessage, setEditingMessage] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const { permission, requestPermission } = useNotificationPermission()

  const activeThreadKey = activeThread ? `${activeThread.type}:${activeThread.id}` : null
  useGlobalMessageNotifications({ user, activeThreadKey, permission })

  const threadPath = useMemo(() => {
    if (!activeThread) return null
    return activeThread.type === 'room'
      ? `rooms/${activeThread.id}/messages`
      : `dms/${activeThread.id}/messages`
  }, [activeThread])

  const typingPath = useMemo(() => {
    if (!activeThread) return null
    return activeThread.type === 'room'
      ? `rooms/${activeThread.id}/typing`
      : `dms/${activeThread.id}/typing`
  }, [activeThread])

  const { messages, sendMessage, editMessage, markSeen } = useMessages(threadPath, filterEnabled)
  const { typingUsers, setTyping } = useTyping(typingPath, user)

  const handleSeen = useCallback(
    (id) => markSeen(id, user.uid),
    [markSeen, user.uid]
  )

  const handleSelectRoom = (id) => {
    setActiveThread({ type: 'room', id, label: `# ${id}` })
    setReplyingTo(null)
  }

  const handleSelectDM = (dmId, otherUid, otherUser) => {
    setActiveThread({
      type: 'dm',
      id: dmId,
      otherUid,
      label: otherUser?.displayName || 'Direct message',
      otherUser,
    })
    setReplyingTo(null)
  }

  const handleSend = ({ text, fileURL, fileName, replyTo }) => {
    sendMessage({
      text,
      fileURL,
      fileName,
      replyTo,
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      photoURL: user.photoURL || '',
    })
  }

  const handleEditMessage = useCallback(
    (id, text) => {
      editMessage?.(id, text)
      setEditingMessage(null)
    },
    [editMessage]
  )

  const handleReply = useCallback((reply) => {
    setReplyingTo(reply)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  const handleStartEdit = useCallback((m) => {
    setEditingMessage(m)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar activeThread={activeThread} onSelectRoom={handleSelectRoom} onSelectDM={handleSelectDM} onOpenAdmin={onOpenAdmin} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <NotificationPrompt permission={permission} onRequest={requestPermission} />
        <header
          style={{
            padding: '16px 24px',
            borderBottom: '1px dashed var(--paper-line)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {activeThread.type === 'dm' && (
            <UserAvatar
              photoURL={activeThread.otherUser?.photoURL}
              displayName={activeThread.label}
              uid={activeThread.otherUid}
              showStatus
              size={28}
            />
          )}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>
            {activeThread.label}
          </span>
          <button
            onClick={() => setFilterEnabled(f => !f)}
            title={`Profanity filter: ${filterEnabled ? 'on' : 'off'} (click to toggle)`}
            style={{
              background: 'none',
              border: '1px solid var(--paper-line)',
              borderRadius: 'var(--radius)',
              padding: '6px 12px',
              cursor: 'pointer',
              color: filterEnabled ? 'var(--accent)' : 'var(--ink)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {filterEnabled ? 'Filter: On' : 'Filter: Off'}
          </button>
        </header>

        <MessageList
          messages={messages}
          currentUser={user}
          onSeen={handleSeen}
          threadMemberCount={activeThread.type === 'dm' ? 2 : undefined}
          onEdit={handleStartEdit}
          onReply={handleReply}
        />

        <TypingIndicator typingUsers={typingUsers} />

        <MessageInput onSend={handleSend} onEdit={handleEditMessage} onTyping={setTyping} threadId={activeThread.id} editingMessage={editingMessage} replyingTo={replyingTo} onCancelReply={handleCancelReply} />
      </main>
    </div>
  )
}
