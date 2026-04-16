/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_INTERSTITIAL_AD_GROUP_ID?: string;
  readonly VITE_REWARDED_AD_GROUP_ID?: string;
  readonly VITE_TOP_BANNER_AD_GROUP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
