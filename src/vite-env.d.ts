/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endpoint POST pentru formularul de contact. Vezi .env.example. */
  readonly VITE_CONTACT_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
