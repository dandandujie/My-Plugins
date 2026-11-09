import { gunzipSync } from 'node:zlib'

/**
 * Read one NUL-terminated field from a tar header.
 * @param {Buffer} block - 512-byte header block.
 * @param {number} offset - field offset.
 * @param {number} length - field length.
 * @returns {string} trimmed ASCII field.
 */
function field(block, offset, length) {
  let end = offset
  const limit = offset + length
  while (end < limit && block[end] !== 0) end += 1
  return block.subarray(offset, end).toString('utf8').trim()
}

/**
 * Parse an octal size field. PAX/GNU variants are not needed for npm tarballs.
 * @param {Buffer} block - tar header.
 * @returns {number} byte size.
 */
function sizeOf(block) {
  const text = field(block, 124, 12).replace(/\0/g, '').trim()
  if (text === '') return 0
  const value = Number.parseInt(text, 8)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

/**
 * Parse one gzipped npm package tarball into a path-to-bytes map.
 * Long-path PAX headers are skipped; npm package paths are short enough.
 * @param {Uint8Array} bytes - gzipped tarball bytes.
 * @returns {Map<string, Buffer>} entries keyed by path without the package/ prefix.
 */
export function readTarball(bytes) {
  const tar = gunzipSync(bytes)
  const files = new Map()
  let offset = 0
  let paxPath
  while (offset + 512 <= tar.length) {
    const block = tar.subarray(offset, offset + 512)
    if (block.every((byte) => byte === 0)) break
    const name = field(block, 0, 100)
    const prefix = field(block, 345, 155)
    const size = sizeOf(block)
    const type = String.fromCharCode(block[156] || 48)
    const full = prefix ? `${prefix}/${name}` : name
    offset += 512
    if (type === 'x' || type === 'g') {
      const payload = tar.subarray(offset, offset + size).toString('utf8')
      const match = /(?:^|\n)\d+ path=([^\n]+)\n/.exec(payload)
      if (match) paxPath = match[1]
      offset += Math.ceil(size / 512) * 512
      continue
    }
    if (type === 'L') {
      paxPath = tar.subarray(offset, offset + size).toString('utf8').replace(/\0+$/, '')
      offset += Math.ceil(size / 512) * 512
      continue
    }
    const path = paxPath ?? full
    paxPath = undefined
    if (type === '0' || type === '\0' || type === '7') {
      const normalized = path.replace(/^package\//, '')
      files.set(normalized, tar.subarray(offset, offset + size))
    }
    offset += Math.ceil(size / 512) * 512
  }
  return files
}

/**
 * Extract every TypeScript declaration file from a tarball.
 * @param {Map<string, Buffer>} files - tarball entries.
 * @returns {string} concatenated declarations.
 */
export function declarationsOf(files) {
  const parts = []
  for (const [path, bytes] of files) {
    if (!path.endsWith('.d.ts')) continue
    if (!(path.startsWith('lib/') || path.startsWith('dist/'))) continue
    parts.push(bytes.toString('utf8'))
  }
  return parts.join('\n')
}

/**
 * Read a package manifest from a tarball.
 * @param {Map<string, Buffer>} files - tarball entries.
 * @returns {Record<string, any> | undefined} parsed manifest.
 */
export function manifestOf(files) {
  const bytes = files.get('package.json')
  if (bytes === undefined) return undefined
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    return undefined
  }
}
