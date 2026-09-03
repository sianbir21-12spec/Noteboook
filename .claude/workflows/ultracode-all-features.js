export const meta = { name: 'ultracode-all-features', description: 'Implement all remaining features using 10 agents', phases: [{title:'Plan'},{title:'Build'},{title:'Verify'}] }
phase('Plan')
await agent('Read project at C:\Users\sianb\Desktop\Notebook src folder. List 5 feature areas: live chat, admin charts, push notifications, mobile responsive, REST API. Give one-line scope for each.', {phase:'Plan'})
phase('Build')
const all = await parallel([
  () => agent('Improving live chat: modify src/components/TypingIndicator.jsx and src/hooks/useTyping.js to show animated dots and count online users. Return status.', {phase:'Build', label:'live-chat', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
  () => agent('Admin charts: add statistics bars to src/pages/Admin.jsx Overview tab using simple CSS bar charts. Return status.', {phase:'Build', label:'admin-charts', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
  () => agent('Push notifications: create public/firebase-messaging-sw.js, update .env with VAPID placeholder, add src/hooks/useNotifications.js. Return status.', {phase:'Build', label:'push', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
  () => agent('Mobile responsive: add media queries to src/styles/global.css and make Sidebar collapsible in src/components/Sidebar.jsx for screens under 768px. Return status.', {phase:'Build', label:'mobile', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
  () => agent('REST API server: create server/routes/admin.js with GET /api/stats, POST /api/admin/ban, POST /api/admin/delete-room. Update server/index.js to mount routes. Add basic auth. Return status.', {phase:'Build', label:'rest-api', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
  () => agent('Adversarial check: review all changed files for broken imports, missing props, syntax errors, undefined variables like uploading/progress, and broken event handlers. List issues.', {phase:'Build', label:'verify-1', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
  () => agent('Completeness check: verify all 5 features have working code, database rules match new endpoints, auth middleware is secure, mobile CSS does not break desktop. List missing pieces.', {phase:'Build', label:'verify-2', schema:{type:'object',properties:{status:{type:'string'},files:{type:'array'},note:{type:'string'}},required:['status','files','note']}}),
])
phase('Verify')
const buildResult = await Bash('npm run build 2>&1 | grep "✓ built" || echo "BUILD FAILED"')
log('Ultracode complete: ' + all.length + ' agents. Build: ' + buildResult)
return { plan: 'done', agents: all, build: buildResult }
