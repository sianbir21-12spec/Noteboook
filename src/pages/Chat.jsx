import { useCallback, useMemo, useState } from 'react'
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

export function Chat() {
  const { user } = useAuth()
  const [activeThread, setActiveThread] = useState({ type: 'room', id: 'general', label: 'general' })
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

  const { messages, sendMessage, markSeen } = useMessages(threadPath)
  const { typingUsers, setTyping } = useTyping(typingPath, user)

  const handleSeen = useCallback(
    (id) => markSeen(id, user.uid),
    [markSeen, user.uid]
  )

  const handleSelectRoom = (id) => {
    setActiveThread({ type: 'room', id, label: `# ${id}` })
  }

  const handleSelectDM = (dmId, otherUid, otherUser) => {
    setActiveThread({
      type: 'dm',
      id: dmId,
      otherUid,
      label: otherUser?.displayName || 'Direct message',
      otherUser,
    })
  }

  const handleSend = ({ text, fileURL, fileName }) => {
    sendMessage({
      text,
      fileURL,
      fileName,
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      photoURL: user.photoURL || '',
    })
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar activeThread={activeThread} onSelectRoom={handleSelectRoom} onSelectDM={handleSelectDM} />

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
        </header>

        <MessageList
          messages={messages}
          currentUser={user}
          onSeen={handleSeen}
          threadMemberCount={activeThread.type === 'dm' ? 2 : undefined}
        />

        <TypingIndicator typingUsers={typingUsers} />

        <MessageInput onSend={handleSend} onTyping={setTyping} threadId={activeThread.id} />
      </main>
    </div>
  )
}
