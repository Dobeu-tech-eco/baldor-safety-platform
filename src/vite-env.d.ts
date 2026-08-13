/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID: string | undefined;
  readonly VITE_POSTHOG_KEY: string | undefined;
  readonly VITE_POSTHOG_HOST: string | undefined;
  readonly VITE_MIXPANEL_TOKEN: string | undefined;
  readonly VITE_DATADOG_APPLICATION_ID: string | undefined;
  readonly VITE_DATADOG_CLIENT_TOKEN: string | undefined;
  readonly VITE_DATADOG_SITE: string | undefined;
  readonly VITE_SENTRY_DSN: string | undefined;
  readonly VITE_CLARITY_PROJECT_ID: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
