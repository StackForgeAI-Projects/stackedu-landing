/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the StackEDU API, e.g. https://api.stackedu.rw */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
