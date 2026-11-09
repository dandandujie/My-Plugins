import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, relative } from 'node:path'
import { packageManifest, targetVersionOf } from './registry.js'
import { safeName } from './inventory.js'
import { scanPlugin } from './scan.js'

/**
 * Hash every source file under a package directory.
 * @param {string} directory - package root.
 * @returns {Map<string, string>} relative path to digest.
 */
export function sourceHashes(directory) {
  const hashes = new Map()
  const visit = (current) => {
    let entries
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.update-guard' || entry.name === 'versions') continue
      const path = join(current, entry.name)
      if (entry.isDirectory()) {
        visit(path)
        continue
      }
      if (!/\.(?:js|mjs|cjs)$/.test(entry.name)) continue
      try {
        hashes.set(relative(directory, path).replaceAll('\\', '/'), createHash('sha1').update(readFileSync(path)).digest('hex'))
      } catch {
        // Ignore files being replaced.
      }
    }
  }
  visit(directory)
  return hashes
}

/**
 * Replace a module specifier in source text.
 * @param {string} text - source.
 * @param {Record<string, string>} imports - specifier mapping.
 * @returns {string} rewritten source.
 */
function rewriteImports(text, imports) {
  let next = text
  for (const [from, to] of Object.entries(imports ?? {})) {
    if (typeof to !== 'string') continue
    next = next.replaceAll(`'${from}'`, `'${to}'`).replaceAll(`"${from}"`, `"${to}"`)
    next = next.replaceAll(`\`${from}\``, `\`${to}\``)
  }
  return next
}

/**
 * Apply configured slot and service renames to source text.
 * @param {string} text - source.
 * @param {Record<string, any>} renames - rename table.
 * @returns {string} rewritten source.
 */
function rewriteNames(text, renames) {
  let next = text
  for (const [from, to] of Object.entries(renames?.slots ?? {})) {
    if (typeof to !== 'string' || from === to) continue
    next = next.replaceAll(`'${from}'`, `'${to}'`).replaceAll(`"${from}"`, `"${to}"`)
    next = next.replaceAll(`\`${from}\``, `\`${to}\``)
  }
  for (const [from, to] of Object.entries(renames?.services ?? {})) {
    if (typeof to !== 'string' || from === to) continue
    const pattern = new RegExp(`\\bctx\\.${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
    next = next.replace(pattern, `ctx.${to}`)
    next = next.replaceAll(`ctx.get('${from}')`, `ctx.get('${to}')`).replaceAll(`ctx.get("${from}")`, `ctx.get("${to}")`)
  }
  return next
}

/**
 * Rewrite one package manifest for the target release.
 * @param {Record<string, any>} manifest - live manifest.
 * @param {string} targetVersion - target release.
 * @param {Record<string, any>} renames - package rename table.
 * @returns {Promise<{ manifest: Record<string, any>, changes: string[], unresolved: string[] }>} rewrite result.
 */
async function rewriteManifest(manifest, targetVersion, renames) {
  const next = structuredClone(manifest)
  const changes = []
  const unresolved = []
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    const dependencies = next[section]
    if (dependencies === undefined || dependencies === null || typeof dependencies !== 'object') continue
    for (const [name, range] of Object.entries(dependencies)) {
      if (!name.startsWith('@deepseek-ai/')) continue
      let target
      try {
        target = await targetVersionOf(name, targetVersion)
        await packageManifest(name, target)
      } catch {
        unresolved.push(`${name} is not published for ${targetVersion}`)
        continue
      }
      if (String(range).includes(target)) continue
      dependencies[name] = `^${target}`
      changes.push(`${section}.${name}: ${String(range)} -> ^${target}`)
    }
  }
  const inject = next.dsh?.client?.inject
  if (Array.isArray(inject)) {
    next.dsh.client.inject = inject.map((name) => {
      if (typeof name !== 'string') return name
      const mapped = renames?.packages?.[name]
      if (typeof mapped === 'string') {
        changes.push(`dsh.client.inject: ${name} -> ${mapped}`)
        return mapped
      }
      return name
    })
  }
  return { manifest: next, changes, unresolved }
}

/**
 * Copy a plugin directory without its dependency or version trees.
 * @param {string} from - source directory.
 * @param {string} to - destination directory.
 */
function copyPlugin(from, to) {
  cpSync(from, to, {
    recursive: true,
    force: true,
    filter: (path) => {
      const name = path.split(/[\\/]/).pop() ?? ''
      return name !== 'node_modules' && name !== '.git' && name !== '.update-guard' && name !== 'versions'
    },
  })
}

/**
 * Write a host-side dual-runtime facade around two package versions.
 * The wrapper tries the patched implementation first and falls back to the
 * original on import or synchronous apply failure. That makes the facade safe
 * to install before the desktop update actually runs.
 * @param {string} root - staging package root.
 * @param {string} original - copy of the live package.
 * @param {string} patched - repaired package.
 * @returns {boolean} whether a facade was written.
 */
function writeHostFacade(root, original, patched) {
  const packageJson = join(root, 'package.json')
  const manifest = JSON.parse(readFileSync(packageJson, 'utf8'))
  const hasClient = existsSync(join(root, 'client.js'))
  const snapshot = `${root}.ug-patched-snapshot`
  rmSync(snapshot, { recursive: true, force: true })
  cpSync(root, snapshot, { recursive: true, force: true })
  rmSync(join(root, 'versions'), { recursive: true, force: true })
  mkdirSync(join(root, 'versions'), { recursive: true })
  cpSync(original, join(root, 'versions', 'original'), { recursive: true, force: true })
  cpSync(snapshot, join(root, 'versions', 'patched'), { recursive: true, force: true })
  rmSync(snapshot, { recursive: true, force: true })
  manifest.exports = {
    ...(manifest.exports ?? {}),
    '.': './index.js',
    ...(hasClient ? { './client': './client.js' } : {}),
  }
  delete manifest.main
  writeFileSync(packageJson, `${JSON.stringify(manifest, null, 2)}\n`)
  const wrapper = `/**
 * Generated by Update Guard. The patched implementation is tried first and the
 * original implementation remains the fallback, so this package stays usable
 * on both the current and the target Harness release.
 */
const implementations = await Promise.all([
  import(new URL('./versions/patched/index.js', import.meta.url).href).catch(() => undefined),
  import(new URL('./versions/original/index.js', import.meta.url).href).catch(() => undefined),
])
const available = implementations.filter((module) => module !== undefined)

export const inject = []

export function apply(ctx, config) {
  let lastError
  const attempt = (index, target) => {
    const module = available[index]
    if (module === undefined) throw lastError ?? new Error('Update Guard facade: no implementation could start')
    const start = (targetContext = target) => {
      const result = module.apply(targetContext, config)
      if (result !== undefined && typeof result.then === 'function') {
        return result.catch((error) => {
          lastError = error
          return attempt(index + 1, targetContext)
        })
      }
      return result
    }
    try {
      if (Array.isArray(module.inject) && module.inject.length > 0) {
        target.inject(module.inject, (child) => {
          try {
            return start(child)
          } catch (error) {
            lastError = error
            return attempt(index + 1, child)
          }
        })
      } else {
        return start()
      }
    } catch (error) {
      lastError = error
      return attempt(index + 1, target)
    }
  }
  return attempt(0, ctx)
}
`
  writeFileSync(join(root, 'index.js'), wrapper)
  return true
}

/**
 * Stage one repaired plugin without touching the live directory.
 * @param {Record<string, any>} plugin - inventory row.
 * @param {Record<string, any>} reportRow - scan row.
 * @param {object} options - staging options.
 * @param {string} options.targetVersion - target release.
 * @param {string} options.stagingDir - staging root.
 * @param {Record<string, any>} options.renames - rename table.
 * @param {string} options.cacheDir - package cache.
 * @returns {Promise<Record<string, any>>} staged metadata.
 */
export async function stagePlugin(plugin, reportRow, options) {
  const root = join(options.stagingDir, safeName(plugin.name))
  rmSync(root, { recursive: true, force: true })
  mkdirSync(root, { recursive: true })
  copyPlugin(plugin.directory, root)
  const originalDir = join(options.stagingDir, '.original', safeName(plugin.name))
  rmSync(originalDir, { recursive: true, force: true })
  mkdirSync(originalDir, { recursive: true })
  copyPlugin(plugin.directory, originalDir)

  const manifestPath = join(root, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const rewritten = await rewriteManifest(manifest, options.targetVersion, options.renames)
  if (JSON.stringify(rewritten.manifest) !== JSON.stringify(manifest)) {
    writeFileSync(manifestPath, `${JSON.stringify(rewritten.manifest, null, 2)}\n`)
  }

  const changedFiles = []
  const visit = (directory) => {
    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        visit(path)
        continue
      }
      if (!/\.(?:js|mjs|cjs)$/.test(entry.name)) continue
      let text
      try {
        text = readFileSync(path, 'utf8')
      } catch {
        continue
      }
      const next = rewriteImports(rewriteNames(text, options.renames), options.renames?.imports)
      if (next !== text) {
        writeFileSync(path, next)
        changedFiles.push(relative(root, path).replaceAll('\\', '/'))
      }
    }
  }
  visit(root)

  const before = sourceHashes(originalDir)
  const after = sourceHashes(root)
  const sourceChanged = [...after].some(([path, hash]) => before.get(path) !== hash) ||
    [...before.keys()].some((path) => !after.has(path))
  const clientChanged = changedFiles.some((path) => path === 'client.js' || path.startsWith('client/'))
  let facade = false
  if (sourceChanged && !clientChanged && existsSync(join(root, 'index.js'))) {
    facade = writeHostFacade(root, originalDir, root)
  }

  const stagedPlugin = {
    ...plugin,
    directory: root,
    manifest: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')),
    source: plugin.source.map((file) => ({ ...file, path: join(root, file.relative) })),
  }
  if (facade) {
    for (const relativePath of changedFiles) {
      stagedPlugin.source.push({
        path: join(root, 'versions', 'patched', relativePath),
        relative: `versions/patched/${relativePath}`,
        size: 0,
      })
    }
  }
  const verifyRow = await scanPlugin(stagedPlugin, {
    targetVersion: options.targetVersion,
    cacheDir: options.cacheDir,
    changedPackages: [],
    targetServices: new Set(),
    slotCache: new Map(),
  })
  const errors = verifyRow.issues.filter((issue) => issue.severity === 'error')
  const meta = {
    name: plugin.name,
    title: plugin.title,
    targetVersion: options.targetVersion,
    sourceDirectory: plugin.directory,
    stagingDirectory: root,
    stagedAt: new Date().toISOString(),
    changes: rewritten.changes,
    unresolved: rewritten.unresolved,
    changedFiles,
    sourceChanged,
    facade,
    dualCompatible: !sourceChanged || facade,
    verified: errors.length === 0,
    errors: errors.map((issue) => issue.title),
    reportStatus: reportRow.status,
  }
  writeFileSync(join(root, '.update-guard.json'), `${JSON.stringify(meta, null, 2)}\n`)
  return meta
}

/**
 * Apply one staged package over its live directory after a backup.
 * @param {Record<string, any>} meta - staged metadata.
 * @param {string} backupDir - backup root.
 * @returns {Record<string, any>} backup metadata.
 */
export function applyStaged(meta, backupDir) {
  if (!existsSync(meta.stagingDirectory)) throw new Error(`Staging directory is missing for ${meta.name}`)
  if (!existsSync(meta.sourceDirectory)) throw new Error(`Live plugin directory is missing for ${meta.name}`)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = join(backupDir, `${safeName(meta.name)}-${stamp}`)
  mkdirSync(backup, { recursive: true })
  cpSync(meta.sourceDirectory, backup, {
    recursive: true,
    force: true,
    filter: (path) => {
      const name = path.split(/[\\/]/).pop() ?? ''
      return name !== 'node_modules' && name !== '.git'
    },
  })
  const staged = JSON.parse(readFileSync(join(meta.stagingDirectory, 'package.json'), 'utf8'))
  cpSync(meta.stagingDirectory, meta.sourceDirectory, {
    recursive: true,
    force: true,
    filter: (path) => !path.endsWith('.update-guard.json'),
  })
  const record = {
    name: meta.name,
    appliedAt: new Date().toISOString(),
    backup,
    sourceDirectory: meta.sourceDirectory,
    version: staged.version,
    targetVersion: meta.targetVersion,
    dualCompatible: meta.dualCompatible,
    facade: meta.facade,
  }
  writeFileSync(join(backupDir, `${safeName(meta.name)}.json`), `${JSON.stringify(record, null, 2)}\n`)
  return record
}

/**
 * Restore one recorded backup over the live plugin directory.
 * @param {Record<string, any>} record - backup record.
 */
export function rollback(record) {
  if (!existsSync(record.backup)) throw new Error(`Backup is missing for ${record.name}`)
  rmSync(record.sourceDirectory, { recursive: true, force: true })
  cpSync(record.backup, record.sourceDirectory, { recursive: true, force: true })
}

/**
 * Move a staged directory into place, keeping the old one under .update-guard.
 * Used by tests and future atomic handoff paths.
 * @param {string} staged - staged directory.
 * @param {string} live - live directory.
 */
export function swapDirectory(staged, live) {
  const retired = `${live}.update-guard-old`
  rmSync(retired, { recursive: true, force: true })
  renameSync(live, retired)
  renameSync(staged, live)
}
