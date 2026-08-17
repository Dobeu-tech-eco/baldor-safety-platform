// Vite injects import.meta.env at build time in consuming apps.
interface ImportMeta {
  readonly env: {
    readonly BASE_URL: string;
    readonly [key: string]: string | boolean | undefined;
  };
}
