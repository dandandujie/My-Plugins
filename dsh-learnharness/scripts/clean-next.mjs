/** Remove LearnHarness's .next without following the external-package
 *  junctions inside it. Next's build cleanup can otherwise empty the real
 *  node_modules packages those junctions point at. */
import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import path from 'node:path'

const appRoot = path.resolve(process.argv[2] ?? process.cwd())
const target = path.join(appRoot, '.next')

function removeTree(current) {
  let stat
  try {
    stat = lstatSync(current)
  } catch {
    return
  }
  if (stat.isSymbolicLink()) {
    try {
      unlinkSync(current)
    } catch {
      rmdirSync(current)
    }
    return
  }
  if (stat.isDirectory()) {
    for (const name of readdirSync(current)) removeTree(path.join(current, name))
    rmdirSync(current)
    return
  }
  unlinkSync(current)
}

if (existsSync(target)) {
  removeTree(target)
  console.log('[clean-next] removed .next without traversing junctions')
} else {
  console.log('[clean-next] .next is already absent')
}
