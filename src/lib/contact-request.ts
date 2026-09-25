import { MESSAGE_TOO_LONG, type ContactErrors, type ContactValues } from './contact'

export const CONTACT_TIMEOUT_MS = 15_000

export const contactFailureMessages = {
  timeout: 'Nu am primit confirmarea în {seconds} secunde. Mesajul poate fi deja salvat; verificați e-mailul înainte de a retrimite.',
  network: 'Conexiunea cu serverul a fost întreruptă. Verificați conexiunea la internet și e-mailul de confirmare înainte de a retrimite.',
  validation: 'Verificați datele completate și corectați câmpurile indicate înainte de a retrimite.',
  invalid: 'Datele trimise nu au putut fi procesate. Verificați câmpurile formularului și încercați din nou.',
  forbidden: 'Serverul nu permite trimiterea momentan. Puteți trimite solicitarea prin e-mail.',
  tooLarge: 'Datele trimise sunt prea lungi. Scurtați mesajul și celelalte câmpuri înainte de a retrimite.',
  rateLimit: 'Ați încercat să trimiteți prea multe mesaje într-un interval scurt. Așteptați câteva minute înainte de o nouă încercare.',
  unavailable: 'Serviciul de mesaje este temporar indisponibil. Încercați din nou mai târziu sau trimiteți solicitarea prin e-mail.',
  server: 'Serverul a întâmpinat o problemă. Nu putem confirma salvarea mesajului; verificați e-mailul înainte de a reîncerca mai târziu.',
  unconfirmed: 'Nu am primit o confirmare validă de la server. Mesajul poate fi deja salvat; verificați e-mailul înainte de a retrimite.',
} as const

export type ContactFailure = keyof typeof contactFailureMessages
const httpFailures: Partial<Record<number, ContactFailure>> = {
  400: 'invalid', 401: 'forbidden', 403: 'forbidden', 404: 'unavailable',
  405: 'unavailable', 408: 'unconfirmed', 413: 'tooLarge', 429: 'rateLimit',
  503: 'unavailable', 504: 'unconfirmed',
}
export type ContactResult =
  | { kind: 'sent' }
  | { kind: 'cancelled' }
  | { kind: 'error'; reason: ContactFailure; fields?: ContactErrors }

const fieldMessages: Record<keyof ContactValues, string> = {
  name: 'Introduceți numele dumneavoastră.',
  email: 'Introduceți o adresă de e-mail validă.',
  organisation: 'Verificați organizația completată.',
  topic: 'Selectați un subiect valid.',
  message: 'Verificați mesajul: între 20 și 5.000 de caractere.',
}

function validationFields(body: unknown): ContactErrors {
  const fields: ContactErrors = {}
  if (!body || typeof body !== 'object') return fields
  if ('fields' in body && Array.isArray(body.fields)) {
    for (const field of Object.keys(fieldMessages) as (keyof ContactValues)[]) {
      if (body.fields.includes(field)) fields[field] = fieldMessages[field]
    }
  }
  // Păstrăm explicația cunoscută a API-ului, fără a afișa texte tehnice arbitrare.
  if ('error' in body && body.error === MESSAGE_TOO_LONG) fields.message = MESSAGE_TOO_LONG
  return fields
}

async function readResponse(response: Response): Promise<ContactResult> {
  if (response.ok) {
    const body: unknown = await response.json().catch(() => null)
    return body && typeof body === 'object' && 'ok' in body && body.ok === true
      ? { kind: 'sent' }
      : { kind: 'error', reason: 'unconfirmed' }
  }
  if (response.status === 422) {
    const body: unknown = await response.json().catch(() => null)
    return { kind: 'error', reason: 'validation', fields: validationFields(body) }
  }
  const reason = httpFailures[response.status] ?? (response.status >= 500 ? 'server' : 'unconfirmed')
  return { kind: 'error', reason }
}

/** Limita include citirea răspunsului, iar anularea oprește cererea la demontare. */
export async function sendContact(endpoint: string, values: ContactValues, signal: AbortSignal): Promise<ContactResult> {
  if (signal.aborted) return { kind: 'cancelled' }
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  let onAbort: () => void
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new Error('Contact request aborted'))
    controller.signal.addEventListener('abort', onAbort, { once: true })
  })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, CONTACT_TIMEOUT_MS)
  try {
    return await Promise.race([
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
        signal: controller.signal,
      }).then(readResponse),
      aborted,
    ])
  } catch {
    return signal.aborted ? { kind: 'cancelled' }
      : { kind: 'error', reason: timedOut ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', cancel)
    controller.signal.removeEventListener('abort', onAbort!)
    controller.abort()
  }
}
