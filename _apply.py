with open('src/components/MessageList.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1) Add onReply to props destructuring
old = 'onEdit, numberingEnabled = false }'
assert old in content, "props string not found"
content = content.replace(old, 'onEdit, numberingEnabled = false, onReply }')

# 2) Insert Reply button after the Edit indicator block (before {m.text && <div>{m.text}</div>})
# Find the edit indicator closing div, then insert reply button + text block after it
old_text_block = "                {m.text && <div>{m.text}</div>}"
assert old_text_block in content, "text block not found"
new_text_block = (
    "                {!mine && onReply && (\n"
    "                  <button\n"
    "                    onClick={() => onReply({ id: m.id, displayName: m.displayName, text: m.text || '' })}\n"
    "                    style={{\n"
    "                      position: 'absolute',\n"
    "                      top: 6,\n"
    "                      right: 6,\n"
    "                      background: 'rgba(0,0,0,0.05)',\n"
    "                      border: 'none',\n"
    "                      borderRadius: 8,\n"
    "                      padding: '2px 6px',\n"
    "                      fontSize: 11,\n"
    "                      cursor: 'pointer',\n"
    "                      color: 'inherit',\n"
    "                    }}\n"
    "                    title=\"Reply\"\n"
    "                  >\n"
    "                    Reply\n"
    "                  </button>\n"
    "                )}\n"
    "                {m.text && <div>{m.text}</div>}"
)
content = content.replace(old_text_block, new_text_block, 1)

# 3) Replace simple reply indicator with a preview box
old_reply_indicator = (
    "                {/* Reply indicator */}\n"
    "                {m.replyTo && (\n"
    "                  <div style={{\n"
    "                    fontSize: 10,\n"
    "                    color: 'var(--ink-soft)',\n"
    "                    marginTop: 4,\n"
    "                    fontWeight: 600,\n"
    "                  }}>\n"
    "                    ↳ Replying to {m.replyTo?.displayName || '...'}\n"
    "                  </div>\n"
    "                )}"
)
assert old_reply_indicator in content, "reply indicator not found"
new_reply_indicator = (
    "                {m.replyTo && (\n"
    "                  <div style={{\n"
    "                    background: 'rgba(0,0,0,0.05)',\n"
    "                    borderRadius: 8,\n"
    "                    padding: '6px 10px',\n"
    "                    marginBottom: 6,\n"
    "                    fontSize: 12,\n"
    "                    color: 'var(--ink-soft)',\n"
    "                    wordBreak: 'break-word',\n"
    "                  }}>\n"
    "                    <div style={{ fontWeight: 600, marginBottom: 2 }}>\n"
    "                      {m.replyTo?.displayName || '...'}\n"
    "                    </div>\n"
    "                    <div style={{ opacity: 0.9 }}>\n"
    "                      {m.replyTo?.text || ''}\n"
    "                    </div>\n"
    "                  </div>\n"
    "                )}"
)
content = content.replace(old_reply_indicator, new_reply_indicator)

with open('src/components/MessageList.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('MessageList.jsx updated')
