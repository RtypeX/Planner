#!/usr/bin/env node
/**
 * Generate the AUTH_PIN_HASH env var for the auth middleware.
 *
 *   npm run hash-pin           # prompts for a PIN
 *   npm run hash-pin -- 123456 # hashes the arg
 *
 * Paste the output into Vercel as AUTH_PIN_HASH.
 *
 * Reminder: a 6-digit PIN has only 1,000,000 possibilities. The PIN alone
 * isn't strong — its job is to be a quick second factor on top of your real
 * password. The middleware enforces that BOTH must be correct.
 */
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { pbkdf2Sync, randomBytes } from 'node:crypto'

const ITERATIONS = 100_000

async function main() {
  let pin = process.argv[2]

  if (!pin) {
    const rl = createInterface({ input, output, terminal: true })
    pin = (await rl.question('Choose a 6-digit PIN: ')).trim()
    rl.close()
  }

  if (!/^\d{6}$/.test(pin)) {
    console.error('\nPIN must be exactly 6 digits, numbers only.\n')
    process.exit(1)
  }

  const salt = randomBytes(16)
  const hash = pbkdf2Sync(pin, salt, ITERATIONS, 32, 'sha256')
  const pinHash = `${salt.toString('hex')}:${hash.toString('hex')}`

  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Add this Environment Variable in your Vercel project:')
  console.log('  Settings → Environment Variables → Add')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('AUTH_PIN_HASH')
  console.log(pinHash)
  console.log()
  console.log('Apply to: Production, Preview, Development')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
}

main().catch((e) => { console.error(e); process.exit(1) })
