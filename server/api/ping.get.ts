<<<<<<< HEAD
import { defineEventHandler } from 'h3'
export default defineEventHandler(() => ({ ok: true, pong: Date.now() }))

=======
export default defineEventHandler(() => ({ ok: true, ts: new Date().toISOString() }))
>>>>>>> 1a18cf54b11b5f56120d3529f0648f3dc1a363de
