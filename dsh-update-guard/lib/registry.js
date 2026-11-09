import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { readTarball } from './tar.js'

const REGISTRY = 'https://registry.npmjs.org'
const USER_AGENT = 'dsh-update-guard/0.1'

/**
 * Fetch a URL with a bounded deadline.
 * @param {string} url - absolute URL.
 * @param {{ timeoutMs?: number, headers?: Record<string, string> }} [options] - request options.
 * @returns {Promise<Response>} response.
 */
export async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/json, text/plain, */*', ...options.headers },
    signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
    redirect: 'follow',
  })
  return response
}

/**
 * Fetch a text document.
 * @param {string} url - absolute URL.
 * @param {number} [timeoutMs] - deadline.
 * @returns {Promise<string>} body.
 */
export async function fetchText(url, timeoutMs = 20_000) {
  const response = await request(url, { timeoutMs })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return await response.text()
}

/**
 * Fetch and parse JSON.
 * @param {string} url - absolute URL.
 * @param {number} [timeoutMs] - deadline.
 * @returns {Promise<any>} parsed body.
 */
export async function fetchJson(url, timeoutMs = 20_000) {
  const text = await fetchText(url, timeoutMs)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from ${url}`)
  }
}

/**
 * Build the registry packument URL for a package name.
 * @param {string} name - npm package name.
 * @returns {string} URL.
 */
function packumentUrl(name) {
  return `${REGISTRY}/${name.startsWith('@') ? name.replace('/', '%2F') : encodeURIComponent(name)}`
}

const packuments = new Map()

/**
 * Read one package packument, cached for this process.
 * @param {string} name - npm package name.
 * @returns {Promise<any>} packument.
 */
export async function packument(name) {
  let hit = packuments.get(name)
  if (hit === undefined) {
    hit = fetchJson(packumentUrl(name), 25_000)
    packuments.set(name, hit)
  }
  return await hit
}

/**
 * Resolve one exact version manifest.
 * @param {string} name - npm package name.
 * @param {string | undefined} version - exact version; omitted means dist-tags.latest.
 * @returns {Promise<Record<string, any>>} manifest.
 */
export async function packageManifest(name, version) {
  const doc = await packument(name)
  const resolved = version ?? doc['dist-tags']?.latest
  if (typeof resolved !== 'string') throw new Error(`No version for ${name}`)
  const manifest = doc.versions?.[resolved]
  if (manifest === undefined) throw new Error(`${name}@${resolved} is not published`)
  return manifest
}

/**
 * Return the version this target release pins for one package.
 * DSH packages move with the release; infrastructure packages keep their own latest.
 * @param {string} name - package name.
 * @param {string} targetVersion - DSH release.
 * @returns {Promise<string>} version.
 */
export async function targetVersionOf(name, targetVersion) {
  if (name.startsWith('@deepseek-ai/dsh')) return targetVersion
  const doc = await packument(name)
  const latest = doc['dist-tags']?.latest
  if (typeof latest !== 'string') throw new Error(`No latest version for ${name}`)
  return latest
}

/**
 * Compare two semver strings, including prerelease identifiers.
 * @param {string} left - left version.
 * @param {string} right - right version.
 * @returns {number} negative, zero, or positive.
 */
export function compareVersions(left, right) {
  const parse = (value) => {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(value).trim())
    if (match === null) return undefined
    return {
      numbers: [Number(match[1]), Number(match[2]), Number(match[3])],
      pre: match[4] === undefined ? [] : match[4].split('.'),
    }
  }
  const a = parse(left)
  const b = parse(right)
  if (a === undefined || b === undefined) return String(left).localeCompare(String(right))
  for (let index = 0; index < 3; index += 1) {
    if (a.numbers[index] !== b.numbers[index]) return a.numbers[index] - b.numbers[index]
  }
  if (a.pre.length === 0 && b.pre.length === 0) return 0
  if (a.pre.length === 0) return 1
  if (b.pre.length === 0) return -1
  for (let index = 0; index < Math.max(a.pre.length, b.pre.length); index += 1) {
    const x = a.pre[index]
    const y = b.pre[index]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x === y) continue
    const nx = /^\d+$/.test(x)
    const ny = /^\d+$/.test(y)
    if (nx && ny) return Number(x) - Number(y)
    if (nx) return -1
    if (ny) return 1
    return x.localeCompare(y)
  }
  return 0
}

/**
 * Whether a dependency range can accept a target version.
 * The checker deliberately treats file/link/workspace specs as already covered:
 * they are resolved by the user's package manager, not by the target release.
 * @param {string} range - declared range.
 * @param {string} target - candidate version.
 * @returns {boolean | undefined} true/false, or undefined for an unparsable range.
 */
export function rangeCovers(range, target) {
  const text = String(range ?? '').trim()
  if (text === '' || text === '*' || text === 'latest' || text === 'x') return true
  if (text === target) return true
  if (/^(?:link|file|workspace|portal|git\+|https?:)/i.test(text)) return true
  const normalized = text.replace(/^[\^~]/, '')
  const base = /^v?(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?/.exec(normalized)
  if (base === null) return undefined
  const comparison = compareVersions(target, `${base[1]}.${base[2]}.${base[3]}`)
  if (comparison < 0) return false
  if (text.startsWith('^')) {
    if (Number(base[1]) > 0) return target.split('.')[0] === base[1]
    if (Number(base[2]) > 0) return target.split('.')[1] === base[2]
    return false
  }
  if (text.startsWith('~')) {
    const [major, minor] = target.split('.')
    return major === base[1] && minor === base[2]
  }
  if (text.startsWith('>=')) return true
  return compareVersions(target, normalized) === 0
}

/**
 * Download and cache one package tarball, then index its files.
 * @param {string} name - package name.
 * @param {string} version - exact version.
 * @param {string} cacheDir - owned cache directory.
 * @returns {Promise<{ files: Map<string, Buffer>, manifest: Record<string, any> }>} tarball data.
 */
export async function packageFiles(name, version, cacheDir) {
  mkdirSync(cacheDir, { recursive: true })
  const digest = createHash('sha1').update(`${name}@${version}`).digest('hex').slice(0, 12)
  const cachePath = join(cacheDir, `${digest}.tgz`)
  let bytes
  if (existsSync(cachePath)) {
    bytes = readFileSync(cachePath)
  } else {
    const manifest = await packageManifest(name, version)
    const tarball = manifest.dist?.tarball
    if (typeof tarball !== 'string') throw new Error(`No tarball for ${name}@${version}`)
    const response = await request(tarball, { timeoutMs: 45_000 })
    if (!response.ok) throw new Error(`Tarball ${response.status}: ${name}@${version}`)
    bytes = Buffer.from(await response.arrayBuffer())
    writeFileSync(cachePath, bytes)
  }
  const files = readTarball(bytes)
  const manifest = await packageManifest(name, version)
  return { files, manifest }
}

/**
 * Rewrite one tarball path relative to a declared export subpath.
 * @param {Record<string, any>} manifest - package manifest.
 * @param {string} subpath - './x' or '.'.
 * @returns {string | undefined} relative target path.
 */
export function exportTarget(manifest, subpath) {
  const exportsField = manifest.exports
  if (exportsField === undefined || exportsField === null) return subpath === '.' ? manifest.main ?? 'index.js' : subpath.replace(/^\.\//, '')
  if (typeof exportsField === 'string') return subpath === '.' ? exportsField : undefined
  if (Array.isArray(exportsField)) return subpath === '.' ? String(exportsField[0]) : undefined
  const exact = exportsField[subpath]
  if (typeof exact === 'string') return exact
  if (exact !== null && typeof exact === 'object') {
    for (const key of ['import', 'node', 'default', 'require']) {
      if (typeof exact[key] === 'string') return exact[key]
    }
  }
  for (const [key, value] of Object.entries(exportsField)) {
    if (!key.includes('*')) continue
    const [before, after] = key.split('*')
    if (!subpath.startsWith(before) || !subpath.endsWith(after ?? '')) continue
    const star = subpath.slice(before.length, subpath.length - (after?.length ?? 0))
    if (typeof value === 'string') return value.replace('*', star)
  }
  return undefined
}
