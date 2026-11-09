/**
 * Make lightningcss's optional native binding visible to Next's Node build
 * pool on Windows. Turbopack evaluates lightningcss/node/index.js outside the
 * package root, so its relative `.node` fallback cannot resolve. This keeps
 * the upstream package shape and adds a project-root resolver.
 *
 * Idempotent: running it again leaves an already-patched file unchanged.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const appRoot = path.resolve(process.argv[2] ?? process.cwd())
const packageDir = path.join(appRoot, 'node_modules', 'lightningcss')
const indexPath = path.join(packageDir, 'node', 'index.js')

if (!existsSync(indexPath)) {
  console.log('[lightningcss] not installed; nothing to patch')
  process.exit(0)
}

const platform = process.platform === 'win32' ? `${process.platform}-${process.arch}-msvc` : `${process.platform}-${process.arch}`
const nativeDir = path.join(appRoot, 'node_modules', `lightningcss-${platform}`)
const nativeFile = path.join(nativeDir, `lightningcss.${platform}.node`)
if (existsSync(nativeFile)) {
  try {
    copyFileSync(nativeFile, path.join(packageDir, `lightningcss.${platform}.node`))
  } catch {
    /* the project-root resolver below is the primary path */
  }
}

let source = readFileSync(indexPath, 'utf8')
if (source.includes('projectRequire')) {
  console.log('[lightningcss] already patched')
  process.exit(0)
}

const start = source.indexOf('let native;')
const end = source.indexOf('module.exports.transform', start)
if (start === -1 || end === -1) {
  console.warn('[lightningcss] native loader block not recognized; left unchanged')
  process.exit(0)
}

const replacement = `let native;
try {
  native = require(\`lightningcss-\${parts.join('-')}\`);
} catch (err) {
  try {
    const { createRequire } = require('node:module');
    const { join } = require('node:path');
    const projectRequire = createRequire(join(process.cwd(), 'package.json'));
    native = projectRequire(\`lightningcss-\${parts.join('-')}\`);
  } catch (err2) {
    native = require(\`../lightningcss.\${parts.join('-')}.node\`);
  }
}

`

source = `${source.slice(0, start)}${replacement}${source.slice(end)}`
writeFileSync(indexPath, source)
console.log('[lightningcss] patched for the Turbopack Node pool')
