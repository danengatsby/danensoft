import {
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { company, services } from '../content/site'
import {
  mailtoHref,
  validate,
  type ContactErrors as Errors,
  type ContactValues as Values,
} from '../lib/contact'

/**
 * Ținta formularului. Implicit `/api/contact`, serviciul propriu care salvează
 * mesajul în baza de date (vezi `server/`). Se poate schimba din `.env`.
 * Dacă valoarea este goală, formularul rulează demonstrativ și NU trimite nimic.
 */
function getEndpoint(): string | undefined {
  const value = import.meta.env.VITE_CONTACT_ENDPOINT
  return value ? String(value) : undefined
}

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'sent' }
  | { kind: 'demo'; payload: Values }
  | { kind: 'error'; message: string }

const EMPTY: Values = {
  name: '',
  email: '',
  organisation: '',
  topic: services[0].title,
  message: '',
}

export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const formRef = useRef<HTMLFormElement>(null)

  const update = (field: keyof Values) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Capcană pentru roboți: dacă este completată, ne oprim în tăcere.
    const honeypot = new FormData(event.currentTarget).get('website')
    if (typeof honeypot === 'string' && honeypot.length > 0) return

    const nextErrors = validate(values)
    setErrors(nextErrors)

    const firstInvalid = Object.keys(nextErrors)[0]
    if (firstInvalid) {
      setStatus({ kind: 'idle' })
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus()
      return
    }

    const endpoint = getEndpoint()
    if (!endpoint) {
      // Fără endpoint configurat nu pretindem că mesajul a fost trimis.
      setStatus({ kind: 'demo', payload: values })
      return
    }

    setStatus({ kind: 'pending' })
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setStatus({ kind: 'sent' })
      setValues(EMPTY)
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? `Trimiterea a eșuat (${error.message}).`
            : 'Trimiterea a eșuat.',
      })
    }
  }

  const pending = status.kind === 'pending'
  const endpoint = getEndpoint()

  return (
    <div className="stack" style={{ '--flow': 'var(--s-5)' } as CSSProperties}>
      {!endpoint && (
        <p className="notice">
          <strong>Formular în mod demonstrativ.</strong> Nu este configurat niciun
          serviciu de trimitere, așa că mesajul nu pleacă nicăieri. Validarea
          funcționează, iar după completare primiți un link care deschide mesajul în
          clientul dumneavoastră de e-mail. Pentru trimitere reală, setați{' '}
          <code>VITE_CONTACT_ENDPOINT</code>.
        </p>
      )}

      <form className="form" onSubmit={handleSubmit} ref={formRef} noValidate>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="name">
              Nume și prenume
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={update('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              required
            />
            {errors.name && (
              <p className="field__error" id="name-error">
                {errors.name}
              </p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              required
            />
            {errors.email && (
              <p className="field__error" id="email-error">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="organisation">
              Organizație <span className="muted">(opțional)</span>
            </label>
            <input
              id="organisation"
              name="organisation"
              autoComplete="organization"
              value={values.organisation}
              onChange={update('organisation')}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="topic">
              Subiect
            </label>
            <select
              id="topic"
              name="topic"
              value={values.topic}
              onChange={update('topic')}
            >
              {services.map((service) => (
                <option key={service.id} value={service.title}>
                  {service.title}
                </option>
              ))}
              <option value="Altceva">Altceva</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="message">
            Despre ce este vorba
          </label>
          <p className="field__hint" id="message-hint">
            Ce proces vă consumă timp astăzi, cine îl folosește și ce sisteme sunt
            implicate. Detaliile ajută la un răspuns concret.
          </p>
          <textarea
            id="message"
            name="message"
            value={values.message}
            onChange={update('message')}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? 'message-hint message-error' : 'message-hint'
            }
            required
          />
          {errors.message && (
            <p className="field__error" id="message-error">
              {errors.message}
            </p>
          )}
        </div>

        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">Nu completați acest câmp</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="form__submit">
          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? 'Se trimite…' : 'Trimite mesajul'}
          </button>
          <span className="mono-sm" style={{ alignSelf: 'center' }}>
            Răspundem în maximum două zile lucrătoare.
          </span>
        </div>
      </form>

      <div role="status" aria-live="polite">
        {status.kind === 'sent' && (
          <p className="notice notice--ok">
            <strong>Mesaj trimis.</strong> Vă răspundem pe adresa indicată.
          </p>
        )}

        {status.kind === 'demo' && (
          <p className="notice">
            <strong>Datele sunt valide, dar mesajul nu a fost trimis</strong> —
            formularul rulează în mod demonstrativ.{' '}
            <a href={mailtoHref(status.payload)}>
              Deschideți mesajul în clientul de e-mail
            </a>{' '}
            sau scrieți direct la{' '}
            <a href={`mailto:${company.email}`}>{company.email}</a>.
          </p>
        )}

        {status.kind === 'error' && (
          <p className="notice notice--error">
            <strong>{status.message}</strong> Încercați din nou sau scrieți la{' '}
            <a href={`mailto:${company.email}`}>{company.email}</a>.
          </p>
        )}
      </div>
    </div>
  )
}
