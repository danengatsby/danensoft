import { company } from '../content/site'

export type ContactValues = {
  name: string
  email: string
  organisation: string
  topic: string
  message: string
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>

export const MESSAGE_MAX_LENGTH = 5000
export const MESSAGE_TOO_LONG = 'Mesajul poate avea cel mult 5.000 de caractere.'

/** Validare pură, testabilă independent de componentă. */
export function validate(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {}

  if (values.name.trim().length < 2) {
    errors.name = 'Introduceți numele dumneavoastră.'
  }
  if (!/^[^\s@<>,;:"\\]+@[^\s@<>,;:"\\]+\.[^\s@<>,;:"\\]{2,}$/.test(values.email.trim())) {
    errors.email = 'Introduceți o adresă de e-mail validă.'
  }
  if (values.message.trim().length < 20) {
    errors.message = 'Descrieți pe scurt contextul — cel puțin 20 de caractere.'
  }
  if (values.message.length > MESSAGE_MAX_LENGTH) {
    errors.message = MESSAGE_TOO_LONG
  }

  return errors
}

/** Link mailto pre-completat, folosit când nu există endpoint configurat. */
export function mailtoHref(values: ContactValues, t: (text: string) => string = (text) => text): string {
  const body = [
    `${t('Nume')}: ${values.name}`,
    `${t('E-mail')}: ${values.email}`,
    values.organisation ? `${t('Organizație')}: ${values.organisation}` : null,
    `${t('Subiect')}: ${t(values.topic)}`,
    '',
    values.message,
  ]
    .filter(Boolean)
    .join('\n')

  return `mailto:${company.email}?subject=${encodeURIComponent(
    `${t('Cerere')}: ${t(values.topic)}`,
  )}&body=${encodeURIComponent(body)}`
}
