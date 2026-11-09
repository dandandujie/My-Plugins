import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

/**
 * Read a JSON file, returning undefined for a missing or malformed file.
 * @param {string} path - file path.
 * @returns {any | undefined} parsed data.
 */
export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * Resolve the active profile directory.
 * @returns {string} absolute profile directory.
 */
export function profileDirectory() {
  if (process.env.DSH_PROFILE_DIR) return resolve(process.env.DSH_PROFILE_DIR)
  return join(homedir(), '.dsh', 'profiles', process.env.DSH_PROFILE ?? 'desktop')
}

/**
 * Read the current desktop/runtime version.
 * @param {string} profile - profile directory.
 * @returns {string} version string.
 */
export function currentVersion(profile = profileDirectory()) {
  if (process.env.DSH_CLIENT_VERSION) return process.env.DSH_CLIENT_VERSION
  const candidates = [
    join(profile, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'),
    join(dirname(process.execPath), '..', 'resources', 'app.asar', 'dsh', 'package.json'),
  ]
  for (const candidate of candidates) {
    const data = readJson(candidate)
    if (typeof data?.version === 'string') return data.version
  }
  return '0.0.0'
}

/**
 * Locate one installed package directory through the profile's node_modules.
 * @param {string} profile - profile directory.
 * @param {string} name - package name.
 * @returns {string | undefined} real path.
 */
function packageDirectory(profile, name) {
  const candidate = join(profile, 'node_modules', ...name.split('/'))
  try {
    if (!existsSync(candidate)) return undefined
    const real = realpathSync(candidate)
    if (!statSync(real).isDirectory()) return undefined
    return real
  } catch {
    return undefined
  }
}

/**
 * Read one package's display title from its locale metadata.
 * @param {string} directory - package directory.
 * @param {Record<string, any>} manifest - package manifest.
 * @returns {string} title.
 */
function displayTitle(directory, manifest) {
  for (const locale of ['zh', 'en']) {
    const data = readJson(join(directory, 'locale', `${locale}.json`))
    const title = data?.meta?.title
    if (typeof title === 'string' && title.trim() !== '') return title.trim()
  }
  if (typeof manifest.description === 'string' && manifest.description.trim() !== '') {
    return manifest.description.trim()
  }
  return manifest.name
}

/**
 * List source files that can be statically inspected.
 * @param {string} root - package directory.
 * @returns {Array<{ path: string, relative: string, size: number }>} files.
 */
export function sourceFiles(root) {
  const out = []
  const visit = (directory, depth) => {
    if (depth > 6 || out.length >= 400) return
    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (out.length >= 400) return
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.update-guard') continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        visit(path, depth + 1)
        continue
      }
      if (!entry.isFile()) continue
      if (!/\.(?:js|mjs|cjs|ts|tsx|mts|cts)$/.test(entry.name)) continue
      if (entry.name.endsWith('.d.ts')) continue
      try {
        const stat = statSync(path)
        if (stat.size > 1_500_000) continue
        out.push({ path, relative: path.slice(root.length + 1).replaceAll('\\', '/'), size: stat.size })
      } catch {
        // A file may disappear while a plugin is being updated.
      }
    }
  }
  visit(root, 0)
  return out
}

/**
 * Resolve the profile's installed bundles and their plugin rows.
 * The profile manifest is the durable inventory; plugin manager supplies live state.
 * @param {string} profile - profile directory.
 * @param {Record<string, any> | undefined} pluginManager - optional live manager service.
 * @returns {Promise<Array<Record<string, any>>>} plugin inventory.
 */
export async function inventory(profile = profileDirectory(), pluginManager) {
  const manifest = readJson(join(profile, 'package.json')) ?? {}
  const names = new Set()
  for (const name of Object.keys(manifest.dependencies ?? {})) names.add(name)
  for (const name of manifest.dsh?.profile?.bundles ?? []) names.add(name)
  const localRoot = join(profile, 'node_modules')
  for (const scope of ['@local', '@deepseek-ai']) {
    const directory = join(localRoot, scope)
    if (!existsSync(directory)) continue
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() || entry.isSymbolicLink()) names.add(`${scope}/${entry.name}`)
    }
  }

  let live = []
  if (pluginManager !== undefined) {
    try {
      live = await pluginManager.listPlugins()
    } catch {
      live = []
    }
  }
  const liveByModule = new Map()
  for (const row of live) {
    if (typeof row?.moduleName !== 'string') continue
    liveByModule.set(row.moduleName, row)
  }

  const plugins = []
  for (const name of names) {
    const directory = packageDirectory(profile, name)
    if (directory === undefined) continue
    const pluginManifest = readJson(join(directory, 'package.json'))
    if (pluginManifest === undefined) continue
    const dsh = pluginManifest.dsh
    if (dsh?.bundle === undefined && dsh?.client === undefined) continue
    const row = liveByModule.get(name)
    const source = sourceFiles(directory)
    plugins.push({
      id: name,
      name,
      title: displayTitle(directory, pluginManifest),
      version: typeof pluginManifest.version === 'string' ? pluginManifest.version : '0.0.0',
      description: typeof pluginManifest.description === 'string' ? pluginManifest.description : '',
      directory,
      manifest: pluginManifest,
      kind: dsh?.bundle !== undefined && dsh?.client !== undefined
        ? 'host+client'
        : dsh?.bundle !== undefined ? 'host' : 'client',
      enabled: row?.enabled ?? true,
      fiberPhase: row?.fiberPhase ?? 'active',
      diagnostic: row?.diagnostic,
      patchId: row?.patchId,
      source,
      clientInject: Array.isArray(dsh?.client?.inject) ? dsh.client.inject : [],
    })
  }
  plugins.sort((a, b) => a.name.localeCompare(b.name))
  return plugins
}

/**
 * A filesystem-safe token for one package name.
 * @param {string} name - package name.
 * @returns {string} safe token.
 */
export function safeName(name) {
  return name.replace(/^@/, '').replaceAll('/', '__').replace(/[^0-9A-Za-z._-]/g, '_')
}

/**
 * Read the bundle names listed by the profile manifest.
 * @param {string} profile - profile directory.
 * @returns {string[]} bundle package names.
 */
export function profileBundles(profile = profileDirectory()) {
  const manifest = readJson(join(profile, 'package.json')) ?? {}
  return Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles : []
}

/**
 * Locate a package's real directory without requiring it to be a plugin.
 * @param {string} name - package name.
 * @param {string} profile - profile directory.
 * @returns {string | undefined} real path.
 */
export function locatePackage(name, profile = profileDirectory()) {
  return packageDirectory(profile, name)
}

/**
 * Derive a likely npm package name from one changed upstream path.
 * @param {string} path - repository-relative path.
 * @returns {string | undefined} package guess.
 */
export function packageGuess(path) {
  const parts = path.split('/')
  if (parts[0] === 'packages') {
    if (parts.length < 3) return undefined
    const folder = parts[1] === 'client' && parts.length > 3 ? parts[2] : parts[1]
    if (folder.startsWith('dsh-')) return `@deepseek-ai/${folder}`
    return folder
  }
  if (parts[0] === 'apps' && parts.length > 2) return `app:${parts[1]}`
  return undefined
}

/**
 * Human-readable directory label.
 * @param {string} path - directory.
 * @returns {string} label.
 */
export function directoryLabel(path) {
  return basename(path)
}
