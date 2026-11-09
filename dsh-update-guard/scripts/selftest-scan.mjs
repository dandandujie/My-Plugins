import { inventory, profileDirectory, currentVersion } from '../lib/inventory.js'
import { scanPlugins, compareUpstream } from '../lib/scan.js'
import { guardDataDirectory } from '../lib/guard.js'
import { join } from 'node:path'

const target = process.argv[2] ?? currentVersion()
const current = currentVersion()
const plugins = await inventory(profileDirectory())
console.log({ profile: profileDirectory(), current, target, plugins: plugins.map(p => ({ name: p.name, kind: p.kind, files: p.source.length, inject: p.clientInject })) })
const upstream = await compareUpstream(current, target)
console.log('upstream', { ok: upstream.ok, commits: upstream.commits, changed: upstream.changedPackages?.length, error: upstream.error })
const report = await scanPlugins({
  plugins,
  currentVersion: current,
  targetVersion: target,
  cacheDir: join(guardDataDirectory(), 'cache'),
  upstream,
})
console.log(JSON.stringify({ summary: report.summary, plugins: report.plugins.map(p => ({ name: p.name, status: p.status, issues: p.issues.map(i => ({ code: i.code, title: i.title, fix: i.fix })) })) }, null, 2))
