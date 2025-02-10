const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { spawn } = require('child_process')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Start the FastAPI backend
  const backendPath = path.join(__dirname, '..', 'backend')
  const backend = spawn('uvicorn', ['main:app', '--reload', '--port', '8000'], {
    cwd: backendPath,
    shell: true
  })

  // Log backend output
  backend.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`)
  })

  backend.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`)
  })

  // Create the frontend server
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })

  // Handle cleanup on exit
  process.on('SIGTERM', () => {
    console.log('Shutting down...')
    backend.kill()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('Shutting down...')
    backend.kill()
    process.exit(0)
  })
}) 