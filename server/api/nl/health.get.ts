import { defineEventHandler } from 'h3'
import { loadIndex } from '../../nlweb/index'

export default defineEventHandler(async () => {
  const rows = await loadIndex()
  return { ok: true, rows: rows.length }
})
