import { defineEventHandler } from 'h3'
export default defineEventHandler(() => ({ ok: true, pong: Date.now() }))

