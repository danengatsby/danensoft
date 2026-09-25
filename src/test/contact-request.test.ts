import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CONTACT_TIMEOUT_MS, sendContact } from '../lib/contact-request'

const values = { name: 'Ana Test', email: 'ana@example.com', organisation: '', topic: 'Altceva', message: 'Un mesaj de test suficient de lung.' }
const submit = (signal = new AbortController().signal) => sendContact('/api/contact', values, signal)

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it.each([201, 200])('confirmă salvarea numai cu răspunsul JSON ok:true (%i)', async (status) => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await submit()).toEqual({ kind: 'sent' })
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(values)
  expect(vi.getTimerCount()).toBe(0)
})

it.each(['<html>Proxy error</html>', '{"ok":false}', '{}', 'null'])('nu confirmă un răspuns 200 fără confirmare validă: %s', async (body) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)))
  expect(await submit()).toEqual({ kind: 'error', reason: 'unconfirmed' })
})

it.each([
  [400, 'invalid'], [401, 'forbidden'], [403, 'forbidden'], [404, 'unavailable'],
  [405, 'unavailable'], [408, 'unconfirmed'], [413, 'tooLarge'], [429, 'rateLimit'],
  [500, 'server'], [502, 'server'], [503, 'unavailable'], [504, 'unconfirmed'], [418, 'unconfirmed'],
])('traduce statusul %i fără a expune corpul tehnic al răspunsului', async (status, reason) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>internal stack trace</html>', { status: Number(status) })))
  expect(await submit()).toEqual({ kind: 'error', reason })
})

it('asociază erorile de validare doar câmpurilor cunoscute', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    error: 'internal exception', fields: ['email', 'organisation', 'topic', 'website', '__proto__'],
  }), { status: 422 })))
  const result = await submit()
  expect(result).toEqual({ kind: 'error', reason: 'validation', fields: {
    email: 'Introduceți o adresă de e-mail validă.',
    organisation: 'Verificați organizația completată.', topic: 'Selectați un subiect valid.',
  } })
})

it.each(['not JSON', 'null'])('păstrează eroarea de validare când corpul 422 este inutilizabil: %s', async (body) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 422 })))
  expect(await submit()).toEqual({ kind: 'error', reason: 'validation', fields: {} })
})

it.each(['headers', 'body'])('încheie așteptarea după 15 secunde, inclusiv la blocarea fazei %s', async (phase) => {
  const fetchMock = vi.fn().mockImplementation(() => phase === 'headers'
    ? new Promise(() => {})
    : Promise.resolve({ ok: true, json: () => new Promise(() => {}) }))
  vi.stubGlobal('fetch', fetchMock)
  let finished = false
  const pending = submit().then((result) => { finished = true; return result })
  await vi.advanceTimersByTimeAsync(CONTACT_TIMEOUT_MS - 1)
  expect(finished).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  expect(await pending).toEqual({ kind: 'error', reason: 'timeout' })
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('distinge pierderea conexiunii de expirarea termenului', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  expect(await submit()).toEqual({ kind: 'error', reason: 'network' })
  expect(vi.getTimerCount()).toBe(0)
})

it('anulează cererea și curăță timerul la părăsirea formularului', async () => {
  const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetchMock)
  const controller = new AbortController()
  const pending = submit(controller.signal)
  controller.abort()
  expect(await pending).toEqual({ kind: 'cancelled' })
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
  expect(await submit(controller.signal)).toEqual({ kind: 'cancelled' })
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
