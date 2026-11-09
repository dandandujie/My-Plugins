import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const code = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
let definition
const listeners = {}
let opened = false
const React = {
  createElement: () => null,
  Fragment: 'fragment',
  useSyncExternalStore: () => 0,
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useState: (value) => [value, () => {}],
  useReducer: (value) => [value, () => {}],
}
const ReactDOM = { createPortal: (node) => node }
const sandbox = {
  window: { __ModuleLoader__: { load: (def) => { definition = def } }, setTimeout, clearTimeout, setInterval, clearInterval },
  document: {
    addEventListener: (type, fn) => { listeners[type] = fn },
    removeEventListener: () => {},
    createElement: () => ({ dataset: {}, textContent: '', remove: () => {} }),
    head: { appendChild: () => {} },
    body: {},
  },
  console,
  fetch: async (url) => {
    const payload = String(url).endsWith('/scan')
      ? { status: { phase: 'ready', summary: { plugins: 0, errors: 0, warnings: 0 }, plugins: [], targetVersion: '0.2.2-rc.1', currentVersion: '0.2.1' } }
      : { ok: true, blockers: [] }
    return { ok: true, json: async () => payload }
  },
  dshDesktop: { updates: { open: async () => { opened = true } } },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Element: class {},
}
sandbox.globalThis = sandbox
vm.runInNewContext(code, sandbox, { filename: 'client.js' })
const plugin = definition.factory((name) => name === 'react' ? React : ReactDOM)
const ctx = {
  get: (name) => name === 'locale' ? { register: () => () => {}, bind: () => () => '' } : undefined,
  effect: (fn) => { fn(); return () => {} },
  slots: { inject: (key, cb) => { cb(); return () => {} }, register: () => () => {} },
}
plugin.apply(ctx)
const click = listeners.click
if (typeof click !== 'function') throw new Error('click interception was not installed')
const button = {
  className: 'VUhOWa_indicator',
  getAttribute: () => 'Update',
  closest: (selector) => selector === 'button' ? button : null,
}
const target = new sandbox.Element()
target.closest = () => button
let prevented = false
click({
  target,
  preventDefault: () => { prevented = true },
  stopImmediatePropagation: () => {},
})
await new Promise((resolve) => setTimeout(resolve, 80))
console.log({ prevented, opened })
if (!prevented) throw new Error('native click was not prevented')
if (!opened) throw new Error('guard did not auto-open the native updater after a clean scan')
