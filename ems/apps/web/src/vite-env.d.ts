/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the StackEDU API, e.g. https://api.stackedu.rw */
  readonly VITE_API_URL?: string
  /** Git commit baked in at build time for cache busting after deploy. */
  readonly VITE_APP_BUILD_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
