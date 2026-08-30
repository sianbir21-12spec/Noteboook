import { useEffect, useState } from 'react'
import { ref, onValue, push, set } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useUsers } from '../hooks/usePresence'
import { UserAvatar } from './UserAvatar'

function dmIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

export function Sidebar({ activeThread, onSelectRoom, onSelectDM, onOpenAdmin }) {
  const { user, signOut, isAdmin } = useAuth()
  const [rooms, setRooms] = useState({})
  const [newRoomName, setNewRoomName] = useState('')
  const users = useUsers()

  useEffect(() => {
    const roomsRef = ref(db, 'rooms')
    const unsub = onValue(roomsRef, (snap) => setRooms(snap.val() || {}))
    return unsub
  }, [])

  const createRoom = (e) => {
    e.preventDefault()
    const name = newRoomName.trim()
    if (!name) return

    const id = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[.$#[\]/]/g, '') // strip characters Firebase RTDB keys can't contain
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!id) {
      alert('Room name must contain at least one letter or number.')
      return
    }

    set(ref(db, `rooms/${id}/name`), name)
    set(ref(db, `rooms/${id}/createdBy`), user.uid)
    setNewRoomName('')
    onSelectRoom(id)
  }

  const otherUsers = Object.entries(users).filter(([uid]) => uid !== user.uid)

  return (
    <aside
      style={{
        width: 260,
        background: '#f2ecdb',
        borderRight: '1px solid var(--paper-line)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ padding: '20px 18px 10px' }}>
        <div className="app-title" style={{ fontSize: 30, lineHeight: 1 }}>Notebook</div>
      </div>

      <div style={{ padding: '0 14px', flex: 1, overflowY: 'auto' }}>
        <SectionLabel>Rooms</SectionLabel>
        {Object.entries(rooms).map(([id, room]) => (
          <button
            key={id}
            onClick={() => onSelectRoom(id)}
            style={rowStyle(activeThread?.type === 'room' && activeThread?.id === id)}
          >
            # {room.name}
          </button>
        ))}
        <form onSubmit={createRoom} style={{ display: 'flex', gap: 6, margin: '8px 4px' }}>
          <input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="new room…"
            style={{
              flex: 1,
              fontSize: 13,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--paper-line)',
            }}
          />
          <button type="submit" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>➕</button>
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
            {u.displayName}
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
        }}
      >
        <UserAvatar photoURL={user.photoURL} displayName={user.displayName} uid={user.uid} showStatus />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.displayName}
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
