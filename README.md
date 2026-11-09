# My-Plugins

个人维护的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件集合。

本仓库默认使用中文说明。

## 插件

### [LearnHarness 学习台](./dsh-learnharness)

把 [LearnHarness](https://github.com/amosblomqvist/learnharness) 完整接入 DeepSeek Harness：
左侧边栏常驻学习台入口，主面板内嵌完整的教学、练习和知识图谱工作区。

- 保留上游完整应用，不重写、不裁剪功能。
- Host 负责启动和守护本地 `next start`，Client 负责侧边栏入口、状态和更新界面。
- 插件外壳与更新流程支持中英文，默认中文，可在面板顶栏切换。
- 自动检查上游 `origin/main`；有新提交时在左下角出现更新按钮，点击后自动完成拉取、重构建和重启。
- 构建或运行失败会自动回滚到上一个可用版本。

详见 [dsh-learnharness/README.md](./dsh-learnharness/README.md)。

### [Update Guard](./dsh-update-guard)

DeepSeek Harness 的桌面更新守卫。点击侧边栏账户名旁的更新控件时，先对目标版本做插件兼容性扫描；没有问题的插件会自动接回原生更新器，发现问题的插件会暂停更新并逐项列出。

- Host 扫描器：profile 清单、npm 目标 API、GitHub compare、slot/import/依赖检查。
- 隔离暂存：修复在 live 插件目录之外生成。
- 双运行时 Host facade：优先尝试新实现，原实现保留为回退。
- 面板内支持回滚和重新验证。

详见 [dsh-update-guard/README.md](./dsh-update-guard/README.md)。

## 安装

在 DeepSeek Harness 中让 Agent 使用 `plugin_manager` 安装对应目录，例如：

```text
plugin_manager install_bundle
target: <本仓库路径>/dsh-learnharness
```

安装后重启或等待插件热加载即可。每个插件的数据目录、配置和依赖要求见各自的 README。

## 目录结构

```text
dsh-learnharness/
  index.js            Host 半边：本地服务与上游更新
  client.js           Web UI：侧边栏入口、主面板、更新状态
  assets/fonts/       本地字体（SIL OFL）
  scripts/            构建、清理、补丁脚本
  locale/             插件元数据（中/英）
  docs/               截图与说明素材

dsh-update-guard/
  index.js            Host 入口
  client.js           Web UI 与更新按钮拦截
  lib/                scanner、staging、facade
  locale/             插件元数据
  scripts/            自测脚本
```

## 许可

除各插件目录内另有声明外，本仓库不授予任何许可。
`dsh-learnharness` 所集成的 LearnHarness 上游项目以 AGPL-3.0 发布，相关版权归上游作者所有；
其 `assets/fonts/` 下的字体文件使用 SIL Open Font License，许可证文本随字体一并提供。
