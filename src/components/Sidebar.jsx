import { useEffect, useState } from 'react'
import { ref, onValue, set } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useUsers, useUserStatus } from '../hooks/usePresence'
import { UserAvatar } from './UserAvatar'

function dmIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

export function Sidebar({ activeThread, onSelectRoom, onSelectDM, onOpenAdmin, isOpen, onClose }) {
  const { user, signOut, isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [rooms, setRooms] = useState({})
  const [newRoomName, setNewRoomName] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const users = useUsers()
  const { status: myStatus, setStatus } = useUserStatus()

  useEffect(() => {
    const roomsRef = ref(db, 'rooms')
    const unsub = onValue(roomsRef, (snap) => setRooms(snap.val() || {}))
    return unsub
  }, [])

  const createRoom = async (e) => {
    e.preventDefault()
    const name = newRoomName.trim()
    if (!name || creatingRoom) return

    const id = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[.$#[\]/]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!id) {
      alert('Room name must contain at least one letter or number.')
      return
    }

    if (rooms[id]) {
      alert('A room with that name already exists.')
      onSelectRoom(id)
      return
    }

    setCreatingRoom(true)
    try {
      // Create the room atomically. This is required by the Firebase rules:
      // a new room must contain both name and createdBy in the same write.
      await set(ref(db, `rooms/${id}`), { name, createdBy: user.uid })
      setNewRoomName('')
      onSelectRoom(id)
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Could not create the room. Please try again.')
    } finally {
      setCreatingRoom(false)
    }
  }

  const otherUsers = Object.entries(users).filter(([uid]) => uid !== user.uid)

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? 60 : 260,
        background: '#f2ecdb',
        borderRight: '1px solid var(--paper-line)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.25s ease',
      }}
    >
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          alignSelf: 'flex-end',
          margin: '10px 10px 0 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        {collapsed ? '>' : '<'}
      </button>
      <div style={{ padding: collapsed ? '10px 8px' : '20px 18px 10px', overflow: 'hidden' }}>
        <div className="app-title" style={{ fontSize: 30, lineHeight: 1, whiteSpace: 'nowrap' }}>Notebook</div>
      </div>

      <div style={{ padding: '0 14px', flex: 1, overflowY: 'auto' }}>
        <SectionLabel>Rooms</SectionLabel>
        {Object.entries(rooms).map(([id, room]) => (
          <button
            key={id}
            onClick={() => onSelectRoom(id)}
            style={rowStyle(activeThread?.type === 'room' && activeThread?.id === id)}
          >
            # {room.name || id}
          </button>
        ))}
        <form onSubmit={createRoom} style={{ display: 'flex', gap: 6, margin: '8px 4px' }}>
          <input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="new room…"
            disabled={creatingRoom}
            maxLength={80}
            style={{
              flex: 1,
              fontSize: 13,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--paper-line)',
            }}
          />
          <button type="submit" disabled={creatingRoom} style={{ border: 'none', background: 'none', cursor: creatingRoom ? 'wait' : 'pointer' }}>
            {creatingRoom ? '⏳' : '➕'}
          </button>
        </form>

        <SectionLabel>Direct messages</SectionLabel>
        {otherUsers.map(([uid, u]) => (
          <button
            key={uid}
            onClick={() => onSelectDM(dmIdFor(user.uid, uid), uid, u)}
            style={{
              ...rowStyle(activeThread?.type === 'dm' && activeThread?.otherUid === uid),
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UserAvatar photoURL={u.photoURL} displayName={u.displayName} uid={uid} showStatus size={22} />
            {u.displayName || 'Anonymous'}
          </button>
        ))}
        {otherUsers.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', padding: '4px 10px' }}>
            No one else has signed in yet.
          </div>
        )}
      </div>

      <div
        style={{
          padding: 14,
          borderTop: '1px dashed var(--paper-line)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setStatusOpen((v) => !v)}
            title="Set status"
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
          >
            <UserAvatar photoURL={user.photoURL} displayName={user.displayName} uid={user.uid} showStatus userStatus={myStatus} />
          </button>
          {statusOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                background: '#fff',
                border: '1px solid var(--paper-line)',
                borderRadius: 8,
                boxShadow: 'var(--shadow-tape)',
                padding: 4,
                zIndex: 10,
                minWidth: 160,
              }}
            >
              <StatusOption
                label="Online"
                color="var(--online)"
                current={myStatus === 'online'}
                onSelect={() => { setStatus('online'); setStatusOpen(false) }}
              />
              <StatusOption
                label="Away"
                color="#f0c040"
                current={myStatus === 'away'}
                onSelect={() => { setStatus('away'); setStatusOpen(false) }}
              />
              <StatusOption
                label="Do not disturb"
                color="var(--margin-red)"
                current={myStatus === 'dnd'}
                onSelect={() => { setStatus('dnd'); setStatusOpen(false) }}
              />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
            {myStatus === 'dnd' ? 'Do not disturb' : myStatus}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            title="Admin panel"
            style={{
              border: 'none',
              background: 'var(--pencil-blue)',
              color: '#fff',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Admin
          </button>
        )}
        <button
          onClick={signOut}
          title="Sign out"
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--margin-red)' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-soft)',
        fontWeight: 700,
        margin: '14px 6px 6px',
      }}
    >
      {children}
    </div>
  )
}

function StatusOption({ label, color, current, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        textAlign: 'left',
        background: current ? '#f5f0e6' : 'transparent',
        border: 'none',
        borderRadius: 6,
        padding: '6px 8px',
        fontSize: 13,
        cursor: 'pointer',
        color: 'var(--ink)',
        marginBottom: 2,
        fontWeight: current ? 600 : 400,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {label}
    </button>
  )
}

function rowStyle(active) {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: active ? '#fff' : 'transparent',
    border: 'none',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 14,
    cursor: 'pointer',
    color: 'var(--ink)',
    boxShadow: active ? 'var(--shadow-tape)' : 'none',
  }
}
