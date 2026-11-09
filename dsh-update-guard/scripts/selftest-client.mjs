import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const code = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
let definition
const React = {
  createElement: (...args) => ({ args }),
  Fragment: 'fragment',
  useSyncExternalStore: () => 0,
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useState: (value) => [value, () => {}],
  useReducer: (value) => [value, () => {}],
}
const ReactDOM = { createPortal: (node) => node }
const sandbox = {
  window: { __ModuleLoader__: { load: (def) => { definition = def } } },
  document: {
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({ dataset: {}, textContent: '', remove: () => {} }),
    head: { appendChild: () => {} },
    body: {},
  },
  globalThis: {},
  console,
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Element: class {},
}
sandbox.globalThis = sandbox
vm.runInNewContext(code, sandbox, { filename: 'client.js' })
if (definition === undefined) throw new Error('client module did not register')
const plugin = definition.factory((name) => {
  if (name === 'react') return React
  if (name === 'react-dom') return ReactDOM
  throw new Error(`unexpected require ${name}`)
})
const registered = []
const ctx = {
  get: (name) => name === 'locale' ? { register: () => () => {}, bind: () => () => '' } : undefined,
  effect: (fn) => {
    const disposer = fn()
    return () => disposer?.()
  },
  slots: {
    inject: (key, callback) => {
      callback()
      return () => {}
    },
    register: (options) => {
      registered.push(options)
      return () => {}
    },
  },
}
plugin.apply(ctx)
console.log(registered)
for (const expected of ['shell.overlay', 'sidebar.footer.action', 'settings.section']) {
  if (!registered.some((entry) => entry.name === expected)) throw new Error(`missing ${expected}`)
}
console.log('client apply ok')
