#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const workspaceRoot = path.resolve(__dirname, '..', '..')
const manifestDir = path.join(workspaceRoot, 'local-db-backups')
const sourceManifestPath = path.join(manifestDir, 'baota-source-manifest.txt')
const buildManifestPath = path.join(manifestDir, 'baota-build-manifest.txt')
const forbiddenLocalPathReportPath = path.join(manifestDir, 'baota-forbidden-local-paths.txt')

const REQUIRED_BUILD_ARTIFACTS = [
  'backend/dist/index.js',
  'frontend/dist/index.html'
]

const BUILD_ARTIFACT_ROOTS = [
  'backend/dist',
  'frontend/dist'
]

const DEPLOYABLE_SOURCE_ROOTS = [
  'backend/src/',
  'backend/prisma/',
  'backend/scripts/',
  'backend/tests/',
  'frontend/src/',
  'frontend/public/',
  'docs/'
]

const DEPLOYABLE_SOURCE_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'backend/package.json',
  'backend/package-lock.json',
  'backend/pnpm-lock.yaml',
  'frontend/package.json',
  'frontend/package-lock.json',
  'frontend/pnpm-lock.yaml'
]

const COPY_EXCLUDE_PATTERNS = [
  '.git/',
  '.env',
  '.env.*',
  'node_modules/',
  'logs/',
  'backend/.env',
  'backend/.env.mysql.backup',
  'backend/node_modules/',
  'frontend/node_modules/',
  'backend/dist/',
  'frontend/dist/',
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

function isDeployableSourceFile(file) {
  const normalized = normalizePath(file)
  if (findForbiddenFiles([normalized]).length > 0) {
    return false
  }

  if (DEPLOYABLE_SOURCE_FILES.includes(normalized)) {
    return true
  }

  if (DEPLOYABLE_SOURCE_ROOTS.some((root) => normalized.startsWith(root))) {
    return true
  }

  return normalized.endsWith('.md')
}

function collectUntrackedDeployableSources() {
  // Equivalent command: git ls-files --others --exclude-standard
  const untrackedFiles = listGitFiles(['ls-files', '--others', '--exclude-standard'])
  return untrackedFiles.filter(isDeployableSourceFile).sort()
}

function listFilesUnder(relativeDir) {
  const root = path.join(workspaceRoot, relativeDir)
  if (!fs.existsSync(root)) {
    return []
  }

  const result = []

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name)
      const relativePath = normalizePath(path.relative(workspaceRoot, absolutePath))

      if (entry.isDirectory()) {
        walk(absolutePath)
      } else {
        result.push(relativePath)
      }
    }
  }

  walk(root)
  return result.sort()
}

function collectBuildArtifacts() {
  return BUILD_ARTIFACT_ROOTS.flatMap(listFilesUnder)
}

function collectForbiddenLocalPaths() {
  const matches = []

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name)
      const relativePath = normalizePath(path.relative(workspaceRoot, absolutePath))
      const pattern = COPY_EXCLUDE_PATTERNS.find((candidate) => matchesPattern(relativePath, candidate))

      if (pattern) {
        matches.push({
          path: entry.isDirectory() ? `${relativePath}/` : relativePath,
          pattern
        })
        continue
      }

      if (entry.isDirectory()) {
        walk(absolutePath)
      }
    }
  }

  walk(workspaceRoot)
  return matches.sort((left, right) => left.path.localeCompare(right.path))
}

function writeManifest(filePath, title, description, files) {
  fs.mkdirSync(manifestDir, { recursive: true })
  fs.writeFileSync(
    filePath,
    [
      title,
      `# Generated at ${new Date().toISOString()}`,
      description,
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
  const sourceFiles = trackedFiles.filter((file) => !findForbiddenFiles([file]).length)
  const untrackedDeployableSources = collectUntrackedDeployableSources()
  const buildArtifacts = collectBuildArtifacts()
  const missingBuildArtifacts = REQUIRED_BUILD_ARTIFACTS.filter((file) => !fs.existsSync(path.join(workspaceRoot, file)))
  const localForbiddenPaths = collectForbiddenLocalPaths()

  writeManifest(
    sourceManifestPath,
    '# LNDX Baota source manifest',
    '# Copy these tracked source files only after local tests/builds pass. Build output is listed separately.',
    sourceFiles
  )
  writeManifest(
    buildManifestPath,
    '# LNDX Baota build artifact manifest',
    '# Copy these generated build files only after npm run build passes for backend and frontend.',
    buildArtifacts
  )
  writeManifest(
    forbiddenLocalPathReportPath,
    '# LNDX Baota forbidden local paths',
    '# These paths may exist locally, but must never be copied as part of a whole-workspace upload.',
    localForbiddenPaths.map((item) => `${item.path}\t${item.pattern}`)
  )

  const summary = {
    trackedFileCount: trackedFiles.length,
    sourceFileCount: sourceFiles.length,
    buildArtifactCount: buildArtifacts.length,
    missingBuildArtifacts,
    forbiddenFileCount: forbiddenFiles.length,
    untrackedDeployableSourceCount: untrackedDeployableSources.length,
    localForbiddenPathCount: localForbiddenPaths.length,
    sourceManifestPath: normalizePath(path.relative(workspaceRoot, sourceManifestPath)),
    buildManifestPath: normalizePath(path.relative(workspaceRoot, buildManifestPath)),
    forbiddenLocalPathReportPath: normalizePath(path.relative(workspaceRoot, forbiddenLocalPathReportPath)),
    copyExcludePatterns: COPY_EXCLUDE_PATTERNS,
    forbiddenFiles,
    untrackedDeployableSources,
    localForbiddenPaths
  }

  console.log(JSON.stringify(summary, null, 2))

  if (forbiddenFiles.length > 0) {
    console.error('Baota copy boundary failed: tracked files include paths that must never be copied as source.')
    process.exit(2)
  }

  if (untrackedDeployableSources.length > 0) {
    console.error('Baota copy boundary failed: untracked deployable source files exist.')
    process.exit(4)
  }

  if (missingBuildArtifacts.length > 0) {
    console.error('Baota copy boundary failed: required build artifacts are missing. Run backend and frontend builds first.')
    process.exit(3)
  }
}

main()
