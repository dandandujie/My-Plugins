/**
 * Update Guard — a Host-side compatibility gate for the desktop update path.
 *
 * The Host half owns the expensive and privileged work: reading the profile's
 * plugin inventory, comparing the target release's published API surface,
 * staging repairs in an owned directory, verifying them, and applying only
 * dual-runtime-safe packages. The Client half owns presentation and the
 * visible update entry point.
 */
import { createGuard, readBody } from './lib/guard.js'

export const name = 'update-guard'

/** The guard needs the browser transport, and exposes one agent tool. */
export const inject = ['webServer', 'tools']

/**
 * Mount the guard's control routes and its agent tool for this plugin's lifetime.
 * @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
 * @param {Record<string, any>} config - row config.
 */
export function apply(ctx, config = {}) {
  const guard = createGuard(ctx, config)

  const send = (res, status, value) => {
    const body = JSON.stringify(value)
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(body),
    })
    res.end(body)
  }

  const handle = async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const action = url.pathname.replace(/^\/update-guard\/?/, '').replace(/\/$/, '')
    try {
      if (req.method === 'GET' && (action === '' || action === 'status')) {
        send(res, 200, guard.status())
        return
      }
      if (req.method === 'GET' && action === 'report') {
        send(res, 200, { report: guard.getReport() })
        return
      }
      if (req.method !== 'POST') {
        send(res, 405, { error: 'Method not allowed' })
        return
      }
      const body = await readBody(req)
      if (action === 'scan') {
        const result = await guard.scan(typeof body.targetVersion === 'string' ? body.targetVersion : undefined)
        send(res, 200, { report: result, status: guard.status() })
        return
      }
      if (action === 'stage') {
        const names = Array.isArray(body.names) ? body.names.filter((name) => typeof name === 'string') : undefined
        send(res, 200, { staged: await guard.stage(names), status: guard.status() })
        return
      }
      if (action === 'apply') {
        const names = Array.isArray(body.names) ? body.names.filter((name) => typeof name === 'string') : undefined
        send(res, 200, { ...await guard.apply(names), status: guard.status() })
        return
      }
      if (action === 'verify') {
        const names = Array.isArray(body.names) ? body.names.filter((name) => typeof name === 'string') : undefined
        send(res, 200, { verified: await guard.verify(names), status: guard.status() })
        return
      }
      if (action === 'prepare') {
        const names = Array.isArray(body.names) ? body.names.filter((name) => typeof name === 'string') : undefined
        send(res, 200, await guard.prepare(names))
        return
      }
      if (action === 'rollback') {
        const names = Array.isArray(body.names) ? body.names.filter((name) => typeof name === 'string') : undefined
        send(res, 200, { ...await guard.rollback(names), status: guard.status() })
        return
      }
      send(res, 404, { error: 'Unknown Update Guard route' })
    } catch (error) {
      send(res, 500, { error: error instanceof Error ? error.message : String(error), status: guard.status() })
    }
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/update-guard', handler: handle }), 'update-guard: control routes')

  try {
    ctx.tools.register({
      name: 'update_guard',
      description: 'Inspect, stage, verify, or apply plugin compatibility repairs for the next DeepSeek Harness desktop release. The guard blocks no native update path by itself; the Web UI owns that gate. Use action=status or scan first.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['status', 'scan', 'stage', 'verify', 'apply', 'prepare', 'rollback'],
            description: 'status: current report; scan: compare the target release; stage: build repairs in an isolated directory; verify: rescan staged directories after manual edits; apply: install verified dual-runtime repairs; prepare: list remaining blockers; rollback: restore backups.',
          },
          names: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional exact plugin package names. Omit to use every installed plugin.',
          },
          targetVersion: {
            type: 'string',
            description: 'Optional target release override, used by scan. A normal desktop update uses the update feed instead.',
          },
        },
        required: ['action'],
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            result: { type: 'string', description: 'JSON-encoded operation result.' },
          },
          required: ['ok', 'result'],
          additionalProperties: false,
        },
        render: (_args, value) => [{ type: 'text', text: typeof value?.result === 'string' ? value.result : 'Update Guard operation finished.' }],
      },
      execute: async (args) => {
        const action = String(args?.action ?? 'status')
        const names = Array.isArray(args?.names) ? args.names.filter((name) => typeof name === 'string') : undefined
        let result
        if (action === 'status') result = { status: guard.status() }
        else if (action === 'scan') result = { report: await guard.scan(typeof args?.targetVersion === 'string' ? args.targetVersion : undefined) }
        else if (action === 'stage') result = { staged: await guard.stage(names), status: guard.status() }
        else if (action === 'verify') result = { verified: await guard.verify(names), status: guard.status() }
        else if (action === 'apply') result = { ...await guard.apply(names), status: guard.status() }
        else if (action === 'prepare') result = await guard.prepare(names)
        else if (action === 'rollback') result = { ...await guard.rollback(names), status: guard.status() }
        else throw new Error(`Unknown update_guard action: ${action}`)
        return { ok: true, result: JSON.stringify(result) }
      },
    }, {})
  } catch (error) {
    ctx.logger?.('update-guard')?.warn?.('Agent tool unavailable: %s', error instanceof Error ? error.message : String(error))
  }
}
