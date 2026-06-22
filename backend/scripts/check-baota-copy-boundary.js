#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const workspaceRoot = path.resolve(__dirname, '..', '..')
const manifestDir = path.join(workspaceRoot, 'local-db-backups')
const manifestPath = path.join(manifestDir, 'baota-source-manifest.txt')

const COPY_EXCLUDE_PATTERNS = [
  '.git/',
  '.env',
  '.env.*',
  'backend/.env',
  'backend/.env.mysql.backup',
  'backend/node_modules/',
  'frontend/node_modules/',
  'backend/logs/',
  'backend/uploads/',
  'backend/backups/',
  'local-db-backups/',
  'lndx_backup_*/',
  '*.dump',
  '*.tar.gz',
  '*.backup',
  '*.log'
]

function normalizePath(value) {
  return value.replace(/\\/g, '/')
}

function listGitFiles(args) {
  const output = execFileSync('git', args, {
    cwd: workspaceRoot,
    encoding: 'utf8'
  })

  return output.split(/\r?\n/).filter(Boolean).map(normalizePath)
}

function matchesPattern(file, pattern) {
  const normalized = normalizePath(file)
  const expected = normalizePath(pattern)

  if (expected.endsWith('/')) {
    const prefix = expected.slice(0, -1)
    if (expected.includes('*')) {
      const regexp = new RegExp(`^${prefix.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^/]*')}(?:/|$)`)
      return regexp.test(normalized)
    }
    return normalized === prefix || normalized.startsWith(expected)
  }

  if (expected.startsWith('*.')) {
    return normalized.endsWith(expected.slice(1))
  }

  if (expected.includes('*')) {
    const regexp = new RegExp(`^${expected.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')}$`)
    return regexp.test(normalized)
  }

  return normalized === expected
}

function findForbiddenFiles(files) {
  return files
    .map((file) => ({
      file,
      pattern: COPY_EXCLUDE_PATTERNS.find((pattern) => matchesPattern(file, pattern))
    }))
    .filter((item) => item.pattern)
}

function writeManifest(files) {
  fs.mkdirSync(manifestDir, { recursive: true })
  fs.writeFileSync(
    manifestPath,
    [
      '# LNDX Baota source manifest',
      `# Generated at ${new Date().toISOString()}`,
      '# Copy these tracked source files only after local tests/builds pass.',
      '',
      ...files
    ].join('\n') + '\n',
    'utf8'
  )
}

function main() {
  // Use git ls-files so the Baota manifest is based on tracked source files.
  const trackedFiles = listGitFiles(['ls-files'])
  const forbiddenFiles = findForbiddenFiles(trackedFiles)

  writeManifest(trackedFiles.filter((file) => !findForbiddenFiles([file]).length))

  const summary = {
    trackedFileCount: trackedFiles.length,
    forbiddenFileCount: forbiddenFiles.length,
    manifestPath: normalizePath(path.relative(workspaceRoot, manifestPath)),
    copyExcludePatterns: COPY_EXCLUDE_PATTERNS,
    forbiddenFiles
  }

  console.log(JSON.stringify(summary, null, 2))

  if (forbiddenFiles.length > 0) {
    console.error('Baota copy boundary failed: tracked files include paths that must never be copied as source.')
    process.exit(2)
  }
}

main()
