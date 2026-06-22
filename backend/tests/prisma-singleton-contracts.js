const fs = require('fs')
const path = require('path')

const srcRoot = path.resolve(__dirname, '..', 'src')
const singletonPath = path.join(srcRoot, 'lib', 'prisma.ts')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walk(fullPath)
    }
    return entry.isFile() && fullPath.endsWith('.ts') ? [fullPath] : []
  })
}

function relative(filePath) {
  return path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/')
}

if (!fs.existsSync(singletonPath)) {
  throw new Error('Prisma singleton must exist at src/lib/prisma.ts')
}

const singletonSource = fs.readFileSync(singletonPath, 'utf8')
if (!singletonSource.includes('export const prisma')) {
  throw new Error('src/lib/prisma.ts must export const prisma')
}
if (!/\bnew\s+PrismaClient\s*\(/.test(singletonSource)) {
  throw new Error('src/lib/prisma.ts must be the only place constructing PrismaClient')
}

const offenders = []
for (const file of walk(srcRoot)) {
  if (file === singletonPath) {
    continue
  }
  const source = fs.readFileSync(file, 'utf8')
  if (/\bnew\s+PrismaClient\s*\(/.test(source)) {
    offenders.push(`${relative(file)} constructs PrismaClient`)
  }
  if (/import\s*\{[^}]*\bPrismaClient\b[^}]*\}\s*from\s*['"]@prisma\/client['"]/.test(source)) {
    offenders.push(`${relative(file)} imports PrismaClient directly`)
  }
}

if (offenders.length > 0) {
  throw new Error(`Only src/lib/prisma.ts may construct/import PrismaClient:\n${offenders.join('\n')}`)
}

console.log('prisma singleton contracts passed')
