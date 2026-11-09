# Update Guard · 更新守卫

> 在 DeepSeek Harness 桌面更新真正开始之前，先按目标版本检查全部已安装插件，把修复放进独立暂存区验证，确认不会把当前版本弄坏，再放行原生更新器。

这是一个 DSH 插件（Host + Client），不是对桌面安装包的补丁。它解决两个问题：

1. **更新会随机弄坏插件**：按目标版本的 npm 发布物检查导入路径、导出名称、依赖范围、目标客户端槽位和语法，列出每个插件的问题。
2. **“按新版本修好的插件，在更新前就用不了”**：修复默认**不直接写回**。只应用元数据修复；如果改了源码，就生成一个双运行时的 Host facade，优先尝试新实现、失败自动回退旧实现，所以更新前后都能用。不能保证双版本安全的修复会停在暂存区并阻断更新。

## 界面

- 侧边栏底部的盾牌按钮：打开更新守卫。
- 设置 → 更新守卫：状态概览与入口。
- 全屏面板：目标版本、上游对比、插件列表、逐项问题、全选/勾选、修复、暂存、应用、继续更新。
- 点击 Harness 自带的账号行更新按钮（左下角账户名右侧）时，守卫会拦截这次点击并**自动开始检查**；0 error / 0 warning 时自动调用原生更新器，有问题则停在面板里等你勾选修复。原生下载/安装确认仍由桌面更新器提供。
- 面板里也可以手动“检查目标版本”、选择插件、修复、重新验证和回滚。

## 它如何判断兼容性

Host 半侧在每次检查时：

1. 从桌面更新源读取目标版本；也可用 `targetVersion` 覆盖（预演用）。
2. 通过 GitHub Compare 读取上游提交与变更包组（只作提示，不把 commit 文本当事实）。
3. 扫描 `$DSH_PROFILE_DIR` 中所有已安装、可写的插件包。
4. 对每个插件：
   - 抽取 `@deepseek-ai/*` 的静态/动态 import、`require`、`dsh.client.inject` 和依赖声明；
   - 从 npm 目标版本 tarball 里读取 `exports` 与 `.d.ts`，检查子路径和命名导出是否还存在；
   - 检查依赖范围是否覆盖目标版本；
   - 用目标客户端包的 `SlotMap` 声明检查插件使用的槽位；
   - 用 `node --check` 检查 JS 语法；
   - 把上游变更包与插件依赖做关联提示。
5. 生成报告：`ok` / `warning` / `error`，以及 `auto` / `manual` 修复标记。

## 修复与“双版本安全”

暂存目录：`$DSH_HOME/update-guard/staging/<target>/packages/<plugin>/`。**检查与修复阶段不写当前插件目录。**

- **只改元数据**（依赖范围、`dsh.client.inject` 包名）：源码未变，旧版本和新版本运行的是同一份代码，可以直接应用。
- **改了 Host 源码**（通过 `renames` 映射重命名槽位/服务/导入）：生成 `index.js` facade：
  - 先 `import` `versions/patched/index.js`；
  - 导入或同步 `apply` 失败时回退 `versions/original/index.js`；
  - 旧 Harness 继续跑旧实现，新 Harness 跑新实现。
- **改了 Client 源码**：目前不自动应用，标记为 `needs target runtime`，由 `prepare` 阻断更新，避免更新前把面板弄坏。
- **应用前**：复制一份备份到 `$DSH_HOME/update-guard/backups/`，写入 `applied.json`；可回滚。

### 为什么这样就解决了“先修后用不了”

修复不是“把当前插件直接改成新版本代码”，而是：

```
当前 Harness ──> facade ──> 旧实现（保证当前可用）
目标 Harness ──> facade ──> 新实现（验证通过才生效）
```

因此可以在更新前安全地把 facade 写回插件；更新失败、用户取消、目标版本回退，旧实现仍然在。不能做成 facade 的修复不会写回，更新被阻断，而不是留下一个只在未来版本可用的坏插件。

## 配置

在 profile 的 `cordis.patch.yml` 覆盖本插件行：

```yaml
- id: update-guard
  name: '@local/dsh-update-guard'
  config:
    # 预演/预发布用；留空则读桌面更新源
    targetVersion: 0.2.2-rc.1
    # 自定义更新源；默认 Windows 桌面 nightly
    feedUrl: https://download.deepseek.com/dsh-desk/feeds/win-x64/nightly.yml
    excludePlugins:
      - '@local/some-plugin'
    blockNativeUpdate: true
    renames:
      packages:
        '@deepseek-ai/dsh-client-ui-old': '@deepseek-ai/dsh-client-ui-new'
      slots:
        old.slot.name: new.slot.name
      services:
        oldService: newService
      imports:
        '@deepseek-ai/dsh-old/export': '@deepseek-ai/dsh-new/export'
```

`renames` 是显式映射：只有你确认上游的改名后才会自动重写，避免“猜错改名”。

## Agent 工具

Host 注册了 `update_guard` 工具：

```json
{ "action": "status" }
{ "action": "scan", "targetVersion": "0.2.2-rc.1" }
{ "action": "stage", "names": ["@local/dsh-quant-panel"] }
{ "action": "verify", "names": ["@local/dsh-quant-panel"] }
{ "action": "apply", "names": ["@local/dsh-quant-panel"] }
{ "action": "prepare", "names": ["@local/dsh-quant-panel"] }
{ "action": "rollback", "names": ["@local/dsh-quant-panel"] }
```

UI 与 Agent 走同一套 Host 方法。

## HTTP 接口

同源路由，供 Client 使用：

- `GET /update-guard/status`
- `GET /update-guard/report`
- `POST /update-guard/scan` `{ "targetVersion"?: string }`
- `POST /update-guard/stage` `{ "names"?: string[] }`
- `POST /update-guard/verify` `{ "names"?: string[] }`
- `POST /update-guard/apply` `{ "names"?: string[] }`
- `POST /update-guard/prepare` `{ "names"?: string[] }`
- `POST /update-guard/rollback` `{ "names"?: string[] }`

## 已知边界（重要）

1. **原生菜单不受 DOM 拦截**：Electron 主进程的 “Check for Updates…” 菜单不经过页面 DOM，插件无法拦截。当前守卫覆盖页面里的更新按钮（账号行更新控件）与侧边栏入口；如果用户从原生菜单直接更新，守卫不会阻止。要覆盖原生菜单需要改桌面主进程，超出 Cordis 插件边界。
2. **检查是静态 + 发布物 API 表面，不是完整运行时启动**：它能抓住导入/导出/槽位/依赖/语法错误，但抓不住“加载成功、运行到某个分支才炸”的语义回归。后续可以把目标版本装进隔离目录做真实 boot 预演。
3. **Client 源码修复不自动应用**：双版本 facade 目前只覆盖 Host 入口。Client 的源码级适配会暂存并阻断更新，避免更新前破坏页面。
4. **自动修复是确定性的**：依赖范围、显式 `renames` 映射、Host facade 是自动的；上游 API 语义变化需要人工或 Agent 编辑暂存目录，点“重新验证暂存”再应用。UI 也提供“回滚已应用的修复”。
5. **GitHub API 有限流**：匿名 60 次/小时；限流时仍会用 npm 发布物做目标 API 检查，只是不显示上游 commit 对比。
6. **修改的是链接插件的真实目录**：本 profile 的插件是 `link:D:/...`，应用修复会写入源目录。守卫会先备份；如果目录是 git 仓库，请自行提交/暂存后再应用。

## 验证

- Host/Client JS 通过 `node --check`。
- `scripts/selftest-facade.mjs` 验证：源码改名 → 生成 facade → 加载新实现；把新实现改成抛错后，facade 回退旧实现。
- `scripts/selftest-client.mjs` 验证 Client 工厂能注册三个槽位。
- 已通过 `plugin_manager install_bundle` 安装到 `desktop` profile；`settings.section`、`sidebar.footer.action`、`shell.overlay` 均显示 `active`。
- 浏览器视觉、点击拦截和真实更新流程需要在可见页面中人工确认；本次环境没有浏览器控制，未做截图级验证。
