# My-Plugins

Personal collection of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins.

## Plugins

### [Update Guard](./dsh-update-guard)

A desktop-update gate for DeepSeek Harness. Clicking the update control beside the sidebar account name runs a compatibility scan against the target release first; a clean scan automatically resumes the native updater, while problems stop the update and are listed per plugin.

- Host scanner: profile inventory, npm target API surface, GitHub compare, slot/import/dependency checks.
- Isolated staging: repairs are built outside the live plugin directory.
- Dual-runtime Host facade: patched code is tried first and the original implementation stays as the fallback.
- Rollback and re-verification from the guard panel.

See [dsh-update-guard/README.md](./dsh-update-guard/README.md) for the full design, configuration, and limits.

## Layout

```
dsh-update-guard/
  index.js            Host entry
  client.js           Web UI and update-button interception
  lib/                scanner, staging, facade
  locale/             plugin metadata
  scripts/            self-tests
```

## License

No license is granted unless a plugin directory states otherwise.
