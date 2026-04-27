declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly VITE_LEGAL_NAME?: string;
  readonly VITE_LEGAL_STREET?: string;
  readonly VITE_LEGAL_POSTAL_CODE?: string;
  readonly VITE_LEGAL_CITY?: string;
  readonly VITE_LEGAL_COUNTRY?: string;
  readonly VITE_LEGAL_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
