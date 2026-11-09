/**
 * Apply the two upstream-source changes the DSH panel needs, in a repeatable
 * way. The updater restores these files to upstream before pulling and then
 * runs this script, so a source update never has to merge our local edits.
 *
 * 1. next.config.ts: LH_WEB_SERVER=1 builds a normal .next for `next start`.
 * 2. app/layout.tsx: use bundled OFL fonts instead of next/font/google.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PLUGIN_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const appRoot = path.resolve(process.argv[2] ?? process.cwd())
const fontSource = path.join(PLUGIN_DIR, 'assets', 'fonts')
const fontTarget = path.join(appRoot, 'app', 'fonts')

if (!existsSync(path.join(appRoot, 'next.config.ts'))) {
  console.error(`[prepare-app] Next.js project not found at ${appRoot}`)
  process.exit(1)
}

mkdirSync(fontTarget, { recursive: true })
for (const name of ['JetBrainsMono-Variable.ttf', 'SourceSans3-Variable.ttf', 'OFL-JetBrainsMono.txt', 'OFL-SourceSans3.txt']) {
  const source = path.join(fontSource, name)
  if (!existsSync(source)) {
    console.error(`[prepare-app] bundled font asset missing: ${source}`)
    process.exit(1)
  }
  copyFileSync(source, path.join(fontTarget, name))
}

const configPath = path.join(appRoot, 'next.config.ts')
let config = readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n')
if (!config.includes('LH_WEB_SERVER')) {
  const before = '\toutput: "standalone",'
  const after = `\t// DSH panel: serve a normal .next through \`next start\` instead of
\t// tracing a standalone payload on every panel build.
\toutput: process.env.LH_WEB_SERVER === "1" ? undefined : "standalone",`
  if (!config.includes(before)) {
    console.error('[prepare-app] next.config.ts output line not recognized; upstream shape changed.')
    process.exit(1)
  }
  config = config.replace(before, after)
  writeFileSync(configPath, config)
  console.log('[prepare-app] next.config.ts: LH_WEB_SERVER output switch added')
} else {
  console.log('[prepare-app] next.config.ts: already prepared')
}

const layoutPath = path.join(appRoot, 'app', 'layout.tsx')
let layout = readFileSync(layoutPath, 'utf8').replace(/\r\n/g, '\n')
if (layout.includes('localFont') && layout.includes('--font-jetbrains')) {
  console.log('[prepare-app] app/layout.tsx: already prepared')
} else {
  const importBefore = 'import { JetBrains_Mono, Source_Sans_3 } from "next/font/google";'
  const importAfter = 'import localFont from "next/font/local";'
  if (!layout.includes(importBefore)) {
    console.error('[prepare-app] app/layout.tsx font import not recognized; upstream shape changed.')
    process.exit(1)
  }
  layout = layout.replace(importBefore, importAfter)

  const constBefore =
    'const ui = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });\n' +
    'const prose = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans3" });'
  const constAfter = `// Bundled OFL variable fonts: the DSH panel build must not depend on a
// font CDN (or leave a temporary download behind in the build trace).
const ui = localFont({
\tsrc: "./fonts/JetBrainsMono-Variable.ttf",
\tweight: "100 800",
\tstyle: "normal",
\tvariable: "--font-jetbrains",
\tdisplay: "swap",
});
const prose = localFont({
\tsrc: "./fonts/SourceSans3-Variable.ttf",
\tweight: "200 900",
\tstyle: "normal",
\tvariable: "--font-sans3",
\tdisplay: "swap",
});`

  if (!layout.includes(constBefore)) {
    console.error('[prepare-app] app/layout.tsx font declarations not recognized; upstream shape changed.')
    process.exit(1)
  }
  layout = layout.replace(constBefore, constAfter)
  writeFileSync(layoutPath, layout)
  console.log('[prepare-app] app/layout.tsx: local fonts wired')
}
