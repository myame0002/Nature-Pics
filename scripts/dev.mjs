import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath
const serverEntry = join(projectRoot, 'server.mjs')
const viteCli = join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')

const api = spawn(node, [serverEntry], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
})

const web = spawn(node, [viteCli], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
})

function shutdown(code = 0) {
  if (!api.killed) {
    api.kill('SIGTERM')
  }
  if (!web.killed) {
    web.kill('SIGTERM')
  }
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

api.on('exit', (code, signal) => {
  if (signal) {
    shutdown(1)
    return
  }
  if (code !== 0 && code !== null) {
    web.kill('SIGTERM')
    process.exit(code)
  }
})

web.on('exit', (code, signal) => {
  if (signal) {
    shutdown(1)
    return
  }
  if (code !== 0 && code !== null) {
    api.kill('SIGTERM')
    process.exit(code)
  }
})
