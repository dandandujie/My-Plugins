window.__ModuleLoader__.load({
  id: '@local/dsh-update-guard',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement
    const NS = 'update-guard'
    const API = '/update-guard'

    const EN = {
      nav: 'Update Guard',
      title: 'Update Guard',
      subtitle: 'Check every installed plugin against the next Harness release before the desktop updater runs.',
      close: 'Close',
      refresh: 'Check again',
      scan: 'Check this release',
      scanning: 'Checking plugins…',
      target: 'Target',
      current: 'Current',
      upToDate: 'This is the current release. You can still rehearse compatibility against it.',
      updateAvailable: 'A newer release is available.',
      plugins: 'Plugins',
      errors: 'errors',
      warnings: 'warnings',
      repairable: 'safe fixes',
      noIssues: 'No compatibility issues found.',
      allGood: 'All installed plugins passed the checks.',
      selectProblems: 'Select plugins with issues',
      selectAll: 'Select all',
      selected: '{count} selected',
      onlySafe: 'Repair selected',
      verify: 'Re-verify staged',
      continueUpdate: 'Repair and continue update',
      rollback: 'Roll back applied repairs',
      rollbackDone: 'Restored the previous plugin versions',
      applying: 'Applying…',
      staging: 'Staging repairs…',
      blocked: 'Blocked',
      desktopOnly: 'The native updater is only available in the Desktop app. The checks still run here.',
      upstream: 'Upstream changes',
      commits: '{count} commits',
      changedPackages: 'Changed package groups',
      noUpstream: 'Upstream comparison is unavailable. The target package surface is still checked from the npm release.',
      advanced: 'Target release override',
      advancedHint: 'Leave empty to use the desktop update feed.',
      placeholder: 'e.g. 0.2.2-rc.1',
      openGuard: 'Open Update Guard',
      settingsTitle: 'Update Guard',
      settingsBody: 'Before a desktop update, this guard checks plugin imports, exported API names, package ranges, and syntax against the target release. Repairs are staged outside the live plugin and verified before they are applied.',
      idle: 'Not checked yet',
      ready: 'Report ready',
      issueList: 'Issues',
      auto: 'safe fix',
      manual: 'manual review',
      staged: 'staged',
      applied: 'applied',
      dual: 'dual-runtime safe',
      notDual: 'needs target runtime',
      verified: 'verified',
      notVerified: 'not verified',
      nativeTitle: 'Desktop updater',
      nativeIdle: 'Idle',
      nativePhase: 'Phase: {phase}',
      nativeReady: 'Update downloaded and ready',
      simulate: 'Target override',
      blockedTitle: 'Resolve these before updating',
      release: 'Release',
      source: 'Source',
      packages: 'packages',
      emptyPlugins: 'No installed plugins were discovered in this profile.',
      safety: 'Repairs are built in a separate staging directory. A package is only applied when the result is verified and remains safe on both the current and target runtime.',
      noSelection: 'Select at least one plugin.',
      ok: 'Ready to update',
      okBody: 'No unresolved blockers remain. The native updater will still show its own confirmation and task checks.',
      showDetails: 'Show details',
      hideDetails: 'Hide details',
      fullReport: 'Upstream files',
      phaseScan: 'Scanning the target release and installed plugins…',
      phaseStage: 'Building isolated repairs…',
      phaseApply: 'Applying verified repairs…',
      phaseVerify: 'Re-verifying staged repairs…',
      phaseRollback: 'Restoring previous plugin versions…',
      scanFailed: 'The check failed',
      targetHint: 'Override is for rehearsals and prereleases; it does not install anything by itself.',
      noCheckbox: 'Nothing to select',
      autoBlocked: 'Compatibility issues need attention. The update is paused until they are resolved or deliberately skipped.',
      autoPassed: 'Checks passed. The native updater has been resumed automatically.',
      autoWaiting: 'Running Update Guard before the native update…',
      nativeUnavailable: 'The desktop update bridge is unavailable on this page.',
      updateInProgress: 'The desktop updater is running. Complete its confirmation to finish the update.',
      rerun: 'Run a scan to see per-plugin results.',
    }

    const ZH = {
      nav: '更新守卫',
      title: '更新守卫',
      subtitle: '在桌面更新器启动前，按目标版本检查全部已安装插件。',
      close: '关闭',
      refresh: '重新检查',
      scan: '检查目标版本',
      scanning: '正在检查插件…',
      target: '目标',
      current: '当前',
      upToDate: '当前已是最新版本，仍可对当前版本做兼容预演。',
      updateAvailable: '发现可用的新版本。',
      plugins: '插件',
      errors: '错误',
      warnings: '警告',
      repairable: '可自动修复',
      noIssues: '未发现兼容问题。',
      allGood: '全部已安装插件均通过检查。',
      selectProblems: '选中问题插件',
      selectAll: '全选',
      selected: '已选 {count} 个',
      onlySafe: '修复所选',
      verify: '重新验证暂存',
      continueUpdate: '修复并继续更新',
      rollback: '回滚已应用的修复',
      rollbackDone: '已恢复插件旧版本',
      applying: '正在应用…',
      staging: '正在暂存修复…',
      blocked: '已阻断',
      desktopOnly: '原生更新器只在桌面应用中可用；检查逻辑仍可运行。',
      upstream: '上游更改',
      commits: '{count} 个提交',
      changedPackages: '变更包组',
      noUpstream: '无法获取上游对比；仍会基于 npm 发布物检查目标 API 表面。',
      advanced: '目标版本覆盖',
      advancedHint: '留空则使用桌面更新源。',
      placeholder: '例如 0.2.2-rc.1',
      openGuard: '打开更新守卫',
      settingsTitle: '更新守卫',
      settingsBody: '桌面更新前，守卫会按目标版本检查插件的导入路径、导出名称、依赖范围与语法。修复会先进入独立暂存区，验证通过后才会写入当前插件。',
      idle: '尚未检查',
      ready: '报告已就绪',
      issueList: '问题',
      auto: '可自动修复',
      manual: '需人工确认',
      staged: '已暂存',
      applied: '已应用',
      dual: '双版本安全',
      notDual: '需新版本运行',
      verified: '已验证',
      notVerified: '未验证',
      nativeTitle: '桌面更新器',
      nativeIdle: '空闲',
      nativePhase: '阶段：{phase}',
      nativeReady: '更新已下载，等待安装',
      simulate: '目标覆盖',
      blockedTitle: '更新前需处理',
      release: '版本',
      source: '来源',
      packages: '个包',
      emptyPlugins: '当前 profile 未发现已安装插件。',
      safety: '修复在独立暂存目录中构建。只有验证通过、且在当前与目标运行时都安全的包才会被写入。',
      noSelection: '请至少选择一个插件。',
      ok: '可以更新',
      okBody: '没有未解决的阻断项。原生更新器仍会显示自己的确认与任务检查。',
      showDetails: '展开详情',
      hideDetails: '收起详情',
      fullReport: '上游文件',
      phaseScan: '正在检查目标版本与已安装插件…',
      phaseStage: '正在构建隔离修复…',
      phaseApply: '正在应用已验证的修复…',
      phaseVerify: '正在重新验证暂存修复…',
      phaseRollback: '正在恢复插件旧版本…',
      scanFailed: '检查失败',
      targetHint: '目标覆盖仅用于预演与预发布版本，本身不会安装任何东西。',
      noCheckbox: '没有可选插件',
      autoBlocked: '发现兼容问题，更新已暂停；请先处理，或明确跳过。',
      autoPassed: '检查通过，已自动接上原生更新器。',
      autoWaiting: '正在先运行更新守卫，再进入原生更新…',
      nativeUnavailable: '当前页面无法访问桌面更新桥。',
      updateInProgress: '桌面更新器已启动，请完成其确认流程。',
      rerun: '运行一次检查以查看每个插件的结果。',
    }

    let translate = null
    function t(key, params) {
      let value
      if (translate) {
        try {
          const translated = translate(key)
          if (typeof translated === 'string' && translated !== key) value = translated
        } catch {
          // A missing locale namespace falls back to the built-in copy.
        }
      }
      if (value === undefined) value = EN[key] ?? key
      if (params !== undefined) {
        for (const [name, replacement] of Object.entries(params)) value = value.replaceAll(`{${name}}`, String(replacement))
      }
      return value
    }

    const state = {
      open: false,
      status: null,
      busy: null,
      error: null,
      blockers: [],
      selected: {},
      targetInput: '',
      showUpstream: false,
      native: null,
      autoCheck: false,
      autoResult: null,
    }
    const listeners = new Set()
    let revision = 0
    function emit() {
      revision += 1
      for (const listener of listeners) listener()
    }
    function patch(next) {
      Object.assign(state, next)
      emit()
    }
    function subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
    function useRevision() {
      return React.useSyncExternalStore(subscribe, () => revision, () => revision)
    }
    function openGuard() {
      patch({ open: true })
    }
    function closeGuard() {
      patch({ open: false })
    }

    async function api(path, body) {
      const response = await fetch(`${API}/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? {} : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }
      if (!response.ok) throw new Error(data.error ?? `${response.status} ${response.statusText}`)
      return data
    }

    function selectedNames() {
      return state.status?.plugins?.filter((plugin) => state.selected[plugin.name]).map((plugin) => plugin.name) ?? []
    }
    function selectProblems() {
      const selected = {}
      for (const plugin of state.status?.plugins ?? []) {
        if (plugin.issues.some((issue) => issue.severity === 'error' || issue.severity === 'warning')) selected[plugin.name] = true
      }
      patch({ selected })
    }
    function selectAll() {
      const selected = {}
      for (const plugin of state.status?.plugins ?? []) selected[plugin.name] = true
      patch({ selected })
    }

    async function loadStatus() {
      const status = await api('status')
      patch({ status })
      return status
    }

    async function runScan(options = {}) {
      const auto = options?.auto === true
      if (state.busy) return
      patch({ busy: 'scan', error: null, blockers: [], autoCheck: auto, autoResult: null })
      try {
        const data = await api('scan', state.targetInput.trim() === '' ? {} : { targetVersion: state.targetInput.trim() })
        const selected = {}
        for (const plugin of data.status?.plugins ?? []) {
          if (plugin.issues.some((issue) => issue.severity === 'error' || issue.severity === 'warning')) selected[plugin.name] = true
        }
        patch({ status: data.status, selected, busy: null, error: null })
        if (auto) await autoContinueAfterScan(data.status)
      } catch (error) {
        patch({
          busy: null,
          error: error instanceof Error ? error.message : String(error),
          autoCheck: false,
          autoResult: auto ? 'blocked' : null,
        })
      }
    }

    async function autoContinueAfterScan(status) {
      if ((status.summary?.errors ?? 0) > 0 || (status.summary?.warnings ?? 0) > 0) {
        patch({ autoCheck: false, autoResult: 'blocked' })
        return
      }
      const bridge = globalThis.dshDesktop?.updates
      if (bridge === undefined) {
        patch({ autoCheck: false, autoResult: 'blocked', error: t('desktopOnly') })
        return
      }
      patch({ busy: 'prepare', autoResult: null })
      try {
        const prepared = await api('prepare', {})
        if (!prepared.ok) {
          patch({ busy: null, blockers: prepared.blockers ?? [], autoCheck: false, autoResult: 'blocked' })
          return
        }
        patch({ busy: 'updating', blockers: [], autoCheck: false, autoResult: 'passed' })
        await bridge.open()
        patch({ busy: null })
      } catch (error) {
        patch({
          busy: null,
          error: error instanceof Error ? error.message : String(error),
          autoCheck: false,
          autoResult: 'blocked',
        })
      }
    }

    async function stageSelected() {
      const names = selectedNames()
      if (names.length === 0) {
        patch({ error: t('noSelection') })
        return undefined
      }
      patch({ busy: 'stage', error: null, blockers: [] })
      try {
        const data = await api('stage', { names })
        patch({ status: data.status, busy: null })
        return names
      } catch (error) {
        patch({ busy: null, error: error instanceof Error ? error.message : String(error) })
        return undefined
      }
    }

    async function applySelected(names) {
      patch({ busy: 'apply', error: null })
      try {
        const data = await api('apply', { names })
        patch({ status: data.status, blockers: data.blockers ?? [], busy: null })
        return data
      } catch (error) {
        patch({ busy: null, error: error instanceof Error ? error.message : String(error) })
        return undefined
      }
    }

    async function repairOnly() {
      const names = await stageSelected()
      if (names === undefined) return
      await applySelected(names)
    }

    async function rollbackApplied() {
      const names = (state.status?.plugins ?? []).filter((plugin) => plugin.applied).map((plugin) => plugin.name)
      if (names.length === 0) return
      patch({ busy: 'rollback', error: null, blockers: [] })
      try {
        const data = await api('rollback', { names })
        patch({ status: data.status, busy: null })
      } catch (error) {
        patch({ busy: null, error: error instanceof Error ? error.message : String(error) })
      }
    }

    async function verifyStaged() {
      const names = (state.status?.plugins ?? []).filter((plugin) => plugin.staged).map((plugin) => plugin.name)
      if (names.length === 0) return
      patch({ busy: 'verify', error: null, blockers: [] })
      try {
        const data = await api('verify', { names })
        patch({ status: data.status, busy: null })
      } catch (error) {
        patch({ busy: null, error: error instanceof Error ? error.message : String(error) })
      }
    }

    async function repairAndContinue() {
      if (state.busy) return
      const bridge = globalThis.dshDesktop?.updates
      if (bridge === undefined) {
        patch({ error: t('desktopOnly') })
        return
      }
      const names = selectedNames()
      const hasProblems = (state.status?.plugins ?? []).some((plugin) => plugin.issues.length > 0)
      if (names.length === 0 && hasProblems) {
        patch({ error: t('noSelection') })
        return
      }
      if (names.length > 0) {
        const staged = await stageSelected()
        if (staged === undefined) return
        const applied = await applySelected(staged)
        if (applied === undefined) return
      }
      patch({ busy: 'prepare' })
      try {
        const prepared = await api('prepare', { names })
        if (!prepared.ok) {
          patch({ busy: null, blockers: prepared.blockers ?? [] })
          return
        }
        patch({ busy: 'updating', blockers: [], autoCheck: false, autoResult: null })
        await bridge.open()
        patch({ busy: null })
      } catch (error) {
        patch({ busy: null, error: error instanceof Error ? error.message : String(error) })
      }
    }

    function useNativeUpdate() {
      const [, force] = React.useReducer((value) => value + 1, 0)
      React.useEffect(() => {
        const bridge = globalThis.dshDesktop?.updates
        if (bridge === undefined) return undefined
        let alive = true
        const unsubscribe = bridge.subscribe((value) => {
          if (!alive) return
          state.native = value
          force()
        })
        bridge.status().then((value) => {
          if (!alive) return
          state.native = value
          force()
        }).catch(() => {})
        return () => {
          alive = false
          if (typeof unsubscribe === 'function') unsubscribe()
        }
      }, [])
      return state.native
    }

    function Shield({ size = 18 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 64 64',
        'aria-hidden': 'true',
        style: { display: 'block', flex: 'none' },
      },
        h('path', {
          fill: 'currentColor',
          d: 'M32 4 54 12v18c0 13.2-8.8 24.6-22 30C18.8 54.6 10 43.2 10 30V12L32 4Z',
          opacity: '0.18',
        }),
        h('path', {
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '3.6',
          strokeLinejoin: 'round',
          d: 'M32 8 50 15v15c0 11-7.2 20.6-18 25-10.8-4.4-18-14-18-25V15L32 8Z',
        }),
        h('path', {
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '4',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'm23 31 6 6 12-13',
        }),
        h('circle', { cx: '32', cy: '44', r: '2.4', fill: 'currentColor' }),
      )
    }

    function CloseIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': 'true' },
        h('path', { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', d: 'm3 3 10 10M13 3 3 13' }),
      )
    }

    function CheckIcon({ size = 13 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': 'true' },
        h('path', { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', d: 'm3 8 3 3 7-7' }),
      )
    }

    function StatusDot({ status }) {
      return h('span', { className: `ug-dot ug-dot-${status}`, 'aria-hidden': 'true' })
    }

    function Badge({ tone, children }) {
      return h('span', { className: `ug-badge ug-badge-${tone}` }, children)
    }

    function targetLabel(status) {
      return status?.targetVersion ?? status?.currentVersion ?? '—'
    }

    function issueTone(severity) {
      return severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info'
    }

    function PluginRow({ plugin, checked, onToggle }) {
      const issues = plugin.issues ?? []
      const errors = issues.filter((issue) => issue.severity === 'error').length
      const warnings = issues.filter((issue) => issue.severity === 'warning').length
      const status = errors > 0 ? 'error' : warnings > 0 ? 'warn' : 'ok'
      return h('div', { className: 'ug-plugin' },
        h('label', { className: 'ug-plugin-main' },
          h('input', {
            type: 'checkbox',
            className: 'ug-check',
            checked,
            onChange: (event) => onToggle(plugin.name, event.target.checked),
          }),
          h('span', { className: 'ug-plugin-copy' },
            h('span', { className: 'ug-plugin-title' },
              h(StatusDot, { status }),
              h('span', null, plugin.title || plugin.name),
              plugin.staged ? h(Badge, { tone: plugin.dualCompatible ? 'ok' : 'warn' }, t('staged')) : null,
              plugin.applied ? h(Badge, { tone: 'brand' }, t('applied')) : null,
            ),
            h('span', { className: 'ug-plugin-meta' },
              h('code', null, `${plugin.name}@${plugin.version}`),
              h('span', null, plugin.kind),
              plugin.staged ? h('span', { className: plugin.dualCompatible ? 'ug-ok' : 'ug-warn' }, plugin.dualCompatible ? t('dual') : t('notDual')) : null,
              plugin.staged ? h('span', { className: plugin.verified ? 'ug-ok' : 'ug-warn' }, plugin.verified ? t('verified') : t('notVerified')) : null,
            ),
          ),
          h('span', { className: `ug-count ug-count-${status}` },
            status === 'ok' ? t('allGood') : `${errors > 0 ? `${errors} ${t('errors')}` : ''}${errors > 0 && warnings > 0 ? ' · ' : ''}${warnings > 0 ? `${warnings} ${t('warnings')}` : ''}`,
          ),
        ),
        issues.length > 0
          ? h('details', { className: 'ug-issues' },
              h('summary', null, `${t('issueList')} (${issues.length})`),
              h('ul', null, issues.map((issue) => h('li', { key: issue.id, className: `ug-issue ug-issue-${issueTone(issue.severity)}` },
                h('span', { className: 'ug-issue-head' },
                  h('strong', null, issue.title),
                  h(Badge, { tone: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warn' : 'info' }, issue.severity),
                  h(Badge, { tone: issue.fix === 'auto' ? 'brand' : 'muted' }, issue.fix === 'auto' ? t('auto') : t('manual')),
                ),
                h('span', { className: 'ug-issue-detail' }, issue.detail),
                issue.file ? h('code', { className: 'ug-issue-file' }, issue.file) : null,
              ))),
            )
          : null,
      )
    }

    function SummaryCard({ label, value, tone }) {
      return h('div', { className: `ug-summary-card${tone ? ` ug-summary-${tone}` : ''}` },
        h('span', { className: 'ug-summary-value' }, value),
        h('span', { className: 'ug-summary-label' }, label),
      )
    }

    function Overlay() {
      useRevision()
      useNativeUpdate()
      const status = state.status
      const plugins = status?.plugins ?? []
      const busy = state.busy !== null
      const open = state.open
      const dialogRef = React.useRef(null)

      React.useEffect(() => {
        if (!open) return undefined
        if (state.status === null && state.busy === null) void runScan()
        const onKey = (event) => {
          if (event.key === 'Escape' && !busy) closeGuard()
        }
        document.addEventListener('keydown', onKey, true)
        const timer = window.setTimeout(() => dialogRef.current?.focus(), 20)
        return () => {
          document.removeEventListener('keydown', onKey, true)
          window.clearTimeout(timer)
        }
      }, [open])

      React.useEffect(() => {
        if (!open || !busy) return undefined
        if (state.busy === 'updating') return undefined
        const timer = window.setInterval(() => {
          loadStatus().catch(() => {})
        }, 1500)
        return () => window.clearInterval(timer)
      }, [open, busy])

      if (!open) return null

      const summary = status?.summary
      const target = status?.targetVersion
      const current = status?.currentVersion
      const available = status?.available
      const busyLabel = state.busy === 'scan' ? t('phaseScan')
        : state.busy === 'stage' ? t('phaseStage')
          : state.busy === 'apply' || state.busy === 'prepare' ? t('phaseApply')
            : state.busy === 'verify' ? t('phaseVerify')
              : state.busy === 'rollback' ? t('phaseRollback')
                : state.busy === 'updating' ? t('updateInProgress') : ''
      const native = state.native
      const selectedCount = selectedNames().length

      return ReactDOM.createPortal(
        h('div', { className: 'ug-overlay', role: 'presentation' },
          h('div', { className: 'ug-mask', 'aria-hidden': 'true', onClick: () => { if (!busy) closeGuard() } }),
          h('div', {
            ref: dialogRef,
            tabIndex: -1,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'ug-title',
            className: 'ug-dialog',
          },
            h('header', { className: 'ug-head' },
              h('span', { className: 'ug-mark' }, h(Shield, { size: 22 })),
              h('div', { className: 'ug-head-copy' },
                h('h2', { id: 'ug-title' }, t('title')),
                h('p', null, t('subtitle')),
              ),
              h('div', { className: 'ug-head-right' },
                target ? h('span', { className: 'ug-target' }, h('span', null, t('target')), h('strong', null, target)) : null,
                h('button', { type: 'button', className: 'ug-icon-btn', 'aria-label': t('close'), onClick: closeGuard, disabled: busy }, h(CloseIcon)),
              ),
            ),
            h('div', { className: 'ug-body' },
              state.autoCheck ? h('div', { className: 'ug-alert ug-alert-info' },
                h('strong', null, t('autoWaiting')),
              ) : null,
              state.autoResult === 'blocked' ? h('div', { className: 'ug-alert ug-alert-warn' },
                h('strong', null, t('autoBlocked')),
              ) : null,
              state.autoResult === 'passed' ? h('div', { className: 'ug-alert ug-alert-ok' },
                h('strong', null, t('autoPassed')),
              ) : null,
              state.error ? h('div', { className: 'ug-alert ug-alert-error' },
                h('strong', null, t('scanFailed')),
                h('span', null, state.error),
              ) : null,
              state.blockers.length > 0 ? h('div', { className: 'ug-alert ug-alert-warn' },
                h('strong', null, t('blockedTitle')),
                h('ul', null, state.blockers.map((blocker) => h('li', { key: blocker }, blocker))),
              ) : null,
              busyLabel ? h('div', { className: 'ug-progress', role: 'status' },
                h('span', { className: 'ug-spinner', 'aria-hidden': 'true' }),
                h('span', null, busyLabel),
              ) : null,
              status === null
                ? h('div', { className: 'ug-empty' },
                    h('div', { className: 'ug-empty-mark' }, h(Shield, { size: 34 })),
                    h('h3', null, t('idle')),
                    h('p', null, t('rerun')),
                    h('button', { type: 'button', className: 'ug-btn ug-btn-primary', onClick: runScan, disabled: busy }, t('scan')),
                  )
                : h(React.Fragment, null,
                    h('section', { className: 'ug-summary' },
                      h(SummaryCard, { label: t('current'), value: current ?? '—' }),
                      h(SummaryCard, { label: t('target'), value: target, tone: available ? 'brand' : undefined }),
                      h(SummaryCard, { label: t('plugins'), value: summary?.plugins ?? plugins.length }),
                      h(SummaryCard, { label: t('errors'), value: summary?.errors ?? 0, tone: (summary?.errors ?? 0) > 0 ? 'error' : undefined }),
                      h(SummaryCard, { label: t('warnings'), value: summary?.warnings ?? 0, tone: (summary?.warnings ?? 0) > 0 ? 'warn' : undefined }),
                      h(SummaryCard, { label: t('repairable'), value: summary?.repairable ?? 0, tone: 'ok' }),
                    ),
                    h('div', { className: 'ug-release-line' },
                      h('span', { className: available ? 'ug-ok' : 'ug-muted' }, available ? t('updateAvailable') : t('upToDate')),
                      h('span', { className: 'ug-muted' }, t('source') + ': ' + (status.source ?? 'feed')),
                      status.simulated ? h(Badge, { tone: 'warn' }, t('simulate')) : null,
                    ),
                    h('section', { className: 'ug-section' },
                      h('div', { className: 'ug-section-head' },
                        h('h3', null, `${t('plugins')} · ${plugins.length}`),
                        h('div', { className: 'ug-section-actions' },
                          h('button', { type: 'button', className: 'ug-link-btn', onClick: selectProblems, disabled: busy }, t('selectProblems')),
                          h('button', { type: 'button', className: 'ug-link-btn', onClick: selectAll, disabled: busy }, t('selectAll')),
                        ),
                      ),
                      plugins.length === 0
                        ? h('p', { className: 'ug-muted ug-pad' }, t('emptyPlugins'))
                        : h('div', { className: 'ug-plugin-list' }, plugins.map((plugin) => h(PluginRow, {
                            key: plugin.name,
                            plugin,
                            checked: state.selected[plugin.name] === true,
                            onToggle: (name, checked) => patch({ selected: { ...state.selected, [name]: checked } }),
                          }))),
                    ),
                    h('details', {
                      className: 'ug-upstream',
                      open: state.showUpstream,
                      onToggle: (event) => patch({ showUpstream: event.currentTarget.open }),
                    },
                      h('summary', null,
                        h('span', null, t('upstream')),
                        status.upstream?.ok
                          ? h('span', { className: 'ug-muted' }, t('commits', { count: status.upstream.commits }))
                          : h('span', { className: 'ug-warn' }, t('noUpstream')),
                      ),
                      status.upstream?.ok
                        ? h('div', { className: 'ug-upstream-body' },
                            h('div', { className: 'ug-upstream-meta' },
                              h('span', null, `${status.upstream.files} ${t('fullReport')}`),
                              h('a', { href: status.upstream.url, target: '_blank', rel: 'noreferrer' }, 'GitHub compare ↗'),
                            ),
                            status.upstream.changedPackages?.length > 0
                              ? h('div', { className: 'ug-pkgs' }, status.upstream.changedPackages.map((pkg) => h('code', { key: pkg.name, title: `${pkg.files} files` }, pkg.name)))
                              : h('p', { className: 'ug-muted' }, t('noUpstream')),
                          )
                        : h('p', { className: 'ug-pad ug-muted' }, status.upstream?.error ?? t('noUpstream')),
                    ),
                    h('div', { className: 'ug-native' },
                      h('span', { className: 'ug-native-title' }, t('nativeTitle')),
                      h('span', { className: native ? `ug-native-${native.phase}` : 'ug-muted' },
                        native === null || native === undefined ? t('nativeIdle') : `${native.phase}${native.percent !== undefined ? ` · ${native.percent}%` : ''}${native.version ? ` · ${native.version}` : ''}`),
                      h('span', { className: 'ug-muted' }, t('safety')),
                    ),
                    h('div', { className: 'ug-advanced' },
                      h('div', null,
                        h('strong', null, t('advanced')),
                        h('p', null, t('advancedHint')),
                      ),
                      h('input', {
                        type: 'text',
                        value: state.targetInput,
                        placeholder: t('placeholder'),
                        onChange: (event) => patch({ targetInput: event.target.value }),
                        disabled: busy,
                        'aria-label': t('advanced'),
                      }),
                    ),
                  ),
            ),
            h('footer', { className: 'ug-foot' },
              h('div', { className: 'ug-foot-info' },
                selectedCount > 0 ? t('selected', { count: selectedCount }) : t('noSelection'),
                status?.phase === 'ready' && (summary?.errors ?? 0) === 0 && (summary?.warnings ?? 0) === 0
                  ? h('span', { className: 'ug-ok' }, ` · ${t('ok')}`)
                  : null,
              ),
              h('div', { className: 'ug-foot-actions' },
                plugins.some((plugin) => plugin.applied)
                  ? h('button', { type: 'button', className: 'ug-btn', onClick: rollbackApplied, disabled: busy }, t('rollback'))
                  : null,
                plugins.some((plugin) => plugin.staged)
                  ? h('button', { type: 'button', className: 'ug-btn', onClick: verifyStaged, disabled: busy }, t('verify'))
                  : null,
                h('button', { type: 'button', className: 'ug-btn', onClick: runScan, disabled: busy }, t('refresh')),
                h('button', { type: 'button', className: 'ug-btn', onClick: repairOnly, disabled: busy }, t('onlySafe')),
                h('button', { type: 'button', className: 'ug-btn ug-btn-primary', onClick: repairAndContinue, disabled: busy }, t('continueUpdate')),
              ),
            ),
          ),
        ),
        document.body,
      )
    }

    function FooterAction({ wide }) {
      useRevision()
      const status = state.status
      const hasIssues = (status?.summary?.errors ?? 0) > 0
      const available = status?.available === true
      return h('button', {
        type: 'button',
        className: `ug-foot-trigger${wide ? ' ug-foot-trigger-wide' : ''}`,
        onClick: openGuard,
        title: t('openGuard'),
        'aria-label': t('openGuard'),
      },
        h('span', { className: 'ug-foot-shield' }, h(Shield, { size: wide ? 16 : 18 })),
        wide ? h('span', { className: 'ug-foot-label' }, t('nav')) : null,
        available || hasIssues ? h('span', { className: `ug-foot-dot${hasIssues ? ' ug-foot-dot-error' : ''}`, 'aria-hidden': 'true' }) : null,
      )
    }

    function SettingsSection() {
      useRevision()
      const status = state.status
      const summary = status?.summary
      return h('div', { className: 'ug-settings' },
        h('div', { className: 'ug-settings-head' },
          h('span', { className: 'ug-mark' }, h(Shield, { size: 20 })),
          h('div', null,
            h('h3', null, t('settingsTitle')),
            h('p', null, t('settingsBody')),
          ),
        ),
        status === null
          ? h('p', { className: 'ug-muted' }, t('idle'))
          : h('div', { className: 'ug-settings-facts' },
              h('span', null, `${t('current')}: `, h('code', null, status.currentVersion)),
              h('span', null, `${t('target')}: `, h('code', null, status.targetVersion ?? '—')),
              h('span', { className: (summary?.errors ?? 0) > 0 ? 'ug-warn' : 'ug-ok' },
                `${summary?.errors ?? 0} ${t('errors')} · ${summary?.warnings ?? 0} ${t('warnings')}`),
            ),
        h('div', { className: 'ug-settings-actions' },
          h('button', { type: 'button', className: 'ug-btn ug-btn-primary', onClick: openGuard }, t('openGuard')),
          h('button', { type: 'button', className: 'ug-btn', onClick: runScan }, t('refresh')),
        ),
      )
    }

    const STYLES = `
.ug-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;pointer-events:auto}
.ug-mask{position:absolute;inset:0;background:color-mix(in srgb,var(--dsw-alias-bg-base,#111) 62%,transparent);backdrop-filter:blur(2px)}
.ug-dialog{position:relative;display:flex;flex-direction:column;width:min(940px,100%);max-height:min(860px,88vh);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 24px 80px rgba(0,0,0,.32);outline:none;overflow:hidden;font:inherit}
.ug-head{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 15px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.ug-mark{display:inline-flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary)}
.ug-head-copy{min-width:0;flex:1}
.ug-head-copy h2{margin:0;font-size:16px;font-weight:650;letter-spacing:-.01em;line-height:1.3}
.ug-head-copy p{margin:3px 0 0;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.ug-head-right{display:flex;align-items:center;gap:8px;flex:none}
.ug-target{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.ug-target strong{color:var(--dsw-alias-label-primary);font-weight:600}
.ug-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.ug-icon-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.ug-body{flex:1;min-height:0;overflow:auto;padding:16px 20px 18px;display:flex;flex-direction:column;gap:14px}
.ug-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
.ug-summary-card{display:flex;flex-direction:column;gap:2px;min-width:0;padding:10px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.ug-summary-value{font-size:18px;font-weight:650;line-height:1.15;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ug-summary-label{font-size:10.5px;line-height:1.3;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.05em}
.ug-summary-brand .ug-summary-value{color:var(--dsw-alias-brand-primary)}
.ug-summary-error .ug-summary-value{color:var(--dsw-alias-state-error-primary)}
.ug-summary-warn .ug-summary-value{color:var(--dsw-alias-state-warn-primary)}
.ug-summary-ok .ug-summary-value{color:var(--dsw-alias-state-success-primary)}
.ug-release-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:12px;line-height:1.5}
.ug-section{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden}
.ug-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.ug-section-head h3{margin:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.045em}
.ug-section-actions{display:flex;gap:10px}
.ug-link-btn{border:0;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:11.5px;cursor:pointer;padding:2px 0}
.ug-link-btn:hover{text-decoration:underline}
.ug-plugin{border-bottom:1px solid var(--dsw-alias-border-l1)}
.ug-plugin:last-child{border-bottom:0}
.ug-plugin-main{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;cursor:pointer}
.ug-plugin-main:hover{background:var(--dsw-alias-bg-layer-1)}
.ug-check{margin:2px 0 0;accent-color:var(--dsw-alias-brand-primary);flex:none}
.ug-plugin-copy{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.ug-plugin-title{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12.5px;font-weight:600;line-height:1.4}
.ug-plugin-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 9px;font-size:10.5px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
.ug-plugin-meta code{font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;padding:1px 4px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);overflow-wrap:anywhere}
.ug-count{flex:none;max-width:44%;font-size:10.5px;line-height:1.4;text-align:right;color:var(--dsw-alias-label-secondary)}
.ug-count-ok{color:var(--dsw-alias-state-success-primary)}
.ug-count-error{color:var(--dsw-alias-state-error-primary)}
.ug-count-warn{color:var(--dsw-alias-state-warn-primary)}
.ug-issues{padding:0 12px 10px 33px}
.ug-issues summary{font-size:11px;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none}
.ug-issues ul{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:7px}
.ug-issue{display:flex;flex-direction:column;gap:3px;padding:8px 9px;border:1px solid var(--dsw-alias-border-l1);border-left-width:3px;border-radius:7px;background:var(--dsw-alias-bg-layer-1);font-size:11px;line-height:1.5}
.ug-issue-error{border-left-color:var(--dsw-alias-state-error-primary)}
.ug-issue-warn{border-left-color:var(--dsw-alias-state-warn-primary)}
.ug-issue-info{border-left-color:var(--dsw-alias-border-l2)}
.ug-issue-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ug-issue-head strong{font-weight:600}
.ug-issue-detail{color:var(--dsw-alias-label-secondary);white-space:pre-wrap;overflow-wrap:anywhere}
.ug-issue-file{font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:4px;padding:1px 4px;align-self:flex-start}
.ug-badge{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:999px;border:1px solid transparent;font-size:9.5px;font-weight:600;line-height:1;white-space:nowrap}
.ug-badge-ok{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent);color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 22%,transparent)}
.ug-badge-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent);color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 22%,transparent)}
.ug-badge-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 22%,transparent)}
.ug-badge-brand{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}
.ug-badge-info,.ug-badge-muted{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-border-l1)}
.ug-dot{display:inline-block;flex:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-secondary)}
.ug-dot-ok{background:var(--dsw-alias-state-success-primary)}
.ug-dot-warn{background:var(--dsw-alias-state-warn-primary)}
.ug-dot-error{background:var(--dsw-alias-state-error-primary)}
.ug-ok{color:var(--dsw-alias-state-success-primary)}
.ug-warn{color:var(--dsw-alias-state-warn-primary)}
.ug-muted{color:var(--dsw-alias-label-secondary)}
.ug-pad{padding:10px 12px}
.ug-alert{display:flex;flex-direction:column;gap:3px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;font-size:11.5px;line-height:1.5}
.ug-alert-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 24%,transparent)}
.ug-alert-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 24%,transparent)}
.ug-alert-ok{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 8%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 24%,transparent);color:var(--dsw-alias-state-success-primary)}
.ug-alert-info{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}
.ug-alert ul{margin:3px 0 0;padding-left:16px}
.ug-progress{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--dsw-alias-label-secondary);padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.ug-spinner{width:14px;height:14px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:ug-spin .8s linear infinite;flex:none}
.ug-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:46px 24px;text-align:center}
.ug-empty-mark{color:var(--dsw-alias-brand-primary);opacity:.85}
.ug-empty h3{margin:2px 0 0;font-size:16px}
.ug-empty p{margin:0;max-width:460px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.ug-empty .ug-btn{margin-top:8px}
.ug-upstream{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.ug-upstream summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;font-size:12px;font-weight:600;cursor:pointer;user-select:none}
.ug-upstream-body{display:flex;flex-direction:column;gap:8px;padding:0 12px 12px}
.ug-upstream-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.ug-upstream-meta a{color:var(--dsw-alias-brand-primary);text-decoration:none}
.ug-pkgs{display:flex;flex-wrap:wrap;gap:5px}
.ug-pkgs code{font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:9.5px;padding:2px 5px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.ug-native{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:9px 11px;border:1px dashed var(--dsw-alias-border-l1);border-radius:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.ug-native-title{font-weight:600;color:var(--dsw-alias-label-primary)}
.ug-native>.ug-muted:last-child{margin-left:auto;max-width:58%;text-align:right;font-size:10px;line-height:1.4}
.ug-native-installing,.ug-native-downloading,.ug-native-verifying{color:var(--dsw-alias-brand-primary)}
.ug-native-error{color:var(--dsw-alias-state-error-primary)}
.ug-advanced{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.ug-advanced strong{font-size:11.5px}
.ug-advanced p{margin:2px 0 0;font-size:10.5px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.ug-advanced input{width:180px;flex:none;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px}
.ug-advanced input:focus{outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent);outline-offset:1px;border-color:var(--dsw-alias-brand-primary)}
.ug-foot{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.ug-foot-info{font-size:11px;color:var(--dsw-alias-label-secondary);min-width:0}
.ug-foot-actions{display:flex;align-items:center;gap:8px;flex:none}
.ug-btn{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;font-weight:550;line-height:1;white-space:nowrap;cursor:pointer;transition:background-color .12s ease,border-color .12s ease,opacity .12s ease}
.ug-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.ug-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.ug-btn:disabled{opacity:.5;cursor:default}
.ug-btn-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff}
.ug-btn-primary:hover{background:var(--dsw-alias-brand-primary);filter:brightness(1.06)}
.ug-foot-trigger{display:inline-flex;align-items:center;justify-content:center;gap:6px;position:relative;height:30px;width:30px;padding:0;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;font-weight:550;cursor:pointer}
.ug-foot-trigger-wide{width:auto;padding:0 8px;justify-content:flex-start}
.ug-foot-trigger:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.ug-foot-shield{display:inline-flex;align-items:center;justify-content:center}
.ug-foot-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ug-foot-dot{position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px var(--dsw-alias-bg-base)}
.ug-foot-dot-error{background:var(--dsw-alias-state-error-primary)}
.ug-settings{display:flex;flex-direction:column;gap:14px;padding:18px 20px;color:var(--dsw-alias-label-primary)}
.ug-settings-head{display:flex;gap:12px;align-items:flex-start}
.ug-settings-head h3{margin:0;font-size:14px}
.ug-settings-head p{margin:4px 0 0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);max-width:620px}
.ug-settings-facts{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}
.ug-settings-facts code{font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10.5px}
.ug-settings-actions{display:flex;gap:8px;flex-wrap:wrap}
@keyframes ug-spin{to{transform:rotate(360deg)}}
@media (max-width:860px){.ug-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.ug-foot{flex-wrap:wrap}.ug-foot-actions{width:100%;justify-content:flex-end}.ug-native>.ug-muted:last-child{max-width:100%;text-align:left;margin-left:0}.ug-advanced{flex-direction:column;align-items:stretch}.ug-advanced input{width:100%}}
@media (max-width:620px){.ug-overlay{padding:0}.ug-dialog{width:100%;max-height:100vh;height:100vh;border-radius:0;border:0}.ug-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.ug-foot-actions{flex-wrap:wrap}.ug-btn{flex:1}.ug-head{padding:14px}.ug-body{padding:12px}.ug-count{display:none}}
@media (prefers-reduced-motion:reduce){.ug-spinner{animation:none}}
`

    // The capture listener closes the last gap between a user clicking the
    // shell-owned account-row update control and that control calling the
    // native bridge. It never touches the DOM; it only refuses that one click.
    const interceptUpdateClick = (event) => {
      if (state.status?.config?.blockNativeUpdate === false) return
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest('button')
      if (button === null) return
      const className = typeof button.className === 'string' ? button.className : ''
      const label = button.getAttribute('aria-label')
      if (label === null || label.trim() === '') return
      const labelledUpdate = /^(?:Update|更新|新版本|Aktualisieren|Actualizar|Mettre à jour|Обновить|Atualizar|アップデート)$/i.test(label.trim())
      const insideDialog = button.closest('[role="dialog"]') !== null
      if (!className.includes('_indicator') && !(insideDialog && labelledUpdate)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (state.busy) {
        openGuard()
        return
      }
      patch({ open: true, autoCheck: true, autoResult: null, error: null, blockers: [] })
      void runScan({ auto: true })
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const locale = ctx.get('locale')
        if (locale !== undefined && typeof locale.register === 'function') {
          ctx.effect(() => {
            const dispose = locale.register(NS, { en: EN, zh: ZH })
            return typeof dispose === 'function' ? dispose : () => {}
          }, 'update-guard: locale dictionary')
          if (typeof locale.bind === 'function') {
            try {
              translate = locale.bind(NS)
            } catch {
              translate = null
            }
          }
        }

        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = '@local/dsh-update-guard'
          tag.dataset.pluginCss = '@local/dsh-update-guard/update-guard.css'
          tag.textContent = STYLES
          document.head.appendChild(tag)
          return () => tag.remove()
        }, 'update-guard: stylesheet')

        ctx.effect(() => {
          document.addEventListener('click', interceptUpdateClick, true)
          return () => document.removeEventListener('click', interceptUpdateClick, true)
        }, 'update-guard: native update click interception')

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'update-guard',
          locale: NS,
        }, Overlay))

        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'update-guard',
          order: 40,
          label: () => t('nav'),
          locale: NS,
        }, FooterAction))

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'update-guard',
          order: 30,
          label: () => t('nav'),
          locale: NS,
        }, SettingsSection))

        ctx.effect(() => () => {
          state.open = false
          state.status = null
          state.selected = {}
          translate = null
          emit()
        }, 'update-guard: client state')
      },
      components: { Overlay, FooterAction, SettingsSection },
    }
  },
})
