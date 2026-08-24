#!/usr/bin/env node

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const workspaceRoot = path.resolve(__dirname, '..', '..')
const releaseRoot = path.join(workspaceRoot, 'local-db-backups', 'releases')

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: options.capture === false ? 'inherit' : ['ignore', 'pipe', 'pipe']
  })

  return output == null ? '' : String(output).trim()
}

function assertCleanWorktree() {
  const status = run('git', ['status', '--porcelain', '--untracked-files=normal'])
  if (status) {
    throw new Error('Release packaging requires a clean Git worktree. Commit or remove local source changes first.')
  }
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
}

function fileInfo(filePath) {
  return {
    file: path.basename(filePath),
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath)
  }
}

function migrationNames() {
  return run('git', ['ls-files', 'backend/prisma/migrations/*/migration.sql'])
    .split(/\r?\n/)
    .filter(Boolean)
    .map((file) => file.split('/').at(-2))
}

function main() {
  assertCleanWorktree()
  run('node', ['backend/scripts/check-baota-copy-boundary.js'], { capture: false })

  const commit = run('git', ['rev-parse', 'HEAD'])
  const shortCommit = run('git', ['rev-parse', '--short=12', 'HEAD'])
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const releaseId = `${timestamp}-${shortCommit}`
  const outputDir = path.join(releaseRoot, releaseId)
  const sourceArchive = path.join(outputDir, `lndx-source-${releaseId}.tar.gz`)
  const buildArchive = path.join(outputDir, `lndx-build-${releaseId}.tar.gz`)

  fs.mkdirSync(outputDir, { recursive: true })

  run('git', ['archive', '--format=tar.gz', `--output=${sourceArchive}`, 'HEAD'])
  run('tar', ['-czf', buildArchive, 'backend/dist', 'frontend/dist'])

  const manifest = {
    releaseId,
    generatedAt: new Date().toISOString(),
    commit,
    branch: run('git', ['branch', '--show-current']),
    productionDeployed: false,
    packages: {
      source: fileInfo(sourceArchive),
      build: fileInfo(buildArchive)
    },
    migrations: migrationNames(),
    deploymentRunbook: 'docs/deployment/baota-migration-runbook.md',
    productionDataExcluded: [
      '.env files',
      'node_modules',
      'uploads',
      'logs',
      'database backups'
    ]
  }

  const manifestPath = path.join(outputDir, 'release-manifest.json')
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({
    success: true,
    outputDir: path.relative(workspaceRoot, outputDir).replace(/\\/g, '/'),
    manifest: path.relative(workspaceRoot, manifestPath).replace(/\\/g, '/'),
    ...manifest
  }, null, 2))
}

try {
  main()
} catch (error) {
  console.error(`Baota release packaging failed: ${error.message}`)
  process.exit(1)
}
