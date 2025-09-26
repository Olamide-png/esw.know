// server/utils/db.ts
import { Client } from 'pg'

export function db() {
  return new Client({ connectionString: process.env.DATABASE_URL })
}
