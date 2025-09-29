import { defineEventHandler } from 'h3'
export default defineEventHandler(() => ({ ok: true, ts: new Date().toISOString() }))
