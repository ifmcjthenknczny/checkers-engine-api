/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NUXT_PUBLIC_ENGINE_API_URL?: string
  readonly NUXT_MODELS_PATH?: string
  readonly NODE_ENV?: string
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
