// Run as danen. Never prints or stores a temporary password.
import { randomBytes } from 'node:crypto'
import { users } from '../server/db.mjs'
import { hashPassword } from '../server/auth.mjs'
import { issueAccountMail } from '../server/account-tokens.mjs'
const email = process.argv[2]?.trim().toLowerCase()
if (!/^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]{2,}$/.test(email ?? '')) throw new Error('Valid email required')
const existing = users.byEmail(email)
if (existing && existing.role !== 'admin') throw new Error('Existing non-admin account: use admin:set after verifying ownership')
if (!existing) users.create(email,'Administrator',hashPassword(randomBytes(48).toString('base64url')),'admin')
issueAccountMail(users.byEmail(email),'reset')
console.log('Administrator invitation queued. The account owner sets the password through email.')
