import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  compareVersions,
  exportTarget,
  fetchJson,
  fetchText,
  packageFiles,
  packageManifest,
  rangeCovers,
  targetVersionOf,
} from './registry.js'
import { declarationsOf } from './tar.js'
import { packageGuess } from './inventory.js'

const GITHUB = 'https://api.github.com/repos/deepseek-ai/deepseek-harness'
const RESERVED_CONTEXT = new Set([
  'get', 'set', 'inject', 'plugin', 'effect', 'on', 'once', 'off', 'emit', 'parallel', 'serial', 'bail',
  'waterfall', 'extend', 'isolate', 'intercept', 'reflect', 'fiber', 'logger', 'registry', 'root', 'scope',
  'baseUrl', 'runtime', 'uid', 'config', 'dispose', 'start', 'restart', 'update', 'await', 'then',
])

/**
 * Fetch one upstream compare, tolerating tag naming differences.
 * @param {string} current - current release.
 * @param {string} target - target release.
 * @returns {Promise<Record<string, any>>} compare summary.
 */
async function compareUpstream(current, target) {
  const candidates = [
    [`dsh-v${current}`, `dsh-v${target}`],
    [`v${current}`, `v${target}`],
    [current, target],
  ]
  let lastError = ''
  for (const [base, head] of candidates) {
    if (base === head) return { ok: true, skipped: true, commits: 0, files: 0, changedPackages: [] }
    const url = `${GITHUB}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`
    try {
      const data = await fetchJson(url, 30_000)
      const files = Array.isArray(data.files) ? data.files : []
      if (files.length === 0 && Number(data.behind_by ?? 0) > 0) {
        const reverse = await compareUpstream(target, current)
        if (reverse.ok) return { ...reverse, direction: 'backward' }
      }
      const counts = new Map()
      for (const file of files) {
        const guess = packageGuess(String(file.filename ?? ''))
        if (guess === undefined) continue
        const entry = counts.get(guess) ?? { name: guess, files: 0, additions: 0, deletions: 0 }
        entry.files += 1
        entry.additions += Number(file.additions ?? 0)
        entry.deletions += Number(file.deletions ?? 0)
        counts.set(guess, entry)
      }
      return {
        ok: true,
        url: `https://github.com/deepseek-ai/deepseek-harness/compare/${base}...${head}`,
        commits: Number(data.total_commits ?? 0),
        ahead: Number(data.ahead_by ?? 0),
        files: files.length,
        truncated: files.length >= 300,
        changedPackages: [...counts.values()].sort((a, b) => b.files - a.files).slice(0, 40),
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  return { ok: false, error: lastError, commits: 0, files: 0, changedPackages: [] }
}

/**
 * Parse one module specifier into package name and export subpath.
 * @param {string} specifier - import specifier.
 * @returns {{ name: string, subpath: string } | undefined} parsed identity.
 */
export function splitSpecifier(specifier) {
  if (!specifier.startsWith('@deepseek-ai/')) return undefined
  const parts = specifier.split('/')
  if (parts.length < 2) return undefined
  const name = `${parts[0]}/${parts[1]}`
  const rest = parts.slice(2).join('/')
  return { name, subpath: rest === '' ? '.' : `./${rest}` }
}

/**
 * Extract import specifiers and named bindings from source text.
 * @param {string} text - JavaScript or TypeScript source.
 * @returns {{ specifiers: Set<string>, names: Map<string, Set<string>> }} imports.
 */
export function importsOf(text) {
  const specifiers = new Set()
  const names = new Map()
  const add = (specifier, bindings) => {
    if (!specifier.startsWith('@deepseek-ai/')) return
    specifiers.add(specifier)
    if (bindings === undefined) return
    let set = names.get(specifier)
    if (set === undefined) {
      set = new Set()
      names.set(specifier, set)
    }
    for (const binding of bindings) set.add(binding)
  }
  const staticImport = /\bimport\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = staticImport.exec(text)) !== null) {
    const clause = match[1].trim()
    const bindings = []
    const braces = /\{([\s\S]*?)\}/.exec(clause)
    if (braces !== null) {
      for (const part of braces[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/)[0]?.trim()
        if (name !== undefined && name !== '' && name !== 'type') bindings.push(name.replace(/^type\s+/, ''))
      }
    }
    const namespace = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(clause)
    if (namespace !== null) bindings.push(namespace[1])
    add(match[2], bindings)
  }
  const sideEffect = /\bimport\s+['"]([^'"]+)['"]/g
  while ((match = sideEffect.exec(text)) !== null) add(match[1], undefined)
  const dynamicImport = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = dynamicImport.exec(text)) !== null) add(match[1], undefined)
  const requireCall = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = requireCall.exec(text)) !== null) add(match[1], undefined)
  const reexport = /\bexport\s+(?:\*|\{[\s\S]*?\})\s+from\s+['"]([^'"]+)['"]/g
  while ((match = reexport.exec(text)) !== null) add(match[1], undefined)
  return { specifiers, names }
}

/**
 * Extract exported runtime binding names from declaration text.
 * @param {string} declarations - concatenated .d.ts content.
 * @returns {Set<string>} export names.
 */
export function exportedNames(declarations) {
  const names = new Set(['default'])
  const declarationsRe = /\bexport\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/g
  let match
  while ((match = declarationsRe.exec(declarations)) !== null) names.add(match[1])
  const lists = /\bexport\s*(?:type\s*)?\{([\s\S]*?)\}/g
  while ((match = lists.exec(declarations)) !== null) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim().replace(/^type\s+/, '')
      if (name !== undefined && name !== '') names.add(name)
    }
  }
  return names
}

/**
 * Extract service member names from `interface Context` augmentations.
 * @param {string} declarations - concatenated .d.ts content.
 * @returns {Set<string>} service names.
 */
export function contextServices(declarations) {
  const services = new Set()
  const blocks = /\binterface\s+Context\s*(?:extends[^{]+)?\{([\s\S]*?)\n\}/g
  let match
  while ((match = blocks.exec(declarations)) !== null) {
    const body = match[1]
    const property = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/gm
    let prop
    while ((prop = property.exec(body)) !== null) services.add(prop[1])
  }
  return services
}

/**
 * Extract declared slot names from `interface SlotMap` augmentations.
 * @param {string} declarations - concatenated .d.ts content.
 * @returns {Set<string>} slot names.
 */
export function slotNames(declarations) {
  const slots = new Set()
  const blocks = /\binterface\s+SlotMap\s*\{([\s\S]*?)\n\}/g
  let match
  while ((match = blocks.exec(declarations)) !== null) {
    const body = match[1]
    const quoted = /^\s*(['"])([a-z][\w-]*(?:\.[\w-]+)+)\1\s*[?:]/gm
    let entry
    while ((entry = quoted.exec(body)) !== null) slots.add(entry[2])
    const bare = /^\s*([a-z][\w-]*(?:\.[\w-]+)+)\s*[?:]/gm
    while ((entry = bare.exec(body)) !== null) slots.add(entry[1])
  }
  return slots
}

/**
 * Collect package calls used on the context object.
 * @param {string} text - source text.
 * @returns {Set<string>} context property names.
 */
export function contextUses(text) {
  const used = new Set()
  const direct = /\bctx\.([A-Za-z_$][\w$]*)/g
  let match
  while ((match = direct.exec(text)) !== null) {
    if (!RESERVED_CONTEXT.has(match[1])) used.add(match[1])
  }
  const getter = /\bctx\.get\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = getter.exec(text)) !== null) used.add(match[1])
  return used
}

/**
 * Check JavaScript syntax with the current Node executable.
 * @param {string} path - file path.
 * @returns {string | undefined} diagnostic.
 */
function syntaxError(path) {
  if (!/\.(?:js|mjs|cjs)$/.test(path)) return undefined
  const result = spawnSync(process.execPath, ['--check', path], {
    encoding: 'utf8',
    timeout: 15_000,
    windowsHide: true,
  })
  if (result.status === 0) return undefined
  const detail = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim()
  return detail.split('\n').slice(0, 8).join('\n') || `node --check exited ${String(result.status)}`
}

/**
 * Compare one plugin against one target release.
 * @param {Record<string, any>} plugin - inventory row.
 * @param {Record<string, any>} context - scan context.
 * @returns {Promise<Record<string, any>>} report row.
 */
export async function scanPlugin(plugin, context) {
  const issues = []
  const imports = new Set()
  const namedImports = new Map()
  const services = new Set()
  const slots = new Set()
  const importFiles = new Map()

  for (const file of plugin.source) {
    let text
    try {
      text = readFileSync(file.path, 'utf8')
    } catch {
      continue
    }
    const parsed = importsOf(text)
    for (const specifier of parsed.specifiers) {
      imports.add(specifier)
      importFiles.set(specifier, file.relative)
    }
    for (const [specifier, names] of parsed.names) {
      let set = namedImports.get(specifier)
      if (set === undefined) {
        set = new Set()
        namedImports.set(specifier, set)
      }
      for (const name of names) set.add(name)
    }
    for (const service of contextUses(text)) services.add(service)
    const slotRe = /(?:\bname\s*:\s*|\bslots\.(?:register|inject)\(\s*)['"]([a-z][\w-]*(?:\.[\w-]+)+)['"]/g
    let slot
    while ((slot = slotRe.exec(text)) !== null) slots.add(slot[1])
    const diagnostic = syntaxError(file.path)
    if (diagnostic !== undefined) {
      issues.push({
        id: `${plugin.name}::syntax::${file.relative}`,
        code: 'syntax',
        severity: 'error',
        fix: 'manual',
        title: `Syntax error in ${file.relative}`,
        detail: diagnostic,
        file: file.relative,
      })
    }
  }

  for (const inject of plugin.clientInject) {
    const parsed = splitSpecifier(inject)
    if (parsed === undefined) continue
    imports.add(inject)
    if (!importFiles.has(inject)) importFiles.set(inject, 'package.json#dsh.client.inject')
  }

  const dependencySections = ['dependencies', 'peerDependencies', 'optionalDependencies']
  for (const section of dependencySections) {
    const dependencies = plugin.manifest[section]
    if (dependencies === undefined || dependencies === null || typeof dependencies !== 'object') continue
    for (const [name, range] of Object.entries(dependencies)) {
      if (!name.startsWith('@deepseek-ai/')) continue
      imports.add(name)
      let target
      try {
        target = await targetVersionOf(name, context.targetVersion)
        await packageManifest(name, target)
      } catch (error) {
        issues.push({
          id: `${plugin.name}::dependency-missing::${name}`,
          code: 'target-package-missing',
          severity: 'error',
          fix: 'manual',
          title: `Target release does not publish ${name}`,
          detail: error instanceof Error ? error.message : String(error),
          file: `package.json#${section}`,
        })
        continue
      }
      const covered = rangeCovers(String(range), target)
      if (covered === false) {
        issues.push({
          id: `${plugin.name}::dependency-range::${name}`,
          code: 'dependency-range',
          severity: 'warning',
          fix: 'auto',
          title: `${name} range does not include ${target}`,
          detail: `Declared ${String(range)} in ${section}; target release provides ${target}.`,
          file: `package.json#${section}`,
          data: { section, name, range, target },
        })
      }
    }
  }

  const targetDeclarations = new Map()
  for (const specifier of imports) {
    const parsed = splitSpecifier(specifier)
    if (parsed === undefined) continue
    let target
    try {
      target = await targetVersionOf(parsed.name, context.targetVersion)
      const manifest = await packageManifest(parsed.name, target)
      if (exportTarget(manifest, parsed.subpath) === undefined) {
        issues.push({
          id: `${plugin.name}::export-subpath::${specifier}`,
          code: 'target-subpath-missing',
          severity: 'error',
          fix: 'manual',
          title: `Import path removed in ${parsed.name}@${target}`,
          detail: `${specifier} is imported by ${importFiles.get(specifier) ?? 'the plugin'}, but ${parsed.name}@${target} does not export ${parsed.subpath}.`,
          file: importFiles.get(specifier),
          data: { specifier, name: parsed.name, target },
        })
        continue
      }
      if (!targetDeclarations.has(parsed.name)) {
        const { files } = await packageFiles(parsed.name, target, context.cacheDir)
        targetDeclarations.set(parsed.name, declarationsOf(files))
      }
      const declarations = targetDeclarations.get(parsed.name) ?? ''
      if (declarations.length === 0) continue
      const exports = exportedNames(declarations)
      for (const binding of namedImports.get(specifier) ?? []) {
        if (exports.has(binding)) continue
        if (binding === 'default' || binding === 'type') continue
        issues.push({
          id: `${plugin.name}::export-name::${specifier}::${binding}`,
          code: 'target-export-name-missing',
          severity: 'error',
          fix: 'manual',
          title: `${binding} is no longer exported by ${parsed.name}`,
          detail: `${importFiles.get(specifier) ?? 'The plugin'} imports { ${binding} } from ${specifier}; ${parsed.name}@${target} does not declare that export.`,
          file: importFiles.get(specifier),
          data: { specifier, name: parsed.name, target, binding },
        })
      }
    } catch (error) {
      issues.push({
        id: `${plugin.name}::import-unresolved::${specifier}`,
        code: 'target-import-unresolved',
        severity: 'error',
        fix: 'manual',
        title: `Cannot resolve ${specifier} in the target release`,
        detail: error instanceof Error ? error.message : String(error),
        file: importFiles.get(specifier),
      })
    }
  }

  const targetServices = context.targetServices
  if (targetServices.size > 0) {
    for (const service of services) {
      if (targetServices.has(service)) continue
      issues.push({
        id: `${plugin.name}::service::${service}`,
        code: 'target-service-missing',
        severity: 'warning',
        fix: 'manual',
        title: `Service ctx.${service} is not declared by the target release`,
        detail: 'No target declaration augments Context with this service. It may come from another plugin; verify before trusting this plugin after the update.',
      })
    }
  }

  if (plugin.clientInject.length > 0 && slots.size > 0) {
    const targetSlots = new Set()
    for (const inject of plugin.clientInject) {
      const parsed = splitSpecifier(inject)
      if (parsed === undefined) continue
      if (!context.slotCache.has(parsed.name)) {
        try {
          const target = await targetVersionOf(parsed.name, context.targetVersion)
          const { files } = await packageFiles(parsed.name, target, context.cacheDir)
          context.slotCache.set(parsed.name, slotNames(declarationsOf(files)))
        } catch {
          context.slotCache.set(parsed.name, new Set())
        }
      }
      for (const slot of context.slotCache.get(parsed.name) ?? []) targetSlots.add(slot)
    }
    for (const slot of slots) {
      if (targetSlots.has(slot)) continue
      if (slot === 'shell.overlay' || slot === 'main' || slot === 'root') continue
      issues.push({
        id: `${plugin.name}::slot::${slot}`,
        code: 'target-slot-missing',
        severity: 'warning',
        fix: 'manual',
        title: `Slot ${slot} was not found in the target client packages`,
        detail: `The plugin registers or injects ${slot}, but the target versions of ${plugin.clientInject.join(', ')} do not declare it. This can be a legitimate slot from another package; verify in the target UI.`,
      })
    }
  }

  const touched = new Set(context.changedPackages.map((entry) => entry.name))
  const touchedHits = []
  for (const specifier of imports) {
    const parsed = splitSpecifier(specifier)
    if (parsed === undefined) continue
    for (const name of touched) {
      if (parsed.name === name || parsed.name.endsWith(name) || name.endsWith(parsed.name.replace('@deepseek-ai/', ''))) {
        touchedHits.push(parsed.name)
      }
    }
  }
  if (touchedHits.length > 0) {
    const unique = [...new Set(touchedHits)]
    issues.push({
      id: `${plugin.name}::upstream-touched`,
      code: 'upstream-touched',
      severity: 'info',
      fix: 'manual',
      title: 'Upstream changed packages this plugin depends on',
      detail: unique.join(', '),
      data: { packages: unique },
    })
  }

  const errors = issues.filter((issue) => issue.severity === 'error').length
  const warnings = issues.filter((issue) => issue.severity === 'warning').length
  return {
    ...plugin,
    issues,
    metrics: {
      files: plugin.source.length,
      imports: imports.size,
      services: [...services],
      slots: [...slots],
    },
    status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok',
    staged: false,
    applied: false,
    dualCompatible: false,
    verified: false,
  }
}

/**
 * Resolve the target release from an explicit override, the desktop feed, or npm.
 * @param {Record<string, any>} config - plugin configuration.
 * @param {string} current - current version.
 * @returns {Promise<Record<string, any>>} target identity.
 */
export async function resolveTarget(config, current) {
  if (typeof config.targetVersion === 'string' && config.targetVersion.trim() !== '') {
    const target = config.targetVersion.trim()
    return { version: target, source: 'config', available: compareVersions(target, current) > 0, simulated: true }
  }
  if (typeof config.feedUrl === 'string' && config.feedUrl.trim() !== '') {
    try {
      const text = await fetchText(config.feedUrl.trim(), 20_000)
      const match = /^version:\s*['"]?([^'"\s]+)/m.exec(text)
      if (match !== null) {
        const target = match[1]
        return { version: target, source: 'feed', available: compareVersions(target, current) > 0, simulated: false }
      }
    } catch {
      // A feed outage falls through to the registry.
    }
  }
  const doc = await fetchJson('https://registry.npmjs.org/@deepseek-ai%2Fdsh', 25_000)
  const target = doc['dist-tags']?.latest
  if (typeof target !== 'string') throw new Error('No npm dist-tag for @deepseek-ai/dsh')
  return { version: target, source: 'npm', available: compareVersions(target, current) > 0, simulated: false }
}

/**
 * Build a compatibility report for every installed plugin.
 * @param {object} options - scan inputs.
 * @param {Array<Record<string, any>>} options.plugins - inventory.
 * @param {string} options.currentVersion - installed release.
 * @param {string} options.targetVersion - target release.
 * @param {string} options.cacheDir - package cache.
 * @param {Record<string, any>} [options.upstream] - upstream compare.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<Record<string, any>>} report.
 */
export async function scanPlugins(options) {
  const upstream = options.upstream ?? await compareUpstream(options.currentVersion, options.targetVersion)
  const targetServices = new Set()
  const slotCache = new Map()
  const rows = []
  for (const plugin of options.plugins) {
    if (options.signal?.aborted) throw new Error('Scan cancelled')
    rows.push(await scanPlugin(plugin, {
      targetVersion: options.targetVersion,
      cacheDir: options.cacheDir,
      changedPackages: upstream.changedPackages ?? [],
      targetServices,
      slotCache,
    }))
  }
  const errors = rows.reduce((total, row) => total + row.issues.filter((issue) => issue.severity === 'error').length, 0)
  const warnings = rows.reduce((total, row) => total + row.issues.filter((issue) => issue.severity === 'warning').length, 0)
  return {
    generatedAt: new Date().toISOString(),
    currentVersion: options.currentVersion,
    targetVersion: options.targetVersion,
    upstream,
    plugins: rows,
    summary: {
      plugins: rows.length,
      errors,
      warnings,
      repairable: rows.reduce((total, row) => total + row.issues.filter((issue) => issue.fix === 'auto').length, 0),
      incompatible: rows.filter((row) => row.status === 'error').length,
    },
  }
}

export { compareUpstream }
