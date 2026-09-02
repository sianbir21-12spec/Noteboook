export const meta = {
  name: 'fix-cors-and-add-delete-all',
  description: 'Fix CORS for file uploads and add delete-all-messages button',
  phases: [
    { title: 'Analyze', detail: 'Understand current upload + admin code' },
    { title: 'Fix', detail: 'Add CORS config and delete all button' },
    { title: 'Verify', detail: 'Build and test' },
  ],
}

phase('Analyze')
const analysis = await agent(`Read these files in C:\\Users\\sianb\\Desktop\\Notebook and summarize:
1. src/hooks/useFileUpload.js - how uploads are done
2. src/pages/Admin.jsx - what admin actions exist
3. src/pages/Chat.jsx - how rooms are switched
4. src/contexts/AuthContext.jsx - what admin functions are available
5. firebase.js - storage initialization

Then identify:
- Why CORS fails on the deployed app at https://discord2.zeabur.app
- Where to add a "Delete All Messages" button in admin
- What the deleteAllMessages function should do

Return JSON: {"uploadIssue": "what causes CORS", "fixApproach": "how to fix", "deleteAllLocation": "where to add button"}`, { phase: 'Analyze', schema: { type: 'object', properties: { uploadIssue: { type: 'string' }, fixApproach: { type: 'string' }, deleteAllLocation: { type: 'string' } }, required: ['uploadIssue','fixApproach','deleteAllLocation'] }})

phase('Fix')
const tasks = [
  {
    name: 'Fix Firebase Storage CORS',
    files: 'src/firebase.js, src/hooks/useFileUpload.js, public/_cors.json',
    prompt: 'Fix CORS errors on Firebase Storage uploads. The deployed app at https://discord2.zeabur.app cannot upload to https://firebasestorage.googleapis.com because Storage CORS is not configured. Implement: 1) Create public/cors.json with [{"origin": ["*"], "method": ["GET","POST","PUT","DELETE","HEAD"], "maxAgeSeconds": 3600, "responseHeader": ["Content-Type","Authorization","x-goog-resumable"]}]. 2) Update Dockerfile to copy cors.json to a gs:// bucket during build and run gsutil cors set cors.json gs://discord-46350.firebasestorage.app (you can add it as a build step or document it). 3) Update README.md with manual steps: "Run: gsutil cors set cors.json gs://discord-46350.firebasestorage.app" 4) In useFileUpload.js, wrap the upload in try/catch and show user-friendly error like "Upload blocked by CORS - run gsutil cors set in Firebase Storage". Return JSON status.'
  },
  {
    name: 'Add Delete All Messages button',
    files: 'src/pages/Admin.jsx, src/contexts/AuthContext.jsx',
    prompt: 'Add a "Delete All Messages" button to the admin panel in src/pages/Admin.jsx. Requirements: 1) Add the button in the Rooms tab, next to each room in the Actions column, as a "🗑️ All msgs" red button. 2) When clicked, show a confirmation dialog (use existing CONFIRM_COPY pattern) with the warning "This will delete all messages in this room but keep the room itself. This cannot be undone." 3) When confirmed, call a new function deleteAllRoomMessages in AuthContext.jsx that uses remove(ref(db, `rooms/${roomId}/messages`)). 4) Show a toast "All messages deleted" on success. 5) Add the deleteAllRoomMessages function to the AuthContext exports. Return JSON status.'
  },
]

const results = await parallel(tasks.map(t => () => agent(
  `Task: ${t.name}\nFiles: ${t.files}\n\nTASK: ${t.prompt}\n\nRULES: Only modify listed files. Preserve existing code. Match existing code style. Return JSON: {"status":"done"|"error","files":["..."],"note":"..."}`,
  { phase: 'Fix', label: t.name, schema: { type: 'object', properties: { status: { type: 'string' }, files: { type: 'array' }, note: { type: 'string' } }, required: ['status','files','note'] } }
)))

phase('Verify')
return { analysis, results, totalDone: results.filter(r => r && r.status === 'done').length }
