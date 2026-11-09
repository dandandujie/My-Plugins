window.__ModuleLoader__.load({
  id: '@local/dsh-learnharness',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const STATUS_URL = '/learnharness/status'
    const START_URL = '/learnharness/start'
    const UPDATE_STATUS_URL = '/learnharness/update/status'
    const UPDATE_URL = '/learnharness/update'
    const NAMESPACE = 'learnharness'
    const LANG_KEY = 'dsh.learnharness.language'
    const POLL_MS = 8000
    const UPDATE_POLL_MS = 12000

    const EN = {
      panelTitle: 'LearnHarness',
      brand: 'LearnHarness',
      kicker: 'Teach · Practice · Graph',
      statusOnline: 'Live',
      statusStarting: 'Warming up',
      statusOffline: 'Offline',
      statusError: 'Needs attention',
      statusChecking: 'Connecting',
      refresh: 'Reload panel',
      openExternal: 'Open in tab',
      retry: 'Retry',
      start: 'Start LearnHarness',
      starting: 'Starting…',
      startFailed: 'Could not start LearnHarness',
      offlineTitle: 'Your learning space is not running yet',
      offlineBody:
        'LearnHarness keeps its own local server so the complete teaching, practice, and knowledge-graph experience stays intact. Start it here; the panel will open as soon as it is ready.',
      errorTitle: 'LearnHarness needs a hand',
      errorBody:
        'The local server did not come up. Check the message below, then retry. The first build after a source update can take a minute.',
      checkingTitle: 'Opening your learning space',
      checkingBody: 'Connecting to the local LearnHarness server…',
      startingTitle: 'Warming up the learning space',
      startingBody:
        'The local server is booting. This normally takes a few seconds; the panel opens automatically when it is ready.',
      disconnectedTitle: 'Connection interrupted',
      disconnectedBody: 'The LearnHarness server stopped. Start it again to continue where you left off.',
      log: 'Server log',
      dataLabel: 'Records',
      versionLabel: 'Version',
      docs: 'All features stay local',
      frameTitle: 'LearnHarness learning workspace',
      copied: 'Copied',
      copy: 'Copy',
      hostMissing: 'The plugin host route is not available. Reload the Harness page, then retry.',
      startHint: 'The first launch initializes your local data folder.',
      switchLanguage: 'Switch to Chinese',
      langButton: '中',
      updateNav: 'Update',
      updateNavTitle: 'Update LearnHarness',
      updateAvailable: 'Upstream update available',
      updateShort: 'Update',
      updating: 'Updating…',
      updateTitle: 'Updating LearnHarness',
      updateBody:
        'Pulling the upstream source, rebuilding the local server, and restarting the learning space. This can take a few minutes; the panel returns automatically when done.',
      updateFailedTitle: 'Update failed',
      updateFailedBody: 'The previous build was restored. Check the log, then try again.',
      retryUpdate: 'Retry update',
      updateLog: 'Update log',
      updateBehind: 'New upstream commits are available.',
      phaseChecking: 'Checking upstream',
      phaseStopping: 'Stopping the local server',
      phaseBackup: 'Backing up the current build',
      phasePulling: 'Pulling source',
      phasePatching: 'Reapplying panel patches',
      phaseInstalling: 'Installing dependencies',
      phaseBuilding: 'Building the new server',
      phaseRestarting: 'Restarting',
      phaseComplete: 'Update complete',
      phaseError: 'Update failed',
      phaseIdle: 'Up to date',
      phaseAvailable: 'Update available',
      checkUpdate: 'Check for updates',
      checkingUpdate: 'Checking for updates…',
      upToDate: 'Up to date',
    }

    const ZH = {
      panelTitle: 'LearnHarness 学习台',
      brand: 'LearnHarness',
      kicker: '教学 · 练习 · 知识图谱',
      statusOnline: '已运行',
      statusStarting: '启动中',
      statusOffline: '未连接',
      statusError: '需要处理',
      statusChecking: '连接中',
      refresh: '重载面板',
      openExternal: '新标签打开',
      retry: '重试',
      start: '启动 LearnHarness',
      starting: '正在启动…',
      startFailed: 'LearnHarness 启动失败',
      offlineTitle: '学习空间还没有启动',
      offlineBody:
        'LearnHarness 自带本地服务，完整保留教学、练习与知识图谱体验。在这里启动即可，就绪后面板会自动打开。',
      errorTitle: 'LearnHarness 需要处理一下',
      errorBody: '本地服务没有起来。看看下面的信息，然后重试。源码更新后的首次构建可能需要一分钟。',
      checkingTitle: '正在打开学习空间',
      checkingBody: '正在连接本地 LearnHarness 服务…',
      startingTitle: '学习空间正在预热',
      startingBody: '本地服务正在启动，通常只需要几秒；就绪后会自动进入。',
      disconnectedTitle: '连接中断',
      disconnectedBody: 'LearnHarness 服务已停止。重新启动后可以接着上次的进度继续。',
      log: '服务日志',
      dataLabel: '学习记录',
      versionLabel: '版本',
      docs: '所有功能都在本地',
      frameTitle: 'LearnHarness 学习工作台',
      copied: '已复制',
      copy: '复制',
      hostMissing: '插件宿主的控制路由未加载。请刷新 Harness 页面后重试。',
      startHint: '首次启动会在本地建立数据目录。',
      switchLanguage: '切换到 English',
      langButton: 'EN',
      updateNav: '更新',
      updateNavTitle: '更新 LearnHarness',
      updateAvailable: '发现上游更新',
      updateShort: '更新',
      updating: '更新中…',
      updateTitle: '正在更新 LearnHarness',
      updateBody: '正在拉取上游源码、重新构建本地服务并重启学习空间。可能需要几分钟，完成后面板会自动回来。',
      updateFailedTitle: '更新失败',
      updateFailedBody: '已恢复到更新前的版本。查看日志后可以重试。',
      retryUpdate: '重试更新',
      updateLog: '更新日志',
      updateBehind: '上游有新的提交。',
      phaseChecking: '检查上游',
      phaseStopping: '停止本地服务',
      phaseBackup: '备份当前构建',
      phasePulling: '拉取源码',
      phasePatching: '重新应用面板补丁',
      phaseInstalling: '安装依赖',
      phaseBuilding: '构建新服务',
      phaseRestarting: '重新启动',
      phaseComplete: '更新完成',
      phaseError: '更新失败',
      phaseIdle: '已是最新',
      phaseAvailable: '有可用更新',
      checkUpdate: '检查更新',
      checkingUpdate: '正在检查更新…',
      upToDate: '已是最新',
    }

    const STYLES = `
.lh-root{display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;padding-top:var(--dsh-frame-top-clearance,0px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;isolation:isolate}
.lh-bar{display:flex;flex:0 0 auto;align-items:center;gap:10px;min-height:48px;padding:0 10px 0 14px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.lh-mark{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(145deg,#29251d 0%,#15130f 100%);color:#f4e8d2;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 1px 2px rgba(0,0,0,.25)}
.lh-headings{display:flex;flex-direction:column;gap:1px;min-width:0}
.lh-title{overflow:hidden;font-size:13px;font-weight:650;line-height:1.2;letter-spacing:-.01em;text-overflow:ellipsis;white-space:nowrap}
.lh-kicker{overflow:hidden;font-size:9.5px;font-weight:500;line-height:1.25;letter-spacing:.075em;color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}
.lh-spacer{flex:1 1 auto;min-width:8px}
.lh-pill{display:inline-flex;align-items:center;gap:6px;height:23px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);font-size:10.5px;font-weight:550;line-height:1;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.lh-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:0 0 auto}
.lh-dot[data-state='online']{background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
.lh-dot[data-state='starting'],.lh-dot[data-state='checking']{background:var(--dsw-alias-state-warn-primary);animation:lh-pulse 1.4s ease-in-out infinite}
.lh-dot[data-state='offline'],.lh-dot[data-state='error']{background:var(--dsw-alias-state-error-primary)}
.lh-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;font-weight:550;line-height:1;white-space:nowrap;cursor:pointer;transition:background-color .12s ease,color .12s ease,border-color .12s ease}
.lh-action:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.lh-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.lh-action:disabled{opacity:.55;cursor:default}
.lh-action.lh-icon{width:28px;padding:0}
.lh-action.lh-primary{border-color:transparent;background:var(--dsw-alias-brand-primary);color:#fff}
.lh-action.lh-primary:hover{background:var(--dsw-alias-brand-primary);color:#fff;filter:brightness(1.06)}
.lh-lang{width:32px;padding:0;font-size:10.5px;letter-spacing:.02em}
.lh-body{position:relative;display:flex;flex:1 1 auto;flex-direction:column;min-height:0;background:#0d0d0c}
.lh-frame{display:block;flex:1 1 auto;width:100%;height:100%;min-height:0;border:0;background:#0d0d0c;color-scheme:dark}
.lh-banner{display:flex;flex:0 0 auto;align-items:center;gap:9px;padding:7px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);font-size:11.5px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.lh-banner .lh-dot{flex:0 0 auto}
.lh-hero{position:relative;display:flex;flex:1 1 auto;flex-direction:column;align-items:center;justify-content:center;gap:11px;padding:32px 28px 40px;overflow:auto;text-align:center;background:radial-gradient(ellipse 75% 60% at 50% 30%,color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent) 0%,transparent 72%),var(--dsw-alias-bg-base)}
.lh-orb{display:flex;align-items:center;justify-content:center;width:60px;height:60px;margin-bottom:3px;border:1px solid var(--dsw-alias-border-l1);border-radius:17px;background:linear-gradient(150deg,#2a261e 0%,#14120e 100%);color:#f4e8d2;box-shadow:0 8px 24px rgba(0,0,0,.18),inset 0 0 0 1px rgba(255,255,255,.06)}
.lh-eyebrow{margin:0;font-size:9.5px;font-weight:650;line-height:1.2;letter-spacing:.12em;color:var(--dsw-alias-brand-primary);text-transform:uppercase}
.lh-hero h1{max-width:560px;margin:0;font-size:25px;font-weight:620;line-height:1.18;letter-spacing:-.025em}
.lh-hero p{max-width:520px;margin:0;font-size:13px;line-height:1.68;color:var(--dsw-alias-label-secondary)}
.lh-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;margin-top:7px}
.lh-progress{position:relative;width:min(260px,60vw);height:3px;margin-top:3px;overflow:hidden;border-radius:999px;background:var(--dsw-alias-border-l1)}
.lh-progress::after{content:'';position:absolute;top:0;bottom:0;width:38%;border-radius:inherit;background:var(--dsw-alias-brand-primary);animation:lh-slide 1.35s ease-in-out infinite}
.lh-detail{width:min(560px,100%);max-height:132px;overflow:auto;margin:6px 0 0;padding:9px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10.5px;line-height:1.55;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}
.lh-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px 12px;margin-top:6px;font-size:10px;line-height:1.5;color:var(--dsw-alias-label-secondary);opacity:.82}
.lh-meta code{font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;overflow-wrap:anywhere}
.lh-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font-size:12px}
.lh-spinner{width:24px;height:24px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:lh-spin .8s linear infinite}
.lh-spinner.small{width:16px;height:16px;border-width:1.5px}
.lh-env{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;margin-top:2px;font-size:10px;color:var(--dsw-alias-label-secondary)}
.lh-env code{padding:2px 5px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:9.5px}
.lh-copy{height:22px;padding:0 7px;font-size:10px}
.lh-update-log{width:min(620px,100%);max-height:180px;overflow:auto;margin-top:2px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);text-align:left}
.lh-update-log summary{cursor:pointer;font-size:10.5px;font-weight:600;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.05em}
.lh-update-log pre{margin:7px 0 0;color:var(--dsw-alias-label-secondary);font-family:var(--dsh-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.lh-foot-trigger{display:inline-flex;align-items:center;justify-content:center;gap:6px;position:relative;height:30px;width:30px;padding:0;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;font-weight:550;cursor:pointer}
.lh-foot-trigger.wide{width:auto;padding:0 8px;justify-content:flex-start}
.lh-foot-trigger:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.lh-foot-trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.lh-foot-trigger:disabled{opacity:.6;cursor:default}
.lh-foot-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-foot-dot{position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px var(--dsw-alias-bg-base)}
.lh-foot-dot.error{background:var(--dsw-alias-state-error-primary)}
.lh-foot-spin{display:inline-flex;animation:lh-spin .9s linear infinite}
@keyframes lh-spin{to{transform:rotate(360deg)}}
@keyframes lh-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes lh-slide{0%{left:-40%}55%,100%{left:100%}}
@media (max-width:720px){.lh-kicker{display:none}.lh-pill span{display:none}.lh-pill{padding:0 7px}.lh-action .lh-label{display:none}.lh-action{width:28px;padding:0}.lh-hero{padding:24px 18px 32px}.lh-hero h1{font-size:22px}.lh-lang{width:28px}}
@media (prefers-reduced-motion:reduce){.lh-dot,.lh-progress::after,.lh-spinner,.lh-foot-spin{animation:none}.lh-progress::after{left:30%;width:40%}}
`

    // ─── Language ─────────────────────────────────────────────────────────
    // Default Chinese, independent of the Harness locale. The choice persists
    // per browser; the switch is in the panel header.
    let language = readLanguage()
    const languageListeners = new Set()

    function readLanguage() {
      try {
        const stored = window.localStorage.getItem(LANG_KEY)
        if (stored === 'zh' || stored === 'en') return stored
      } catch {
        /* storage can be unavailable in strict contexts */
      }
      return 'zh'
    }

    function setLanguage(next) {
      if (next !== 'zh' && next !== 'en') return
      language = next
      try {
        window.localStorage.setItem(LANG_KEY, next)
      } catch {
        /* in-memory choice still applies */
      }
      for (const listener of languageListeners) listener()
    }

    function subscribeLanguage(listener) {
      languageListeners.add(listener)
      return () => languageListeners.delete(listener)
    }

    function useLanguage() {
      return React.useSyncExternalStore(subscribeLanguage, () => language)
    }

    function t(key) {
      return (language === 'en' ? EN : ZH)[key] ?? key
    }

    // ─── Update state ─────────────────────────────────────────────────────
    let update = {
      phase: 'idle',
      checking: false,
      updating: false,
      available: false,
      behind: 0,
      subject: '',
      error: '',
      logTail: '',
    }
    const updateListeners = new Set()

    function publishUpdate(next) {
      if (!next || typeof next !== 'object') return
      const merged = { ...update, ...next }
      if (
        merged.phase === update.phase &&
        merged.checking === update.checking &&
        merged.updating === update.updating &&
        merged.available === update.available &&
        merged.behind === update.behind &&
        merged.subject === update.subject &&
        merged.error === update.error &&
        merged.logTail === update.logTail
      ) {
        return
      }
      update = merged
      for (const listener of updateListeners) listener()
    }

    function subscribeUpdate(listener) {
      updateListeners.add(listener)
      return () => updateListeners.delete(listener)
    }

    function useUpdate() {
      return React.useSyncExternalStore(subscribeUpdate, () => update)
    }

    async function refreshUpdate() {
      try {
        const response = await fetch(UPDATE_STATUS_URL, { cache: 'no-store' })
        if (!response.ok) return null
        const data = await response.json()
        publishUpdate(data)
        return data
      } catch {
        return null
      }
    }

    async function startUpdate() {
      if (update.updating) return
      publishUpdate({ updating: true, phase: 'checking', error: '' })
      try {
        const response = await fetch(UPDATE_URL, { method: 'POST', cache: 'no-store' })
        const data = await response.json().catch(() => null)
        if (data && data.update) publishUpdate(data.update)
        else if (!response.ok) publishUpdate({ updating: false, error: `HTTP ${response.status}` })
      } catch (error) {
        publishUpdate({ updating: false, error: String(error && error.message ? error.message : error) })
      }
      await refreshUpdate()
    }

    // ─── Small glyphs ─────────────────────────────────────────────────────
    function markPath(size) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 32 32',
          fill: 'none',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', {
          d: 'M6.4 9.1c2.9-1.35 5.5-1.15 7.7.65v14.1c-2.2-1.8-4.8-2-7.7-.65V9.1Z',
          stroke: 'currentColor',
          strokeWidth: 1.45,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M25.6 9.1c-2.9-1.35-5.5-1.15-7.7.65v14.1c2.2-1.8 4.8-2 7.7-.65V9.1Z',
          stroke: 'currentColor',
          strokeWidth: 1.45,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M14.1 9.75v14.1M17.9 9.75v14.1',
          stroke: 'currentColor',
          strokeWidth: 1.1,
          strokeLinecap: 'round',
          opacity: 0.55,
        }),
        h('path', {
          d: 'M23.2 5.6v4.1M21.15 7.65h4.1',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
      )
    }

    function Mark(props) {
      return markPath(props && props.size ? props.size : 18)
    }

    function RefreshGlyph() {
      return h(
        'svg',
        { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M13.2 8a5.2 5.2 0 1 1-1.6-3.75',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M13.4 2.4v3.2h-3.2',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    function UpdateGlyph() {
      return h(
        'svg',
        { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M8 2.4v7.2',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M5.2 7 8 9.8 10.8 7',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M3 12.4h10',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
        }),
      )
    }

    function ExternalGlyph() {
      return h(
        'svg',
        { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M9.2 2.6h4.2v4.2',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M13.4 2.6 7.9 8.1',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M12.1 9.6v2.8a1 1 0 0 1-1 1H3.6a1 1 0 0 1-1-1V4.9a1 1 0 0 1 1-1h2.8',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
        }),
      )
    }

    function CopyGlyph() {
      return h(
        'svg',
        { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('rect', {
          x: 5.4,
          y: 5.4,
          width: 7.2,
          height: 7.2,
          rx: 1.2,
          stroke: 'currentColor',
          strokeWidth: 1.3,
        }),
        h('path', {
          d: 'M10.6 5.4V4.4a1 1 0 0 0-1-1H4.4a1 1 0 0 0-1 1v5.2a1 1 0 0 0 1 1h1',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
      )
    }

    function ActionButton(props) {
      return h(
        'button',
        {
          type: 'button',
          className: `lh-action${props.iconOnly ? ' lh-icon' : ''}${props.tone === 'primary' ? ' lh-primary' : ''}`,
          onClick: props.onClick,
          title: props.title,
          'aria-label': props.title,
          disabled: props.disabled === true,
        },
        props.icon ?? null,
        props.label && !props.iconOnly ? h('span', { className: 'lh-label' }, props.label) : null,
      )
    }

    function phaseOf(status) {
      if (!status) return 'checking'
      if (status.online) return 'online'
      if (status.phase === 'starting' || status.starting) return 'starting'
      if (status.phase === 'error') return 'error'
      return 'offline'
    }

    function statusLabel(phase) {
      if (phase === 'online') return t('statusOnline')
      if (phase === 'starting') return t('statusStarting')
      if (phase === 'error') return t('statusError')
      if (phase === 'checking') return t('statusChecking')
      return t('statusOffline')
    }

    function updatePhaseLabel(phase) {
      const map = {
        checking: 'phaseChecking',
        stopping: 'phaseStopping',
        backup: 'phaseBackup',
        pulling: 'phasePulling',
        patching: 'phasePatching',
        installing: 'phaseInstalling',
        building: 'phaseBuilding',
        restarting: 'phaseRestarting',
        complete: 'phaseComplete',
        error: 'phaseError',
        available: 'phaseAvailable',
        idle: 'phaseIdle',
      }
      return t(map[phase] ?? 'phaseIdle')
    }

    // ─── Update progress surface ──────────────────────────────────────────
    function UpdateProgress() {
      const current = useUpdate()
      const [retrying, setRetrying] = React.useState(false)
      const failed = current.phase === 'error'

      const retry = React.useCallback(async () => {
        if (retrying) return
        setRetrying(true)
        await startUpdate()
        if (retrying) setRetrying(false)
      }, [retrying])

      return h(
        'div',
        { className: 'lh-hero' },
        h('div', { className: 'lh-orb' }, h(Mark, { size: 38 })),
        h('p', { className: 'lh-eyebrow' }, failed ? t('updateFailedTitle') : t('updateTitle')),
        failed
          ? h('h1', null, t('updateFailedTitle'))
          : h('h1', null, t('updateTitle')),
        h('p', null, failed ? t('updateFailedBody') : t('updateBody')),
        failed
          ? h('p', { className: 'lh-detail', style: { textAlign: 'left' } }, current.error || t('updateFailedBody'))
          : h('div', { className: 'lh-progress', 'aria-hidden': 'true' }),
        !failed
          ? h(
              'p',
              { className: 'lh-meta' },
              h('span', { className: 'lh-spinner small' }),
              h('span', null, updatePhaseLabel(current.phase)),
              current.behind > 0 ? h('span', null, `${t('updateBehind')} ${current.behind}`) : null,
            )
          : h(
              'div',
              { className: 'lh-actions' },
              h(ActionButton, {
                title: t('retryUpdate'),
                label: retrying ? t('updating') : t('retryUpdate'),
                onClick: retry,
                disabled: retrying || current.updating,
                tone: 'primary',
              }),
              h(ActionButton, { title: t('refresh'), icon: h(RefreshGlyph, null), onClick: () => window.location.reload() }),
            ),
        current.logTail
          ? h(
              'details',
              { className: 'lh-update-log', open: failed },
              h('summary', null, t('updateLog')),
              h('pre', null, current.logTail),
            )
          : null,
        current.subject ? h('p', { className: 'lh-meta' }, current.subject) : null,
      )
    }

    function UpdateButton(props) {
      const current = useUpdate()
      const busy = current.updating
      if (!current.available && !busy) return null
      return h(ActionButton, {
        title: busy ? t('updating') : t('updateNavTitle'),
        label: busy ? t('updating') : props && props.short ? t('updateShort') : t('updateNavTitle'),
        icon: busy ? h('span', { className: 'lh-spinner small' }) : h(UpdateGlyph, null),
        onClick: startUpdate,
        disabled: busy,
        tone: 'primary',
      })
    }

    // ─── LearnHarness panel ───────────────────────────────────────────────
    function LearnPanel() {
      useLanguage()
      const currentUpdate = useUpdate()
      const [status, setStatus] = React.useState(null)
      const [phase, setPhase] = React.useState('checking')
      const [busy, setBusy] = React.useState(false)
      const [frameKey, setFrameKey] = React.useState(0)
      const [frameLoaded, setFrameLoaded] = React.useState(false)
      const [booted, setBooted] = React.useState(false)
      const [lastUrl, setLastUrl] = React.useState(null)
      const [notice, setNotice] = React.useState('')
      const [copied, setCopied] = React.useState(false)
      const alive = React.useRef(true)
      const copyTimer = React.useRef(null)
      const pollTimer = React.useRef(null)
      const wasUpdating = React.useRef(currentUpdate.updating)
      const updatePoll = React.useRef(null)

      const applyStatus = React.useCallback(data => {
        if (!alive.current || !data || typeof data !== 'object') return
        setStatus(data)
        if (data.update) publishUpdate(data.update)
        const next = phaseOf(data)
        setPhase(next)
        if (next === 'online') {
          setBooted(true)
          if (data.url) setLastUrl(data.url)
          setNotice('')
        }
      }, [])

      const poll = React.useCallback(async () => {
        try {
          const response = await fetch(STATUS_URL, { cache: 'no-store' })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = await response.json()
          applyStatus(data)
        } catch (_) {
          if (alive.current) setPhase('offline')
        }
      }, [applyStatus])

      React.useEffect(() => {
        alive.current = true
        poll()
        pollTimer.current = setInterval(poll, POLL_MS)
        return () => {
          alive.current = false
          if (pollTimer.current) clearInterval(pollTimer.current)
          if (copyTimer.current) clearTimeout(copyTimer.current)
          if (updatePoll.current) clearInterval(updatePoll.current)
        }
      }, [poll])

      React.useEffect(() => {
        if (!currentUpdate.updating) {
          if (updatePoll.current) {
            clearInterval(updatePoll.current)
            updatePoll.current = null
          }
          return
        }
        const tick = () => void refreshUpdate()
        tick()
        updatePoll.current = setInterval(tick, 1500)
        return () => {
          if (updatePoll.current) {
            clearInterval(updatePoll.current)
            updatePoll.current = null
          }
        }
      }, [currentUpdate.updating])

      React.useEffect(() => {
        if (wasUpdating.current && !currentUpdate.updating && currentUpdate.phase === 'complete') {
          setFrameLoaded(false)
          setFrameKey(value => value + 1)
          void poll()
        }
        wasUpdating.current = currentUpdate.updating
      }, [currentUpdate.updating, currentUpdate.phase, poll])

      const start = React.useCallback(async () => {
        if (busy) return
        setBusy(true)
        setNotice('')
        try {
          const response = await fetch(START_URL, { method: 'POST', cache: 'no-store' })
          const data = await response.json().catch(() => null)
          if (response.status === 404) {
            setNotice(t('hostMissing'))
            setPhase('error')
            return
          }
          if (!data) throw new Error(`HTTP ${response.status}`)
          applyStatus(data)
          if (data.online) {
            setFrameLoaded(false)
            setFrameKey(value => value + 1)
          } else if (data.error) {
            setNotice(data.error)
          }
        } catch (error) {
          if (alive.current) {
            setNotice(String(error && error.message ? error.message : error))
            setPhase('error')
          }
        } finally {
          if (alive.current) setBusy(false)
        }
      }, [applyStatus, busy])

      const reload = React.useCallback(async () => {
        setFrameLoaded(false)
        setFrameKey(value => value + 1)
        const wasOnline = phase === 'online'
        await poll()
        if (!wasOnline) await start()
      }, [phase, poll, start])

      const openExternal = React.useCallback(() => {
        if (status && status.url) window.open(status.url, '_blank', 'noopener,noreferrer')
      }, [status])

      const copy = React.useCallback(async () => {
        const value = status && (status.error || status.logTail)
        if (!value) return
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          if (copyTimer.current) clearTimeout(copyTimer.current)
          copyTimer.current = setTimeout(() => {
            if (alive.current) setCopied(false)
          }, 1600)
        } catch (_) {
          /* selection remains available */
        }
      }, [status])

      const online = phase === 'online'
      const disconnected = booted && !online && phase !== 'checking' && !currentUpdate.updating
      const error = phase === 'error'
      const starting = phase === 'starting'
      const statusText = statusLabel(phase)
      const frameUrl = online && status && status.url ? status.url : booted ? lastUrl : null
      const detail = notice || (status && (status.error || status.logTail)) || ''
      const updateFailed = currentUpdate.phase === 'error' && currentUpdate.available
      const updateRunning = currentUpdate.updating

      const topBar = h(
        'header',
        { className: 'lh-bar' },
        h('span', { className: 'lh-mark' }, h(Mark, { size: 18 })),
        h(
          'div',
          { className: 'lh-headings' },
          h('span', { className: 'lh-title' }, t('brand')),
          h('span', { className: 'lh-kicker' }, t('kicker')),
        ),
        h('span', { className: 'lh-spacer' }),
        h(
          'span',
          { className: 'lh-pill', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'lh-dot', 'data-state': updateRunning ? 'starting' : phase }),
          h('span', null, updateRunning ? t('updating') : statusText),
        ),
        currentUpdate.available || updateRunning ? h(UpdateButton, { short: true }) : null,
        h(ActionButton, {
          title: t('refresh'),
          icon: h(RefreshGlyph, null),
          onClick: reload,
          iconOnly: true,
          disabled: busy,
        }),
        h(ActionButton, {
          title: t('openExternal'),
          icon: h(ExternalGlyph, null),
          onClick: openExternal,
          iconOnly: true,
          disabled: !online,
        }),
        h(
          'button',
          {
            type: 'button',
            className: 'lh-action lh-lang',
            onClick: () => setLanguage(language === 'zh' ? 'en' : 'zh'),
            title: t('switchLanguage'),
            'aria-label': t('switchLanguage'),
          },
          t('langButton'),
        ),
      )

      const banner = disconnected
        ? h(
            'div',
            { className: 'lh-banner', role: 'status' },
            h('span', { className: 'lh-dot', 'data-state': phase }),
            h('span', null, t('disconnectedTitle')),
            h('span', { className: 'lh-spacer' }),
            h(ActionButton, {
              title: t('retry'),
              label: busy ? t('starting') : t('retry'),
              onClick: start,
              disabled: busy,
              tone: 'primary',
            }),
          )
        : updateFailed
          ? h(
              'div',
              { className: 'lh-banner', role: 'status' },
              h('span', { className: 'lh-dot', 'data-state': 'error' }),
              h('span', null, t('updateFailedTitle')),
              h('span', { className: 'lh-spacer' }),
              h(ActionButton, {
                title: t('retryUpdate'),
                label: t('retryUpdate'),
                onClick: startUpdate,
                disabled: currentUpdate.updating,
              }),
            )
          : null

      let body
      if (updateRunning) {
        body = h(UpdateProgress, null)
      } else if (booted && frameUrl) {
        body = h(
          'div',
          { className: 'lh-body' },
          banner,
          h('iframe', {
            key: frameKey,
            className: 'lh-frame',
            src: frameUrl,
            title: t('frameTitle'),
            allow: 'clipboard-read; clipboard-write; microphone; autoplay; fullscreen',
            allowFullScreen: true,
            referrerPolicy: 'no-referrer',
            onLoad: () => {
              if (alive.current) setFrameLoaded(true)
            },
          }),
          !frameLoaded
            ? h(
                'div',
                { className: 'lh-loading', role: 'status' },
                h('span', { className: 'lh-spinner' }),
                h('span', null, t('checkingBody')),
              )
            : null,
        )
      } else {
        const heading = error ? t('errorTitle') : starting ? t('startingTitle') : t('offlineTitle')
        const description = error ? t('errorBody') : starting ? t('startingBody') : t('offlineBody')
        body = h(
          'div',
          { className: 'lh-hero' },
          h('div', { className: 'lh-orb' }, h(Mark, { size: 38 })),
          h('p', { className: 'lh-eyebrow' }, t('docs')),
          h('h1', null, heading),
          h('p', null, description),
          starting ? h('div', { className: 'lh-progress', 'aria-hidden': 'true' }) : null,
          h(
            'div',
            { className: 'lh-actions' },
            h(ActionButton, {
              title: error ? t('retry') : t('start'),
              label: busy ? t('starting') : error ? t('retry') : starting ? t('starting') : t('start'),
              onClick: start,
              disabled: busy || starting,
              tone: 'primary',
            }),
            h(ActionButton, {
              title: t('retry'),
              label: t('retry'),
              onClick: reload,
              disabled: busy,
            }),
          ),
          error && detail
            ? h(
                'details',
                { className: 'lh-detail', open: true },
                h(
                  'summary',
                  { style: { cursor: 'pointer', marginBottom: '4px' } },
                  t('log'),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'lh-action lh-copy',
                      style: { marginLeft: '8px' },
                      onClick: copy,
                    },
                    h(CopyGlyph, null),
                    t(copied ? 'copied' : 'copy'),
                  ),
                ),
                h('div', null, detail),
              )
            : null,
          status && status.dataDir
            ? h(
                'div',
                { className: 'lh-meta' },
                h('span', null, `${t('dataLabel')} `, h('code', null, status.dataDir)),
                status.appVersion ? h('span', null, `${t('versionLabel')} ${status.appVersion}`) : null,
              )
            : null,
          h('p', { className: 'lh-meta' }, t('startHint')),
        )
      }

      return h('div', { className: 'lh-root' }, h('style', null, STYLES), topBar, body)
    }

    // ─── Sidebar footer update action ─────────────────────────────────────
    function FooterAction({ wide }) {
      useLanguage()
      const current = useUpdate()
      if (!current.available && !current.updating) return null
      const busy = current.updating
      return h(
        'button',
        {
          type: 'button',
          className: `lh-foot-trigger${wide ? ' wide' : ''}`,
          onClick: async () => {
            if (layout) {
              try {
                layout.selectPanel('learnharness')
              } catch {
                /* the panel is still reachable from the sidebar */
              }
            }
            if (!busy) await startUpdate()
          },
          title: busy ? t('updating') : t('updateNavTitle'),
          'aria-label': busy ? t('updating') : t('updateNavTitle'),
          disabled: busy,
        },
        h(
          'span',
          { className: busy ? 'lh-foot-spin' : null, style: { display: 'inline-flex' } },
          busy ? h('span', { className: 'lh-spinner small' }) : h(UpdateGlyph, null),
        ),
        wide ? h('span', { className: 'lh-foot-label' }, busy ? t('updating') : t('updateNav')) : null,
        current.error ? h('span', { className: 'lh-foot-dot error', 'aria-hidden': 'true' }) : null,
      )
    }

    function SidebarMark(props) {
      const size = props && typeof props.size === 'number' ? props.size : 16
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            color: 'currentColor',
          },
        },
        h(Mark, { size }),
      )
    }

    let layout = null

    return {
      inject: ['slots', 'layout'],
      apply(ctx) {
        layout = ctx.get('layout') ?? null

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'learnharness', order: 30, label: () => t('panelTitle') },
            SidebarMark,
          ),
        )
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'learnharness' }, LearnPanel),
        )
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            { name: 'sidebar.footer.action', id: 'learnharness-update', order: 30, label: () => t('updateNavTitle') },
            FooterAction,
          ),
        )

        ctx.effect(() => {
          void refreshUpdate()
          const timer = setInterval(() => {
            void refreshUpdate()
          }, UPDATE_POLL_MS)
          return () => clearInterval(timer)
        }, 'learnharness: update status poll')
      },
    }
  },
})
