import { readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { stagePlugin } from '../lib/repair.js'
import { guardDataDirectory } from '../lib/guard.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const fixture = join(root, 'fixtures', 'toy')
const staging = join(guardDataDirectory(), 'selftest', 'packages')
rmSync(join(guardDataDirectory(), 'selftest'), { recursive: true, force: true })
const manifest = JSON.parse(readFileSync(join(fixture, 'package.json'), 'utf8'))
const plugin = {
  id: '@local/update-guard-toy',
  name: '@local/update-guard-toy',
  title: 'Toy',
  version: '1.0.0',
  kind: 'host',
  enabled: true,
  directory: fixture,
  manifest,
  clientInject: [],
  source: [{ path: join(fixture, 'index.js'), relative: 'index.js', size: 100 }],
}
const meta = await stagePlugin(plugin, { status: 'ok' }, {
  targetVersion: '0.2.2-rc.1',
  stagingDir: staging,
  renames: { slots: { 'old.slot': 'new.slot' } },
  cacheDir: join(guardDataDirectory(), 'cache'),
})
console.log(meta)
const wrapper = join(meta.stagingDirectory, 'index.js')
console.log(readFileSync(wrapper, 'utf8'))
const module = await import(`${pathToFileURL(wrapper).href}?v=${Date.now()}`)
const ctx = {}
await module.apply(ctx)
console.log({ marker: ctx.marker, facade: meta.facade, dual: meta.dualCompatible })
if (ctx.marker !== 'new.slot') throw new Error('facade did not load the patched implementation')
if (!meta.facade || !meta.dualCompatible) throw new Error('facade metadata is wrong')
