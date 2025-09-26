// server/api/nl/fs.get.ts
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import { defineEventHandler, getQuery } from 'h3'

function findDocsRoot() {
  // allow hard override
  const override = process.env.ASKDOCS_ROOT?.trim()
  if (override) {
    const full = path.isAbsolute(override) ? override : path.join(process.cwd(), override)
    if (fs.existsSync(full)) return full
  }
  const prefixes = ['', 'www', 'apps/web', 'app', 'site']
  const dirs = ['content', 'pages', 'docs']
  for (const p of prefixes) {
    for (const d of dirs) {
      const full = path.join(process.cwd(), p, d)
      if (fs.existsSync(full)) return full
    }
  }
  return process.cwd()
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const scope = String(q.scope ?? '').replace(/^\/+/, '').replace(/\/+$/, '')

  // Include files directly under the scope folder AND in all subfolders
  const include = scope
    ? [
        `${scope}/*.md`, `${scope}/*.mdx`, `${scope}/*.markdown`,
        `${scope}/**/*.md`, `${scope}/**/*.mdx`, `${scope}/**/*.markdown`,
      ]
    : ['**/*.md', '**/*.mdx', '**/*.markdown']

  const root = findDocsRoot()
  const files = await glob(include, {
    cwd: root,
    nodir: true,
    ignore: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/dist/**',
      '**/public/**',
    ],
  })

  return {
    cwd: process.cwd(),
    root,
    scope: scope || null,
    include,
    total: files.length,
    sample: files.slice(0, 25),
  }
})


