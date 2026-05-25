#!/usr/bin/env node
/**
 * Generate the env vars for the auth middleware.
 *
 *   npm run hash-password
 *
 * Prompts for a password, generates a random salt, runs PBKDF2-SHA256 (100k iter)
 * to produce the hash, generates a random AUTH_SECRET for HMAC cookie signing,
 * and prints both env vars ready to paste into Vercel.
 */
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { pbkdf2Sync, randomBytes } from 'node:crypto'

const ITERATIONS = 100_000

async function main() {
  let password = process.argv[2]

  if (!password) {
    const rl = createInterface({ input, output, terminal: true })
    password = (await rl.question('Choose a strong password: ')).trim()
    rl.close()
  }

  if (!password) {
    console.error('No password provided.')
    process.exit(1)
  }
  if (password.length < 12) {
    console.error('\nPassword is too short. Use at least 12 characters — longer is better.')
    console.error('A passphrase like "correct horse battery staple" is great.\n')
    process.exit(1)
  }

  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
  const passwordHash = `${salt.toString('hex')}:${hash.toString('hex')}`
  const secret = randomBytes(32).toString('hex')

  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Add these as Environment Variables in your Vercel project:')
  console.log('  Settings → Environment Variables → Add')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('AUTH_PASSWORD_HASH')
  console.log(passwordHash)
  console.log()
  console.log('AUTH_SECRET')
  console.log(secret)
  console.log()
  console.log('Apply to: Production, Preview, Development')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('After saving, redeploy. The site will require this password.')
  console.log()
  console.log('To rotate later, re-run this script and replace both values.')
  console.log()
}

main().catch((e) => { console.error(e); process.exit(1) })
