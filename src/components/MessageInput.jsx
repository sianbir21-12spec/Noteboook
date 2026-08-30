import { useRef, useState } from 'react'
import { useFileUpload } from '../hooks/useFileUpload'

export function MessageInput({ onSend, onTyping, threadId }) {
  const [text, setText] = useState('')
  const fileInputRef = useRef(null)
  const { uploadFile, uploading, progress } = useFileUpload()

  const handleChange = (e) => {
    setText(e.target.value)
    onTyping?.(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend({ text: text.trim() })
    setText('')
    onTyping?.(false)
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url, name } = await uploadFile(file, threadId)
      onSend({ text: '', fileURL: url, fileName: name })
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      e.target.value = ''
    }
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
      }}
    >
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Attach a file"
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: 22,
          cursor: 'pointer',
          padding: 6,
        }}
      >
        📎
      </button>
      <input ref={fileInputRef} type="file" hidden onChange={handleFile} />

      <input
        value={text}
        onChange={handleChange}
        onBlur={() => onTyping?.(false)}
        placeholder={uploading ? `Uploading… ${progress}%` : 'Write something…'}
        disabled={uploading}
        style={{
          flex: 1,
          padding: '10px 16px',
          borderRadius: 20,
          border: '1px solid var(--paper-line)',
          background: '#fff',
          fontSize: 15,
        }}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        style={{
          border: 'none',
          background: 'var(--margin-red)',
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
        Send
      </button>
    </form>
  )
}
