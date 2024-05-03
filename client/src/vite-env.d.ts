/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODEL_UUID: string;
  readonly VITE_STORAGE?: "local" | "server";
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
