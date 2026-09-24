// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

let db
let sessions

beforeAll(async () => {
  // Niciun test nu trebuie să deschidă baza de producție.
  vi.stubEnv('DANEN_DB', ':memory:')
  ;({ db, sessions } = await import('./db.mjs'))
})

beforeEach(() => {
  db.exec('DELETE FROM sessions')
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => vi.useRealTimers())

afterAll(() => {
  db?.close()
  vi.unstubAllEnvs()
})

function seedSessions(now) {
  const insert = db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)')
  for (const [token, offset] of [
    ['previous-day', -86_400_000],
    ['previous-minute', -60_000],
    ['previous-millisecond', -1],
    ['exact-expiry', 0],
    ['next-millisecond', 1],
    ['next-minute', 60_000],
  ]) {
    insert.run(
      token, 'user', null,
      new Date(now.getTime() - 86_400_000).toISOString(),
      new Date(now.getTime() + offset).toISOString(),
    )
  }
}

describe.each(['2030-06-15T12:00:00.123Z', '2030-06-16T00:00:00.000Z'])(
  'expirarea sesiunilor la %s',
  (timestamp) => {
    beforeEach(() => {
      const now = new Date(timestamp)
      vi.setSystemTime(now)
      seedSessions(now)
    })

    it('respinge sesiunile expirate inclusiv la limita exactă și păstrează sesiunile valide', () => {
      for (const token of ['previous-day', 'previous-minute', 'previous-millisecond', 'exact-expiry']) {
        expect(sessions.get(token), token).toBeUndefined()
      }
      for (const token of ['next-millisecond', 'next-minute']) {
        expect(sessions.get(token), token).toMatchObject({ kind: 'user' })
      }
    })

    it('curăță numai sesiunile expirate, folosind aceeași limită ca autentificarea', () => {
      sessions.prune()
      expect(db.prepare('SELECT token FROM sessions ORDER BY token').all().map(row => row.token))
        .toEqual(['next-millisecond', 'next-minute'])
    })
  },
)

it.each([12, 720])('respectă durata de %i ore a unei sesiuni create', (hours) => {
  const now = new Date('2030-06-15T12:00:00.123Z')
  vi.setSystemTime(now)
  sessions.create('new-session', { kind: 'user', hours })
  vi.setSystemTime(new Date(now.getTime() + hours * 3_600_000 - 1))
  expect(sessions.get('new-session')).toBeDefined()
  vi.setSystemTime(new Date(now.getTime() + hours * 3_600_000))
  expect(sessions.get('new-session')).toBeUndefined()
  sessions.prune()
  expect(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n).toBe(0)
})

it('respinge tokenurile lipsă sau necunoscute', () => {
  expect(sessions.get(undefined)).toBeUndefined()
  expect(sessions.get('')).toBeUndefined()
  expect(sessions.get('unknown')).toBeUndefined()
})
