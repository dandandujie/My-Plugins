import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { inventory, profileDirectory, sourceFiles } from './inventory.js'
import { compareUpstream, resolveTarget, scanPlugins, scanPlugin } from './scan.js'
import { compareVersions } from './registry.js'
import { applyStaged, rollback, stagePlugin } from './repair.js'

const MAX_BODY = 1_000_000

/**
 * Resolve Update Guard's durable directory.
 * @returns {string} absolute directory.
 */
export function guardDataDirectory() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(resolve(home), 'update-guard')
}

/**
 * Project a scan report into a browser-safe shape.
 * @param {Record<string, any> | null} report - internal report.
 * @returns {Record<string, any> | null} public report.
 */
function publicReport(report) {
  if (report === null) return null
  return {
    ...report,
    plugins: report.plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      title: plugin.title,
      version: plugin.version,
      kind: plugin.kind,
      enabled: plugin.enabled,
      fiberPhase: plugin.fiberPhase,
      diagnostic: plugin.diagnostic,
      issues: plugin.issues,
      metrics: plugin.metrics,
      status: plugin.status,
      staged: plugin.staged,
      applied: plugin.applied,
      dualCompatible: plugin.dualCompatible,
      verified: plugin.verified,
      changes: plugin.changes ?? [],
    })),
  }
}

/**
 * Read a JSON file or a default.
 * @param {string} path - file path.
 * @param {any} fallback - default.
 * @returns {any} parsed data.
 */
function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

/**
 * Persist JSON atomically enough for a UI cache.
 * @param {string} path - target path.
 * @param {any} value - value.
 */
function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

/**
 * Build the live guard controller used by routes and tools.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {Record<string, any>} config - row config.
 * @returns {Record<string, any>} controller.
 */
export function createGuard(ctx, config = {}) {
  const effectiveConfig = {
    ...config,
    feedUrl: config.feedUrl ?? (process.platform === 'win32'
      ? 'https://download.deepseek.com/dsh-desk/feeds/win-x64/nightly.yml'
      : undefined),
  }
  const dataDir = guardDataDirectory()
  const cacheDir = join(dataDir, 'cache')
  const backupsDir = join(dataDir, 'backups')
  const reportPath = join(dataDir, 'report.json')
  const appliedPath = join(dataDir, 'applied.json')
  const logs = []
  let busy = false
  let report = readJson(reportPath, null)
  let phase = report === null ? 'idle' : 'ready'
  let lastError = null
  let target = null

  const appendLog = (message) => {
    logs.push({ time: new Date().toISOString(), message })
    if (logs.length > 200) logs.splice(0, logs.length - 200)
  }

  const stagingRoot = (version) => join(dataDir, 'staging', version.replace(/[^0-9A-Za-z._-]/g, '_'))
  const stagingDirFor = (version) => join(stagingRoot(version), 'packages')

  const readStaged = (version) => {
    const dir = stagingDirFor(version)
    if (!existsSync(dir)) return new Map()
    const out = new Map()
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const meta = readJson(join(dir, entry.name, '.update-guard.json'), undefined)
      if (meta !== undefined) out.set(meta.name, meta)
    }
    return out
  }

  const readApplied = () => {
    const rows = readJson(appliedPath, [])
    return Array.isArray(rows) ? rows : []
  }

  const mergeState = (nextReport) => {
    if (nextReport === null) return null
    const staged = readStaged(nextReport.targetVersion)
    const applied = new Map(readApplied().map((row) => [row.name, row]))
    return {
      ...nextReport,
      plugins: nextReport.plugins.map((plugin) => {
        const stage = staged.get(plugin.name)
        const apply = applied.get(plugin.name)
        return {
          ...plugin,
          staged: stage !== undefined,
          applied: apply !== undefined,
          dualCompatible: stage?.dualCompatible ?? false,
          verified: stage?.verified ?? false,
          changes: stage?.changes ?? [],
          stagedAt: stage?.stagedAt,
          appliedAt: apply?.appliedAt,
        }
      }),
    }
  }

  const status = () => ({
    phase,
    currentVersion: report?.currentVersion ?? process.env.DSH_CLIENT_VERSION ?? '0.0.0',
    targetVersion: report?.targetVersion ?? target?.version,
    available: target?.available ?? (report !== null && typeof report.targetVersion === 'string'
      ? compareVersions(report.targetVersion, report.currentVersion) > 0
      : false),
    source: target?.source,
    simulated: target?.simulated ?? false,
    generatedAt: report?.generatedAt,
    summary: report?.summary,
    upstream: report?.upstream,
    plugins: report === null ? [] : publicReport(mergeState(report)).plugins,
    lastError,
    logs: logs.slice(-40),
    paths: { dataDir, cacheDir, backupsDir },
    config: {
      feedUrl: effectiveConfig.feedUrl ?? null,
      targetVersion: effectiveConfig.targetVersion ?? null,
      blockNativeUpdate: effectiveConfig.blockNativeUpdate !== false,
    },
  })

  const scan = async (overrideTarget) => {
    if (busy) throw new Error('Update Guard is already running an operation')
    busy = true
    phase = 'scanning'
    lastError = null
    appendLog('Reading profile inventory and upstream release metadata')
    try {
      const current = process.env.DSH_CLIENT_VERSION ?? '0.0.0'
      const effective = overrideTarget === undefined ? effectiveConfig : { ...effectiveConfig, targetVersion: overrideTarget }
      target = await resolveTarget(effective, current)
      appendLog(`Target release ${target.version} resolved from ${target.source}`)
      const upstream = await compareUpstream(current, target.version)
      appendLog(upstream.ok
        ? `Upstream compare: ${upstream.commits} commits, ${upstream.changedPackages.length} changed package groups`
        : `Upstream compare unavailable: ${upstream.error}`)
      const plugins = (await inventory(profileDirectory(), ctx.get('pluginManager')))
        .filter((plugin) => plugin.name !== '@local/dsh-update-guard')
        .filter((plugin) => !Array.isArray(effectiveConfig.excludePlugins) || !effectiveConfig.excludePlugins.includes(plugin.name))
      appendLog(`Inspecting ${plugins.length} installed plugin package(s)`)
      const next = await scanPlugins({
        plugins,
        currentVersion: current,
        targetVersion: target.version,
        cacheDir,
        upstream,
      })
      report = mergeState(next) ?? next
      writeJson(reportPath, publicReport(report))
      writeJson(join(dataDir, 'target.json'), target)
      phase = 'ready'
      appendLog(`Scan finished: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s)`)
      return publicReport(report)
    } catch (error) {
      phase = 'error'
      lastError = error instanceof Error ? error.message : String(error)
      appendLog(`Scan failed: ${lastError}`)
      throw error
    } finally {
      busy = false
    }
  }

  const stage = async (names) => {
    if (busy) throw new Error('Update Guard is already running an operation')
    if (report === null) throw new Error('Run a scan before staging repairs')
    let selected = names === undefined || names.length === 0
      ? report.plugins
      : report.plugins.filter((plugin) => names.includes(plugin.name))
    if (selected.some((plugin) => !Array.isArray(plugin.source) || typeof plugin.directory !== 'string')) {
      await scan()
      selected = names === undefined || names.length === 0
        ? report.plugins
        : report.plugins.filter((plugin) => names.includes(plugin.name))
    }
    if (selected.length === 0) throw new Error('No matching plugins to stage')
    busy = true
    phase = 'staging'
    lastError = null
    try {
      const metas = []
      for (const plugin of selected) {
        appendLog(`Staging ${plugin.name}`)
        metas.push(await stagePlugin(plugin, plugin, {
          targetVersion: report.targetVersion,
          stagingDir: stagingDirFor(report.targetVersion),
          renames: effectiveConfig.renames ?? {},
          cacheDir,
        }))
      }
      report = mergeState(report)
      writeJson(reportPath, publicReport(report))
      phase = 'ready'
      appendLog(`Staged ${metas.length} plugin package(s)`)
      return metas
    } catch (error) {
      phase = 'error'
      lastError = error instanceof Error ? error.message : String(error)
      appendLog(`Staging failed: ${lastError}`)
      throw error
    } finally {
      busy = false
    }
  }

  const apply = async (names) => {
    if (busy) throw new Error('Update Guard is already running an operation')
    if (report === null) throw new Error('Run a scan before applying repairs')
    const staged = readStaged(report.targetVersion)
    const wanted = names === undefined || names.length === 0 ? [...staged.keys()] : names
    const records = []
    const blockers = []
    busy = true
    phase = 'applying'
    lastError = null
    try {
      for (const name of wanted) {
        const meta = staged.get(name)
        if (meta === undefined) {
          blockers.push(`${name}: no staged repair`)
          continue
        }
        if (!meta.verified) {
          blockers.push(`${name}: staged repair did not pass verification`)
          continue
        }
        if (!meta.dualCompatible) {
          blockers.push(`${name}: repair is not dual-runtime safe; it is staged but cannot be installed before the update`)
          continue
        }
        appendLog(`Applying ${name} from ${meta.stagingDirectory}`)
        records.push(applyStaged(meta, backupsDir))
      }
      if (records.length > 0) {
        const existing = readApplied().filter((row) => !records.some((record) => record.name === row.name))
        writeJson(appliedPath, [...existing, ...records])
        report = mergeState(report)
        writeJson(reportPath, publicReport(report))
      }
      phase = 'ready'
      appendLog(`Applied ${records.length} package(s); ${blockers.length} blocker(s)`)
      return { records, blockers }
    } catch (error) {
      phase = 'error'
      lastError = error instanceof Error ? error.message : String(error)
      appendLog(`Apply failed: ${lastError}`)
      throw error
    } finally {
      busy = false
    }
  }

  const undo = async (names) => {
    if (busy) throw new Error('Update Guard is already running an operation')
    busy = true
    phase = 'rolling-back'
    lastError = null
    try {
      const applied = readApplied()
      const selected = names === undefined || names.length === 0
        ? applied
        : applied.filter((row) => names.includes(row.name))
      const restored = []
      for (const record of selected) {
        appendLog(`Restoring ${record.name}`)
        rollback(record)
        restored.push(record.name)
      }
      writeJson(appliedPath, applied.filter((row) => !restored.includes(row.name)))
      if (report !== null) {
        report = mergeState(report)
        writeJson(reportPath, publicReport(report))
      }
      phase = 'ready'
      appendLog(`Restored ${restored.length} package(s)`)
      return { restored }
    } catch (error) {
      phase = 'error'
      lastError = error instanceof Error ? error.message : String(error)
      appendLog(`Rollback failed: ${lastError}`)
      throw error
    } finally {
      busy = false
    }
  }

  const verify = async (names) => {
    if (busy) throw new Error('Update Guard is already running an operation')
    if (report === null) throw new Error('Run a scan before verifying repairs')
    const staged = readStaged(report.targetVersion)
    const selected = names === undefined || names.length === 0
      ? [...staged.keys()]
      : names.filter((name) => staged.has(name))
    if (selected.length === 0) throw new Error('No staged repair to verify')
    busy = true
    phase = 'verifying'
    lastError = null
    try {
      const results = []
      for (const name of selected) {
        const meta = staged.get(name)
        const manifest = readJson(join(meta.stagingDirectory, 'package.json'), undefined)
        if (manifest === undefined) throw new Error(`Staged package manifest is missing for ${name}`)
        const source = sourceFiles(meta.stagingDirectory)
        const row = await scanPlugin({
          name,
          id: name,
          title: meta.title,
          version: meta.version,
          kind: manifest.dsh?.bundle !== undefined && manifest.dsh?.client !== undefined
            ? 'host+client'
            : manifest.dsh?.bundle !== undefined ? 'host' : 'client',
          enabled: true,
          directory: meta.stagingDirectory,
          manifest,
          clientInject: Array.isArray(manifest.dsh?.client?.inject) ? manifest.dsh.client.inject : [],
          source,
        }, {
          targetVersion: report.targetVersion,
          cacheDir,
          changedPackages: [],
          targetServices: new Set(),
          slotCache: new Map(),
        })
        const errors = row.issues.filter((issue) => issue.severity === 'error')
        meta.verified = errors.length === 0
        meta.errors = errors.map((issue) => issue.title)
        writeJson(join(meta.stagingDirectory, '.update-guard.json'), meta)
        results.push(meta)
      }
      report = mergeState(report)
      writeJson(reportPath, publicReport(report))
      phase = 'ready'
      appendLog(`Verified ${results.length} staged package(s)`)
      return results
    } catch (error) {
      phase = 'error'
      lastError = error instanceof Error ? error.message : String(error)
      appendLog(`Verification failed: ${lastError}`)
      throw error
    } finally {
      busy = false
    }
  }

  const prepare = async (names) => {
    if (report === null) await scan()
    const staged = readStaged(report.targetVersion)
    const selected = names === undefined || names.length === 0 ? report.plugins : report.plugins.filter((plugin) => names.includes(plugin.name))
    const blockers = []
    for (const plugin of selected) {
      const meta = staged.get(plugin.name)
      const hasErrors = plugin.issues.some((issue) => issue.severity === 'error')
      if (meta === undefined) {
        if (hasErrors) blockers.push(`${plugin.title}: unresolved compatibility error`)
        continue
      }
      if (!meta.verified) blockers.push(`${plugin.title}: staged repair failed verification`)
      else if (!meta.dualCompatible) blockers.push(`${plugin.title}: repair needs the target runtime and cannot be pre-installed`)
    }
    return {
      ok: blockers.length === 0,
      blockers,
      targetVersion: report.targetVersion,
      staged: [...staged.keys()],
    }
  }

  return {
    dataDir,
    cacheDir,
    backupsDir,
    status,
    scan,
    stage,
    apply,
    verify,
    rollback: undo,
    prepare,
    getReport: () => publicReport(mergeState(report)),
  }
}

/**
 * Parse a small JSON request body.
 * @param {import('node:http').IncomingMessage} request - request stream.
 * @returns {Promise<Record<string, any>>} parsed body.
 */
export async function readBody(request) {
  const chunks = []
  let total = 0
  for await (const chunk of request) {
    total += chunk.length
    if (total > MAX_BODY) throw new Error('Request body is too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    throw new Error('Request body must be a JSON object')
  }
}
