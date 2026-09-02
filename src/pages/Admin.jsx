import { useEffect, useState } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { subscribeActivityLogs } from '../hooks/useActivityLogs'
import { UserAvatar } from '../components/UserAvatar'

const TABS = ['Overview', 'Users', 'Rooms', 'Messages', 'Activity Logs']

export function Admin({ onBack }) {
  const { user, isAdmin, setUserBanned, setUserAdmin, deleteUserData } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [users, setUsers] = useState({})
  const [status, setStatus] = useState({})
  const [rooms, setRooms] = useState({})
  const [roomMessages, setRoomMessages] = useState({})
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState(null) // { type, uid, name }
  const [toast, setToast] = useState('')
  const [loadingRoomId, setLoadingRoomId] = useState(null)
  const [activityEvents, setActivityEvents] = useState([])

  useEffect(() => {
    const unsubs = [
      onValue(ref(db, 'users'), (s) => setUsers(s.val() || {})),
      onValue(ref(db, 'status'), (s) => setStatus(s.val() || {})),
      onValue(ref(db, 'rooms'), (s) => setRooms(s.val() || {})),
      subscribeActivityLogs(setActivityEvents),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleBan = async (uid, banned) => {
    await setUserBanned(uid, banned)
    showToast(banned ? '🚫 User banned.' : '✅ User unbanned.')
    setConfirm(null)
  }

  const handleDelete = async (uid) => {
    await deleteUserData(uid)
    showToast('🗑️ User data removed.')
    setConfirm(null)
  }

  const handleToggleAdmin = async (uid, makeAdmin) => {
    await setUserAdmin(uid, makeAdmin)
    showToast(makeAdmin ? '🛡️ Admin granted.' : '👤 Admin revoked.')
    setConfirm(null)
  }

  const handleDeleteMessage = async (roomId, messageId) => {
    await remove(ref(db, `rooms/${roomId}/messages/${messageId}`))
    showToast('🗑️ Message deleted.')
  }

  const handleDeleteRoom = async (roomId) => {
    await remove(ref(db, `rooms/${roomId}`))
    showToast('🗑️ Room deleted.')
    setConfirm(null)
  }

  const loadRoomMessages = (roomId) => {
    if (loadingRoomId === roomId) {
      setLoadingRoomId(null)
      return
    }
    setLoadingRoomId(roomId)
    onValue(ref(db, `rooms/${roomId}/messages`), (s) => {
      setRoomMessages((prev) => ({ ...prev, [roomId]: s.val() || {} }))
    }, { onlyOnce: true })
  }

  if (!isAdmin) {
    return (
      <div style={centreStyle}>
        <div style={{ fontSize: 48 }}>⛔</div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 16 }}>You don't have admin access.</p>
        <button onClick={onBack} style={btnStyle('var(--ink)', '#fff')}>← Back</button>
      </div>
    )
  }

  const userList = Object.entries(users)
  const filteredUsers = userList.filter(([, u]) =>
    !search ||
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  const onlineCount = Object.values(status).filter((s) => s?.state === 'online').length
  const totalMessages = Object.values(rooms).reduce((sum, r) => {
    return sum + Object.keys(r?.messages || {}).length
  }, 0)
  const bannedCount = userList.filter(([, u]) => u.banned).length
  const adminCount = userList.filter(([, u]) => u.isAdmin).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '2px dashed var(--paper-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#fff',
        }}
      >
        <button onClick={onBack} style={{ ...btnStyle('transparent', 'var(--ink)'), border: '1px solid var(--paper-line)' }}>
          ← Back
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--margin-red)' }}>
          ⚙️ Admin Panel
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-soft)' }}>
          Signed in as <strong>{user?.email}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '12px 24px 0', borderBottom: '1px solid var(--paper-line)', background: '#fff' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid var(--margin-red)' : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? 'var(--margin-red)' : 'var(--ink-soft)',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div>
            <SectionTitle>📊 Statistics</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
              <StatCard label="Total Users" value={userList.length} icon="👥" />
              <StatCard label="Online Now" value={onlineCount} icon="🟢" />
              <StatCard label="Rooms" value={Object.keys(rooms).length} icon="💬" />
              <StatCard label="Messages" value={totalMessages} icon="✉️" />
              <StatCard label="Banned" value={bannedCount} icon="🚫" />
              <StatCard label="Admins" value={adminCount} icon="🛡️" />
            </div>

            <SectionTitle>🕐 Recent Users</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['User', 'Email', 'Status', 'Admin', 'Banned'].map((h) => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userList.slice(0, 10).map(([uid, u]) => (
                  <tr key={uid}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserAvatar photoURL={u.photoURL} displayName={u.displayName} uid={uid} size={28} />
                        {u.displayName}
                      </div>
                    </Td>
                    <Td>{u.email || '—'}</Td>
                    <Td>
                      <StatusBadge online={status[uid]?.state === 'online'} />
                    </Td>
                    <Td>{u.isAdmin ? '🛡️ Yes' : '—'}</Td>
                    <Td>{u.banned ? <span style={{ color: 'var(--margin-red)' }}>🚫 Yes</span> : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'Users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <SectionTitle style={{ margin: 0 }}>👥 All Users ({userList.length})</SectionTitle>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                style={{ ...inputStyle, marginLeft: 'auto', width: 260 }}
              />
            </div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['User', 'Email', 'Status', 'Roles', 'Actions'].map((h) => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(([uid, u]) => {
                  const isSelf = uid === user?.uid
                  const online = status[uid]?.state === 'online'
                  return (
                    <tr key={uid} style={{ opacity: u.banned ? 0.6 : 1 }}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserAvatar photoURL={u.photoURL} displayName={u.displayName} uid={uid} size={28} showStatus />
                          <span>{u.displayName}</span>
                          {isSelf && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>(you)</span>}
                        </div>
                      </Td>
                      <Td style={{ fontSize: 13 }}>{u.email || '—'}</Td>
                      <Td><StatusBadge online={online} /></Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {u.isAdmin && <Tag color="var(--pencil-blue)">🛡️ Admin</Tag>}
                          {u.banned && <Tag color="var(--margin-red)">🚫 Banned</Tag>}
                          {!u.isAdmin && !u.banned && <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>User</span>}
                        </div>
                      </Td>
                      <Td>
                        {!isSelf && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setConfirm({ type: u.banned ? 'unban' : 'ban', uid, name: u.displayName })}
                              style={actionBtn(u.banned ? '#4a7a4a' : 'var(--margin-red)')}
                            >
                              {u.banned ? '✅ Unban' : '🚫 Ban'}
                            </button>
                            <button
                              onClick={() => setConfirm({ type: u.isAdmin ? 'revoke-admin' : 'make-admin', uid, name: u.displayName })}
                              style={actionBtn('var(--pencil-blue)')}
                            >
                              {u.isAdmin ? '👤 Revoke' : '🛡️ Admin'}
                            </button>
                            <button
                              onClick={() => setConfirm({ type: 'delete', uid, name: u.displayName })}
                              style={actionBtn('#888')}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ROOMS ── */}
        {activeTab === 'Rooms' && (
          <div>
            <SectionTitle>💬 Rooms ({Object.keys(rooms).length})</SectionTitle>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Room', 'Messages', 'Actions'].map((h) => (
                    <Th key={h}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(rooms).map(([roomId, room]) => (
                  <tr key={roomId}>
                    <Td><strong># {room.name || roomId}</strong></Td>
                    <Td>{Object.keys(room.messages || {}).length}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => loadRoomMessages(roomId)}
                          style={actionBtn('var(--pencil-blue)')}
                        >
                          {loadingRoomId === roomId ? '🔼 Hide' : '📋 View msgs'}
                        </button>
                        <button
                          onClick={() => setConfirm({ type: 'delete-room', uid: roomId, name: room.name || roomId })}
                          style={actionBtn('var(--margin-red)')}
                        >
                          🗑️ Delete Room
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === 'Messages' && (
          <div>
            <SectionTitle>✉️ Room Messages</SectionTitle>
            {Object.entries(rooms).map(([roomId, room]) => {
              const msgs = roomMessages[roomId]
              const msgList = msgs ? Object.entries(msgs) : null
              return (
                <div key={roomId} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}># {room.name || roomId}</strong>
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {Object.keys(room.messages || {}).length} messages
                    </span>
                    <button onClick={() => loadRoomMessages(roomId)} style={{ ...actionBtn('var(--pencil-blue)'), marginLeft: 'auto' }}>
                      {loadingRoomId === roomId ? '🔼 Hide' : '📋 Load'}
                    </button>
                  </div>
                  {loadingRoomId === roomId && msgList && (
                    <table style={{ ...tableStyle, marginTop: 0 }}>
                      <thead>
                        <tr>
                          {['Sender', 'Content', 'Time', 'Delete'].map((h) => <Th key={h}>{h}</Th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {msgList.map(([msgId, msg]) => (
                          <tr key={msgId}>
                            <Td style={{ fontSize: 13 }}>{msg.displayName || '—'}</Td>
                            <Td style={{ maxWidth: 380, wordBreak: 'break-word', fontSize: 13 }}>
                              {msg.text || (msg.fileURL ? <a href={msg.fileURL} target="_blank" rel="noreferrer">📎 File</a> : '—')}
                            </Td>
                            <Td style={{ fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '—'}
                            </Td>
                            <Td>
                              <button
                                onClick={() => handleDeleteMessage(roomId, msgId)}
                                style={actionBtn('var(--margin-red)')}
                              >
                                🗑️
                              </button>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── ACTIVITY LOGS ── */}
        {activeTab === 'Activity Logs' && (
          <div>
            <SectionTitle>📜 Activity Logs (last 50)</SectionTitle>
            {activityEvents.length === 0 ? (
              <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No activity yet.</p>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Type', 'Actor', 'Target', 'Details', 'Time'].map((h) => <Th key={h}>{h}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {activityEvents.map((evt) => {
                    const meta = EVENT_META[evt.type] || { label: evt.type, icon: '•', color: 'var(--ink-soft)' }
                    return (
                      <tr key={evt.id}>
                        <Td>
                          <Tag color={meta.color}>{meta.icon} {meta.label}</Tag>
                        </Td>
                        <Td style={{ fontSize: 13 }}>
                          {evt.actorName || evt.actorId || '—'}
                        </Td>
                        <Td style={{ fontSize: 13 }}>
                          {evt.targetName || evt.targetId || '—'}
                        </Td>
                        <Td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                          {evt.roomName || evt.roomId || ''}
                        </Td>
                        <Td style={{ fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>
              {CONFIRM_COPY[confirm.type]?.title || 'Confirm'}
            </p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '0 0 20px' }}>
              {CONFIRM_COPY[confirm.type]?.body(confirm.name)}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} style={btnStyle('var(--paper)', 'var(--ink)')}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirm.type === 'ban') handleBan(confirm.uid, true)
                  else if (confirm.type === 'unban') handleBan(confirm.uid, false)
                  else if (confirm.type === 'delete') handleDelete(confirm.uid)
                  else if (confirm.type === 'make-admin') handleToggleAdmin(confirm.uid, true)
                  else if (confirm.type === 'revoke-admin') handleToggleAdmin(confirm.uid, false)
                  else if (confirm.type === 'delete-room') handleDeleteRoom(confirm.uid)
                }}
                style={btnStyle(CONFIRM_COPY[confirm.type]?.danger ? 'var(--margin-red)' : 'var(--pencil-blue)', '#fff')}
              >
                {CONFIRM_COPY[confirm.type]?.btn || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--ink)',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_META = {
  join:            { label: 'User Joined',        icon: '🎉', color: 'var(--pencil-blue)' },
  leave:           { label: 'User Left',          icon: '👋', color: 'var(--ink-soft)' },
  ban:             { label: 'User Banned',        icon: '🚫', color: 'var(--margin-red)' },
  unban:           { label: 'User Unbanned',      icon: '✅', color: '#4a7a4a' },
  message_sent:    { label: 'Message Sent',       icon: '✉️', color: 'var(--pencil-blue)' },
  message_deleted: { label: 'Message Deleted',   icon: '🗑️', color: 'var(--margin-red)' },
  room_created:    { label: 'Room Created',       icon: '💬', color: 'var(--pencil-blue)' },
  room_deleted:    { label: 'Room Deleted',       icon: '🗑️', color: 'var(--margin-red)' },
  admin_granted:   { label: 'Admin Granted',      icon: '🛡️', color: 'var(--pencil-blue)' },
  admin_revoked:   { label: 'Admin Revoked',      icon: '👤', color: 'var(--margin-red)' },
}

const CONFIRM_COPY = {
  ban: {
    title: 'Ban user?',
    body: (name) => `"${name}" will be banned and see a suspension screen immediately.`,
    btn: '🚫 Ban',
    danger: true,
  },
  unban: {
    title: 'Unban user?',
    body: (name) => `"${name}" will regain full access.`,
    btn: '✅ Unban',
    danger: false,
  },
  delete: {
    title: 'Delete user data?',
    body: (name) => `This removes "${name}"'s profile and status from the database. Their messages will remain.`,
    btn: '🗑️ Delete',
    danger: true,
  },
  'make-admin': {
    title: 'Grant admin?',
    body: (name) => `"${name}" will have full admin access to this panel.`,
    btn: '🛡️ Grant',
    danger: false,
  },
  'revoke-admin': {
    title: 'Revoke admin?',
    body: (name) => `"${name}"'s admin access will be removed.`,
    btn: '👤 Revoke',
    danger: true,
  },
  'delete-room': {
    title: 'Delete room?',
    body: (name) => `The room "# ${name}" and all its messages will be permanently deleted.`,
    btn: '🗑️ Delete Room',
    danger: true,
  },
}

function StatCard({ label, value, icon }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: 'var(--shadow-tape)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        border: '1px solid var(--paper-line)',
      }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{label}</div>
    </div>
  )
}

function StatusBadge({ online }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: online ? '#3a7a3a' : 'var(--ink-soft)',
        background: online ? '#d4edda' : '#eee',
        borderRadius: 6,
        padding: '2px 8px',
      }}
    >
      {online ? '🟢 Online' : '⚫ Offline'}
    </span>
  )
}

function Tag({ color, children }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        background: color,
        borderRadius: 5,
        padding: '2px 7px',
      }}
    >
      {children}
    </span>
  )
}

function SectionTitle({ children, style }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 14,
        color: 'var(--ink)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 14px',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--ink-soft)',
        borderBottom: '2px solid var(--paper-line)',
        background: '#faf6ec',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, style }) {
  return (
    <td
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--paper-line)',
        fontSize: 14,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {children}
    </td>
  )
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  background: '#fff',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: 'var(--shadow-tape)',
  border: '1px solid var(--paper-line)',
}

const inputStyle = {
  border: '1px solid var(--paper-line)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(43,38,32,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const dialogStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 28,
  maxWidth: 380,
  width: '90%',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
}

const centreStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 16,
}

function btnStyle(bg, color) {
  return {
    background: bg,
    color,
    border: '1px solid var(--paper-line)',
    borderRadius: 8,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function actionBtn(color) {
  return {
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }
}
