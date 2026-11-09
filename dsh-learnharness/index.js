/**
 * Host half of the LearnHarness panel.
 *
 * The full LearnHarness application stays the upstream Next.js app: this
 * plugin only supervises its production standalone server and exposes a
 * same-origin control surface to the Client half. The panel itself points an
 * iframe at the loopback server, so every upstream feature (teaching,
 * practice, the graph, imports, settings, dictation) runs unchanged.
 *
 * Why a separate origin: LearnHarness owns `/api`, `/_next`, and streamed
 * server routes at the root of its origin. Re-hosting it under a Harness
 * prefix would mean rewriting Next's RSC payloads and stream URLs. A
 * loopback origin keeps the upstream app byte-for-byte faithful; the only
 * cross-origin surface is the one-way iframe document.
 */
import { execFile as execFileCallback, spawn } from 'node:child_process'
import {
  appendFileSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)

/** Same-origin control prefix mounted on the Harness Web server. */
const MOUNT = '/learnharness'
/** Default loopback port; the next free port in the span is used if taken. */
const DEFAULT_PORT = 3477
const PORT_SPAN = 12
const START_TIMEOUT = 120_000
const PROBE_TIMEOUT = 2_500
const LOG_LIMIT = 4 * 1024 * 1024
const UPDATE_LOG_LIMIT = 2 * 1024 * 1024
const MAX_LOG_TAIL = 2_600
const UPDATE_INTERVAL_MS = 30 * 60 * 1000
const UPDATE_CHECK_DELAY_MS = 12_000
const BUILD_TIMEOUT_MS = 25 * 60 * 1000
const INSTALL_TIMEOUT_MS = 15 * 60 * 1000
const GIT_TIMEOUT_MS = 30_000

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = findAppRoot()
const SERVER_ENTRY = path.join(APP_ROOT, '.next', 'standalone', 'server.js')
const NEXT_BIN = path.join(APP_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')
const BUILD_ID = path.join(APP_ROOT, '.next', 'BUILD_ID')
const NEXT_DIR = path.join(APP_ROOT, '.next')
const NEXT_BACKUP = path.join(APP_ROOT, '.next.update-backup')
const NODE_MODULES = path.join(APP_ROOT, 'node_modules')
const NODE_MODULES_BACKUP = path.join(APP_ROOT, 'node_modules.update-backup')
const DATA_ROOT = resolveDataRoot()
const DATA_DIR = path.join(DATA_ROOT, 'data')
const AUTH_FILE = path.join(DATA_ROOT, 'auth.json')
const LOG_PATH = path.join(DATA_ROOT, 'logs', 'server.log')
const UPDATE_LOG_PATH = path.join(DATA_ROOT, 'logs', 'update.log')
const APP_VERSION = readAppVersion()
const PREPARE_APP = path.join(PLUGIN_DIR, 'scripts', 'prepare-app.mjs')
const PATCH_LIGHTNINGCSS = path.join(PLUGIN_DIR, 'scripts', 'patch-lightningcss.mjs')

let child = null
let external = false
let port = null
let phase = 'idle'
let starting = false
let startPromise = null
let lastError = ''
let lastExit = null
let startedAt = null
/** Bumped by teardown so an in-flight start from a dead plugin run stops. */
let lifecycle = 0

/** Last known upstream state; the footer button and panel read this. */
const updateState = {
  phase: 'idle',
  checking: false,
  checkingPromise: null,
  updating: false,
  available: false,
  localCommit: null,
  remoteCommit: null,
  behind: 0,
  subject: '',
  checkedAt: null,
  startedAt: null,
  finishedAt: null,
  error: '',
}
let updateCheckTimer = null
let updatePollTimer = null

export const inject = ['webServer']

export function apply(ctx) {
  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: MOUNT, handler: handleControl }),
    'learnharness: control routes',
  )

  const onExit = () => shutdown()
  process.once('exit', onExit)

  ctx.effect(
    () => () => {
      process.removeListener('exit', onExit)
      shutdown()
    },
    'learnharness: server lifecycle',
  )

  ctx.effect(() => {
    updateCheckTimer = setTimeout(() => {
      void checkForUpdate()
    }, UPDATE_CHECK_DELAY_MS)
    updatePollTimer = setInterval(() => {
      void checkForUpdate()
    }, UPDATE_INTERVAL_MS)
    return () => {
      if (updateCheckTimer) clearTimeout(updateCheckTimer)
      if (updatePollTimer) clearInterval(updatePollTimer)
      updateCheckTimer = null
      updatePollTimer = null
    }
  }, 'learnharness: upstream update checks')

  // Resident by design: the panel is already warm when the user clicks the
  // sidebar mark. A failed start is surfaced in the panel, not thrown at boot.
  void ensureServer()
}

async function handleControl(req, res) {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1')
  const pathname = requestUrl.pathname

  if (pathname === `${MOUNT}/status` && (req.method === 'GET' || req.method === 'HEAD')) {
    const status = await getStatus()
    return json(res, 200, status, req.method === 'HEAD')
  }
  if (pathname === `${MOUNT}/start` && req.method === 'POST') {
    await ensureServer()
    return json(res, 200, await getStatus())
  }
  if (pathname === `${MOUNT}/restart` && req.method === 'POST') {
    await restartServer()
    return json(res, 200, await getStatus())
  }
  if (pathname === `${MOUNT}/update/status` && (req.method === 'GET' || req.method === 'HEAD')) {
    return json(res, 200, updateStatus(), req.method === 'HEAD')
  }
  if (pathname === `${MOUNT}/update/check` && req.method === 'POST') {
    const result = await checkForUpdate({ force: true })
    return json(res, 200, result)
  }
  if (pathname === `${MOUNT}/update` && req.method === 'POST') {
    if (updateState.updating) {
      return json(res, 202, { started: false, update: publicUpdate() })
    }
    void runUpdate()
    return json(res, 202, { started: true, update: publicUpdate() })
  }
  if (pathname === `${MOUNT}/update/log` && (req.method === 'GET' || req.method === 'HEAD')) {
    return text(res, 200, readUpdateLog(20_000) || 'No update log yet.\n', req.method === 'HEAD')
  }
  if (pathname === `${MOUNT}/log` && (req.method === 'GET' || req.method === 'HEAD')) {
    const tail = readLogTail(12_000)
    return text(res, 200, tail || 'No log yet.\n', req.method === 'HEAD')
  }
  return json(res, 404, { error: 'Unknown LearnHarness control route' })
}

async function getStatus() {
  const online = port === null ? false : await probeHealth(port)
  if (online) {
    phase = 'online'
    lastError = ''
  } else if (starting) {
    phase = 'starting'
  } else if (child && child.exitCode === null) {
    phase = 'offline'
  } else if (lastError) {
    phase = 'error'
  } else if (phase === 'online') {
    phase = 'offline'
  }

  return {
    phase,
    online,
    starting,
    url: online && port !== null ? `http://127.0.0.1:${port}/` : null,
    port,
    managed: Boolean(child && child.exitCode === null && !external),
    external,
    pid: child && child.exitCode === null ? child.pid ?? null : null,
    appRoot: APP_ROOT,
    appVersion: APP_VERSION,
    dataDir: DATA_DIR,
    authFile: AUTH_FILE,
    logPath: LOG_PATH,
    logTail: readLogTail(MAX_LOG_TAIL),
    error: lastError,
    lastExit,
    startedAt,
    update: publicUpdate(),
  }
}

// ─── Upstream source updates ───────────────────────────────────────────────
// The panel tracks the upstream main branch, not a release number: a new
// commit is the unit of update. Checking is read-only (`git fetch`); applying
// stops the local server, backs up `.next`, fast-forwards, reapplies the two
// app patches, rebuilds, and restarts. A failed build rolls the checkout and
// the previous build back.

function publicUpdate() {
  return {
    phase: updateState.phase,
    checking: updateState.checking,
    updating: updateState.updating,
    available: updateState.available,
    localCommit: updateState.localCommit,
    remoteCommit: updateState.remoteCommit,
    behind: updateState.behind,
    subject: updateState.subject,
    checkedAt: updateState.checkedAt,
    startedAt: updateState.startedAt,
    finishedAt: updateState.finishedAt,
    error: updateState.error,
    appVersion: APP_VERSION,
  }
}

function updateStatus() {
  return { ...publicUpdate(), logPath: UPDATE_LOG_PATH, logTail: readUpdateLog(10_000) }
}

async function checkForUpdate({ force = false } = {}) {
  if (updateState.updating) return updateStatus()
  if (updateState.checkingPromise) return updateState.checkingPromise
  if (!force && updateState.checkedAt !== null && Date.now() - updateState.checkedAt < 60_000) {
    return updateStatus()
  }

  updateState.checkingPromise = (async () => {
    updateState.checking = true
    updateState.phase = updateState.available ? 'available' : 'checking'
    try {
      const local = await git(['rev-parse', 'HEAD'])
      await git(['fetch', '--quiet', 'origin', 'main'], 90_000)
      const remote = await git(['rev-parse', 'origin/main'])
      const behindRaw = await git(['rev-list', '--count', 'HEAD..origin/main'])
      const behind = Number.parseInt(behindRaw, 10) || 0
      updateState.localCommit = local
      updateState.remoteCommit = remote
      updateState.behind = behind
      updateState.available = behind > 0
      updateState.subject = behind > 0 ? await git(['log', '-1', '--format=%s', 'origin/main']) : ''
      updateState.error = ''
      updateState.phase = updateState.available ? 'available' : 'idle'
    } catch (error) {
      updateState.error = `Update check failed: ${messageOf(error)}`
      updateState.phase = updateState.available ? 'available' : 'error'
    } finally {
      updateState.checking = false
      updateState.checkedAt = Date.now()
      updateState.checkingPromise = null
    }
    return updateStatus()
  })()

  return updateState.checkingPromise
}

async function runUpdate() {
  if (updateState.updating) return
  updateState.updating = true
  updateState.startedAt = Date.now()
  updateState.finishedAt = null
  updateState.error = ''
  updateState.phase = 'checking'
  mkdirSync(path.dirname(UPDATE_LOG_PATH), { recursive: true })
  try {
    if (statSync(UPDATE_LOG_PATH).size > UPDATE_LOG_LIMIT) writeFileSync(UPDATE_LOG_PATH, '')
  } catch {
    /* first update */
  }
  updateLog(`\n===== ${new Date().toISOString()} update requested =====`)
  let oldCommit = null
  let pulled = false
  let nextBackedUp = false
  let modulesBackedUp = false

  try {
    if (!updateState.available) {
      await checkForUpdate({ force: true })
      if (!updateState.available) {
        if (updateState.error) throw new Error(updateState.error)
        updateState.phase = 'idle'
        updateState.error = 'Already up to date.'
        return
      }
    }
    if (external) {
      throw new Error('The running LearnHarness server was started outside this plugin; stop it before updating.')
    }

    oldCommit = await git(['rev-parse', 'HEAD'])
    await assertUpdateSafe()
    updateState.phase = 'stopping'
    updateLog('Stopping the managed LearnHarness server…')
    await stopServerForUpdate()

    updateState.phase = 'backup'
    if (existsSync(NEXT_BACKUP)) safeRemoveTree(NEXT_BACKUP)
    if (existsSync(NEXT_DIR)) {
      renameSync(NEXT_DIR, NEXT_BACKUP)
      nextBackedUp = true
      updateLog('Backed up the current .next build.')
    }

    updateState.phase = 'pulling'
    updateLog('Restoring managed source files and fast-forwarding origin/main…')
    await restoreManagedSource()
    await git(['pull', '--ff-only', 'origin', 'main'], 120_000)
    pulled = true
    const newCommit = await git(['rev-parse', 'HEAD'])
    if (newCommit === oldCommit) {
      updateLog('Upstream is already at this commit; no rebuild needed.')
      await finishUpdateWithoutRebuild(newCommit)
      return
    }

    updateState.phase = 'patching'
    updateLog(`Updating ${oldCommit.slice(0, 8)} → ${newCommit.slice(0, 8)}`)
    await runNodeScript(PREPARE_APP)

    const dependencyDiff = await git(['diff', '--name-only', oldCommit, newCommit, '--', 'package.json', 'package-lock.json'])
    if (dependencyDiff.trim() !== '' || !existsSync(path.join(NODE_MODULES, 'next'))) {
      updateState.phase = 'installing'
      updateLog('Dependencies changed; reinstalling with npm ci…')
      if (existsSync(NODE_MODULES_BACKUP)) safeRemoveTree(NODE_MODULES_BACKUP)
      if (existsSync(NODE_MODULES)) {
        renameSync(NODE_MODULES, NODE_MODULES_BACKUP)
        modulesBackedUp = true
      }
      await runNpm(['ci', '--no-audit', '--no-fund'], INSTALL_TIMEOUT_MS)
    } else {
      updateLog('No dependency changes; keeping node_modules.')
    }

    updateState.phase = 'building'
    await runNodeScript(PATCH_LIGHTNINGCSS)
    updateLog('Building the new LearnHarness production server…')
    await runNpm(['run', 'build'], BUILD_TIMEOUT_MS)

    updateState.phase = 'restarting'
    await ensureServer()
    const status = await getStatus()
    if (!status.online) throw new Error(`The rebuilt server did not become healthy. ${status.error || ''}`)
    if (existsSync(NEXT_BACKUP)) {
      safeRemoveTree(NEXT_BACKUP)
      nextBackedUp = false
    }
    if (modulesBackedUp && existsSync(NODE_MODULES_BACKUP)) {
      safeRemoveTree(NODE_MODULES_BACKUP)
      modulesBackedUp = false
    }

    updateState.available = false
    updateState.behind = 0
    updateState.localCommit = newCommit
    updateState.subject = ''
    updateState.phase = 'complete'
    updateState.finishedAt = Date.now()
    updateLog(`Update complete at ${newCommit.slice(0, 8)}.`)
  } catch (error) {
    updateState.error = messageOf(error)
    updateState.phase = 'error'
    updateState.finishedAt = Date.now()
    updateLog(`Update failed: ${messageOf(error)}`)
    updateLog('Rolling back to the previous source and build…')
    await rollbackUpdate({ oldCommit, pulled, nextBackedUp, modulesBackedUp })
  } finally {
    updateState.updating = false
    if (updateState.phase !== 'complete') updateState.finishedAt = Date.now()
  }
}

async function finishUpdateWithoutRebuild(commit) {
  if (existsSync(NEXT_BACKUP)) {
    if (existsSync(NEXT_DIR)) safeRemoveTree(NEXT_DIR)
    renameSync(NEXT_BACKUP, NEXT_DIR)
  }
  await ensureServer()
  updateState.available = false
  updateState.behind = 0
  updateState.localCommit = commit
  updateState.subject = ''
  updateState.phase = 'complete'
  updateState.finishedAt = Date.now()
  updateLog('Already up to date.')
}

async function rollbackUpdate({ oldCommit, pulled, nextBackedUp, modulesBackedUp }) {
  try {
    await stopServerForUpdate()
    if (existsSync(NEXT_BACKUP)) {
      if (existsSync(NEXT_DIR)) safeRemoveTree(NEXT_DIR)
      renameSync(NEXT_BACKUP, NEXT_DIR)
      updateLog('Restored the previous .next build.')
    }
    if (modulesBackedUp && existsSync(NODE_MODULES_BACKUP)) {
      if (existsSync(NODE_MODULES)) safeRemoveTree(NODE_MODULES)
      renameSync(NODE_MODULES_BACKUP, NODE_MODULES)
      updateLog('Restored the previous node_modules.')
    }
    if (pulled && oldCommit) {
      await git(['reset', '--hard', oldCommit], 60_000)
      updateLog(`Reset source to ${oldCommit.slice(0, 8)}.`)
    }
    await runNodeScript(PREPARE_APP, 120_000)
    await runNodeScript(PATCH_LIGHTNINGCSS, 120_000)
    await ensureServer()
    updateState.available = true
    updateLog('Rollback finished; the previous LearnHarness build is running again.')
  } catch (rollbackError) {
    updateLog(`Rollback failed: ${messageOf(rollbackError)}`)
    updateState.error = `${updateState.error}; rollback failed: ${messageOf(rollbackError)}`
  }
}

async function assertUpdateSafe() {
  const status = await git(['status', '--porcelain'])
  const managed = new Set(['app/layout.tsx', 'next.config.ts', 'next-env.d.ts'])
  const blocked = []
  for (const line of status.split('\n').filter(Boolean)) {
    if (line.startsWith('?? ')) continue
    const file = line.slice(3).trim()
    if (!managed.has(file)) blocked.push(line)
  }
  if (blocked.length > 0) {
    throw new Error(`Local tracked changes block the automatic update: ${blocked.join(' | ')}`)
  }
}

async function restoreManagedSource() {
  for (const file of ['app/layout.tsx', 'next.config.ts', 'next-env.d.ts']) {
    try {
      await git(['checkout', '--', file])
    } catch {
      /* a generated file may not exist in this checkout */
    }
  }
}

async function stopServerForUpdate() {
  if (!child) {
    port = null
    phase = 'idle'
    return
  }
  const target = child
  child = null
  port = null
  phase = 'idle'
  try {
    target.kill()
  } catch {
    /* already gone */
  }
  await sleep(600)
  if (target.exitCode === null) {
    try {
      target.kill('SIGKILL')
    } catch {
      /* already gone */
    }
  }
  const deadline = Date.now() + 5_000
  while (target.exitCode === null && Date.now() < deadline) await sleep(250)
}

async function runNodeScript(script, timeout = BUILD_TIMEOUT_MS) {
  await runProcess(process.execPath, [script, APP_ROOT], timeout)
}

async function runNpm(args, timeout) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  await runProcess(command, args, timeout, process.platform === 'win32', {
    npm_config_os: 'win32',
    npm_config_cpu: 'x64',
    ELECTRON_SKIP_BINARY_DOWNLOAD: '1',
  })
}

function runProcess(command, args, timeout, shell = false, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    updateLog(`$ ${command} ${args.join(' ')}`)
    let settled = false
    let outputTail = ''
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try {
        childProcessKill()
      } catch {
        /* already gone */
      }
      reject(new Error(`Command timed out after ${Math.round(timeout / 1000)}s: ${command} ${args.join(' ')}`))
    }, timeout)
    let childProcessKill = () => {}
    let proc
    try {
      proc = spawn(command, args, {
        cwd: APP_ROOT,
        env: { ...process.env, ...extraEnv, NODE_ENV: 'production', LH_WEB_SERVER: '1', NEXT_TELEMETRY_DISABLED: '1' },
        windowsHide: true,
        shell,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      clearTimeout(timer)
      reject(error)
      return
    }
    childProcessKill = () => proc.kill()
    const onData = chunk => {
      const text = chunk.toString()
      outputTail = (outputTail + text).slice(-4_000)
      updateLog(text)
    }
    proc.stdout?.on('data', onData)
    proc.stderr?.on('data', onData)
    proc.once('error', error => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    })
    proc.once('exit', code => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}. ${outputTail.slice(-1_200)}`))
    })
  })
}

function updateLog(text) {
  const clean = String(text).replace(/\r/g, '').replace(/\x1b\[[0-9;]*m/g, '')
  if (clean.length === 0) return
  try {
    appendFileSync(UPDATE_LOG_PATH, clean.endsWith('\n') ? clean : `${clean}\n`)
  } catch {
    /* logging is best effort */
  }
}

function readUpdateLog(limit) {
  try {
    return readFileSync(UPDATE_LOG_PATH, 'utf8').slice(-limit)
  } catch {
    return ''
  }
}

/**
 * Remove a tree without traversing junctions. Next keeps external packages as
 * `.next/node_modules` junctions to the real `node_modules`; a recursive
 * rmSync on a previous build follows those junctions and deletes the package
 * contents. Unlink a reparse point, recurse only real directories.
 */
function safeRemoveTree(target) {
  let stat
  try {
    stat = lstatSync(target)
  } catch {
    return
  }
  if (stat.isSymbolicLink()) {
    try {
      unlinkSync(target)
    } catch {
      try {
        rmdirSync(target)
      } catch {
        /* best effort */
      }
    }
    return
  }
  if (stat.isDirectory()) {
    for (const name of readdirSync(target)) safeRemoveTree(path.join(target, name))
    try {
      rmdirSync(target)
    } catch {
      /* best effort */
    }
    return
  }
  try {
    unlinkSync(target)
  } catch {
    /* best effort */
  }
}

async function git(args, timeout = GIT_TIMEOUT_MS) {
  const { stdout } = await execFile('git', ['-C', APP_ROOT, ...args], {
    timeout,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' },
  })
  // Preserve leading whitespace: porcelain status uses the first two columns,
  // and String.trim() would eat the first line's leading status space.
  return stdout.replace(/^\uFEFF/, '').trimEnd()
}

async function ensureServer() {
  if (startPromise) return startPromise
  const run = lifecycle
  startPromise = (async () => {
    try {
      const found = await findRunning()
      if (run !== lifecycle) return await getStatus()
      if (found) {
        port = found.port
        external = found.external
        phase = 'online'
        lastError = ''
        startedAt = startedAt ?? new Date().toISOString()
        return await getStatus()
      }

      if (!hasServerBuild()) {
        lastError =
          `LearnHarness production build is missing. Expected ${BUILD_ID}. ` +
          `Build it once in ${APP_ROOT}: npm ci --os=win32 --cpu=x64, then ` +
          `$env:LH_WEB_SERVER='1'; npm run build.`
        phase = 'error'
        return await getStatus()
      }

      mkdirSync(path.join(DATA_ROOT, 'logs'), { recursive: true })
      mkdirSync(DATA_DIR, { recursive: true })
      ensureAuthFile()
      trimLog()

      starting = true
      phase = 'starting'
      lastError = ''
      const selected = await pickPort()
      if (run !== lifecycle) return await getStatus()
      port = selected
      startedAt = new Date().toISOString()
      await launchOn(selected, run)
      return await getStatus()
    } catch (error) {
      lastError = messageOf(error)
      phase = 'error'
      return await getStatus()
    } finally {
      starting = false
      startPromise = null
    }
  })()
  return startPromise
}

async function launchOn(selectedPort, run) {
  const target = serverTarget(selectedPort)
  if (!target) {
    lastError = 'No LearnHarness server entry is available.'
    phase = 'error'
    return null
  }
  const logFd = openSync(LOG_PATH, 'a')
  writeSync(logFd, `\n===== ${new Date().toISOString()} LearnHarness start (${target.kind}) on 127.0.0.1:${selectedPort} =====\n`)
  const baseEnv = childEnvironment(selectedPort)
  const candidates = nodeCandidates()
  const failures = []

  try {
    for (const candidate of candidates) {
      if (!candidate) continue
      if (run !== lifecycle) return null
      const env = { ...baseEnv }
      if (candidate.electron) env.ELECTRON_RUN_AS_NODE = '1'
      else delete env.ELECTRON_RUN_AS_NODE

      let spawnFailure = null
      let spawned = null
      try {
        spawned = spawn(candidate.command, [...candidate.args, ...target.args], {
          cwd: target.cwd,
          env,
          windowsHide: true,
          detached: false,
          stdio: ['ignore', logFd, logFd],
        })
      } catch (error) {
        failures.push(`${candidate.command}: ${messageOf(error)}`)
        continue
      }

      child = spawned
      external = false
      spawned.once('error', error => {
        spawnFailure = error
        failures.push(`${candidate.command}: ${messageOf(error)}`)
      })
      spawned.once('exit', (code, signal) => {
        lastExit = { code, signal, at: new Date().toISOString() }
        if (child === spawned) {
          child = null
          if (phase === 'starting') phase = 'error'
          if (!lastError && !spawnFailure) {
            lastError = `LearnHarness server exited (code=${code ?? 'null'} signal=${signal ?? 'none'}). ${readLogTail(1_400)}`
          }
        }
      })

      const ok = await waitForHealth(selectedPort, START_TIMEOUT, () => spawnFailure ?? (spawned.exitCode !== null ? new Error(`process exited with ${spawned.exitCode}`) : null))
      if (run !== lifecycle) {
        try {
          if (spawned.exitCode === null) spawned.kill()
        } catch {
          /* already gone */
        }
        if (child === spawned) child = null
        return null
      }
      if (ok) {
        phase = 'online'
        lastError = ''
        return spawned
      }

      failures.push(`${candidate.command}: did not become healthy. ${readLogTail(900)}`)
      try {
        if (spawned.exitCode === null) spawned.kill()
      } catch {
        /* already gone */
      }
      if (child === spawned) child = null
      await sleep(350)
    }
  } finally {
    try {
      closeSync(logFd)
    } catch {
      /* the child holds its own duplicate of the descriptor */
    }
  }

  lastError = `LearnHarness did not start. ${failures.filter(Boolean).join(' | ')}`
  phase = 'error'
  return null
}

async function restartServer() {
  if (startPromise) {
    try {
      await startPromise
    } catch {
      /* ensureServer records its own failure */
    }
  }
  if (external) {
    lastError = 'The running LearnHarness server was started outside this plugin; restart is not available here.'
    phase = 'error'
    return
  }
  shutdown()
  await sleep(400)
  lastError = ''
  lastExit = null
  await ensureServer()
}

function shutdown() {
  lifecycle += 1
  startPromise = null
  starting = false
  if (!child) {
    phase = 'idle'
    port = null
    external = false
    return
  }
  if (external) {
    external = false
    port = null
    phase = 'idle'
    return
  }
  const target = child
  child = null
  try {
    target.kill()
  } catch {
    /* the process already ended */
  }
  phase = 'idle'
  port = null
}

async function findRunning() {
  const preferred = configuredPort()
  const ports = [preferred]
  for (let offset = 0; offset < PORT_SPAN; offset += 1) {
    const candidate = DEFAULT_PORT + offset
    if (!ports.includes(candidate)) ports.push(candidate)
  }
  for (const candidate of ports) {
    if (await probeHealth(candidate)) {
      return { port: candidate, external: true }
    }
  }
  return null
}

async function pickPort() {
  const preferred = configuredPort()
  if (await isPortFree(preferred)) return preferred
  for (let offset = 1; offset <= PORT_SPAN; offset += 1) {
    const candidate = DEFAULT_PORT + offset
    if (await isPortFree(candidate)) return candidate
  }
  throw new Error(`No free loopback port between ${DEFAULT_PORT} and ${DEFAULT_PORT + PORT_SPAN}.`)
}

function configuredPort() {
  const raw = process.env.DSH_LEARNHARNESS_PORT
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_PORT
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65_536 ? parsed : DEFAULT_PORT
}

function nodeCandidates() {
  const list = []
  const explicit = process.env.DSH_LEARNHARNESS_NODE
  if (explicit) list.push({ command: explicit, args: [] })
  list.push({ command: 'node', args: [] })
  if (process.versions.electron) {
    list.push({ command: process.execPath, args: [], electron: true })
  } else {
    list.push({ command: process.execPath, args: [] })
  }
  return list
}

function childEnvironment(selectedPort) {
  const env = { ...process.env }
  delete env.NODE_OPTIONS
  delete env.ELECTRON_RUN_AS_NODE
  delete env.LH_DESKTOP_SERVER
  delete env.LH_DESKTOP_API_SECRET
  delete env.PORT
  delete env.HOSTNAME
  env.NODE_ENV = 'production'
  env.NEXT_TELEMETRY_DISABLED = '1'
  env.LH_WEB_SERVER = '1'
  env.PORT = String(selectedPort)
  env.HOSTNAME = '127.0.0.1'
  env.LH_DATA_DIR = DATA_DIR
  env.LH_AUTH_FILE = AUTH_FILE
  return env
}

function waitForHealth(selectedPort, timeoutMs, failure) {
  return new Promise(resolve => {
    const deadline = Date.now() + timeoutMs
    const attempt = async () => {
      if (await probeHealth(selectedPort)) {
        resolve(true)
        return
      }
      const failed = failure()
      if (failed) {
        resolve(false)
        return
      }
      if (Date.now() >= deadline) {
        resolve(false)
        return
      }
      setTimeout(attempt, 600)
    }
    void attempt()
  })
}

function probeHealth(selectedPort) {
  return new Promise(resolve => {
    let settled = false
    const finish = value => {
      if (settled) return
      settled = true
      resolve(value)
    }
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port: selectedPort,
        path: '/api/settings',
        method: 'GET',
        timeout: PROBE_TIMEOUT,
        headers: { accept: 'application/json' },
      },
      response => {
        const chunks = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => {
          if (response.statusCode !== 200) {
            finish(false)
            return
          }
          const body = Buffer.concat(chunks).toString('utf8')
          finish(body.includes('"settings"'))
        })
      },
    )
    request.on('timeout', () => {
      request.destroy()
      finish(false)
    })
    request.on('error', () => finish(false))
    request.end()
  })
}

function isPortFree(selectedPort) {
  return new Promise(resolve => {
    const server = net.createServer()
    server.unref()
    server.once('error', () => resolve(false))
    server.listen(selectedPort, '127.0.0.1', () => {
      server.close(() => resolve(true))
    })
  })
}

function findAppRoot() {
  const explicit = process.env.DSH_LEARNHARNESS_ROOT
  const candidates = [
    explicit,
    path.resolve(PLUGIN_DIR, '..', 'learnharness'),
    path.resolve(PLUGIN_DIR, '..', '..', 'learnharness'),
    path.join(homedir(), 'learnharness'),
    'D:\\Github\\learnharness',
  ].filter(Boolean)

  const built = candidates.find(candidate =>
    existsSync(path.join(candidate, '.next', 'standalone', 'server.js')) ||
    existsSync(path.join(candidate, '.next', 'BUILD_ID')),
  )
  if (built) return path.resolve(built)
  const repo = candidates.find(candidate => existsSync(path.join(candidate, 'package.json')) && existsSync(path.join(candidate, 'next.config.ts')))
  return path.resolve(repo ?? candidates[0] ?? path.resolve(PLUGIN_DIR, '..', 'learnharness'))
}

/** The built app can be served either from its standalone server or by
 *  `next start`. The panel build (LH_WEB_SERVER=1) produces the latter. */
function hasServerBuild() {
  return existsSync(SERVER_ENTRY) || (existsSync(BUILD_ID) && existsSync(NEXT_BIN))
}

function serverTarget(selectedPort) {
  if (existsSync(SERVER_ENTRY)) {
    return { kind: 'standalone', args: [SERVER_ENTRY], cwd: path.dirname(SERVER_ENTRY) }
  }
  if (existsSync(BUILD_ID) && existsSync(NEXT_BIN)) {
    return {
      kind: 'next-start',
      args: [NEXT_BIN, 'start', '-H', '127.0.0.1', '-p', String(selectedPort)],
      cwd: APP_ROOT,
    }
  }
  return null
}

function resolveDataRoot() {
  if (process.env.DSH_LEARNHARNESS_DATA) return path.resolve(process.env.DSH_LEARNHARNESS_DATA)
  const dshHome = process.env.DSH_HOME ? path.resolve(process.env.DSH_HOME) : path.join(homedir(), '.dsh')
  return path.join(dshHome, 'learnharness')
}

function ensureAuthFile() {
  if (existsSync(AUTH_FILE)) return
  writeFileSync(AUTH_FILE, '{}\n', { encoding: 'utf8', mode: 0o600 })
}

function trimLog() {
  try {
    if (statSync(LOG_PATH).size > LOG_LIMIT) writeFileSync(LOG_PATH, '')
  } catch {
    /* no log yet */
  }
}

function readAppVersion() {
  try {
    const raw = JSON.parse(readFileSync(path.join(APP_ROOT, 'package.json'), 'utf8'))
    return typeof raw.version === 'string' ? raw.version : null
  } catch {
    return null
  }
}

function readLogTail(limit) {
  try {
    return readFileSync(LOG_PATH, 'utf8').slice(-limit)
  } catch {
    return ''
  }
}

function messageOf(error) {
  return error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function json(res, status, payload, headOnly = false) {
  if (res.headersSent) return
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.byteLength),
    'cache-control': 'no-store',
  })
  if (headOnly) res.end()
  else res.end(body)
}

function text(res, status, value, headOnly = false) {
  if (res.headersSent) return
  const body = Buffer.from(value, 'utf8')
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': String(body.byteLength),
    'cache-control': 'no-store',
  })
  if (headOnly) res.end()
  else res.end(body)
}
