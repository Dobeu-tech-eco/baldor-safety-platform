/**
 * Privacy-safe analytics bootstrap for Baldor Safety Insights.
 *
 * SDKs use static top-level imports so Vitest can `vi.mock` them and so this
 * file complies with the no-inline-imports rule. Dynamic `import()` would be
 * the usual way to keep analytics optional/lazy and to avoid loading SDKs in
 * tests, but static imports keep init idempotency testable without inline
 * imports. Microsoft Clarity has no ESM SDK — it is injected as a script tag.
 *
 * Never send PII (emails, names, occurrence numbers, employee names, phones).
 */
import posthog from 'posthog-js';
import mixpanel from 'mixpanel-browser';
import ReactGA from 'react-ga4';
import { datadogRum } from '@datadog/browser-rum';
import * as Sentry from '@sentry/react';

export type AnalyticsIdentity = { userId: string; isAdmin?: boolean };

const PII_KEY_PATTERN = /email|password|employee|occurrence|name|phone/i;
const EMAIL_VALUE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GA_LINKER_DOMAINS = [
  'dobeu.net',
  'dobeu.online',
  'dobeu.dev',
  'dobeu.cloud',
  'dobeu.app',
  'dobeu.tech',
  'dobeu.info',
  'dobeu.org',
  'dobeu.site',
  'dobeu.store',
  'dobeu.shop',
  'dobeu.website',
  'dobeu.at',
  'dobeu.icu',
];

const DEFAULT_GA_MEASUREMENT_ID = 'G-6MX5G49Z0R';
const DEFAULT_POSTHOG_KEY = 'phc_Gaksl1OP0ZVYeErlumeRTuj5xJqPMQPe3H8UKxMpwAM';
const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';
const DEFAULT_MIXPANEL_TOKEN = '3861188';
const DEFAULT_DATADOG_APPLICATION_ID = '7964b0ba-f8e4-4d6a-8fca-677e2510b0f5';
const DEFAULT_DATADOG_CLIENT_TOKEN = 'puba21a9d877451b5ad06ec480b33172739';
const DEFAULT_DATADOG_SITE = 'datadoghq.com';
const DEFAULT_SENTRY_DSN =
  'https://b5d81180d1c17027e0d34064260d949e@o4509495747280896.ingest.us.sentry.io/4511902518607872';

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

let analyticsInitialized = false;

function envValue(key: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function looksLikeEmail(value: string): boolean {
  return EMAIL_VALUE_PATTERN.test(value.trim());
}

function warnFailed(action: string, error: unknown): void {
  console.warn(`[analytics] ${action} failed`, error);
}

function safe(action: string, fn: () => void): void {
  try {
    fn();
  } catch (error: unknown) {
    warnFailed(action, error);
  }
}

/** SDK property bags are loosely typed; sanitized values are JSON-safe. */
function asEventProps(props: Record<string, unknown>): Record<string, string | number | boolean | null> {
  return props as Record<string, string | number | boolean | null>;
}

export function sanitizeProps(properties?: Record<string, unknown>): Record<string, unknown> {
  if (!properties) return {};

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (PII_KEY_PATTERN.test(key)) continue;
    if (typeof value === 'string' && looksLikeEmail(value)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeProps(value as Record<string, unknown>);
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

function injectClarity(projectId: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const existing = document.querySelector(`script[src*="clarity.ms/tag/${projectId}"]`);
  if (!existing) {
    const w = window;
    if (!w.clarity) {
      const queue: unknown[][] = [];
      const clarityFn = ((...args: unknown[]) => {
        queue.push(args);
      }) as ClarityFn;
      clarityFn.q = queue;
      w.clarity = clarityFn;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
    document.head.appendChild(script);
  }

  document.documentElement.classList.add('clarity-mask');
  if (typeof window.clarity === 'function') {
    window.clarity('consent');
  }
}

export function initAnalytics(): void {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  const gaMeasurementId = envValue('VITE_GA_MEASUREMENT_ID', DEFAULT_GA_MEASUREMENT_ID);
  const posthogKey = envValue('VITE_POSTHOG_KEY', DEFAULT_POSTHOG_KEY);
  const posthogHost = envValue('VITE_POSTHOG_HOST', DEFAULT_POSTHOG_HOST);
  const mixpanelToken = envValue('VITE_MIXPANEL_TOKEN', DEFAULT_MIXPANEL_TOKEN);
  const datadogApplicationId = envValue(
    'VITE_DATADOG_APPLICATION_ID',
    DEFAULT_DATADOG_APPLICATION_ID,
  );
  const datadogClientToken = envValue(
    'VITE_DATADOG_CLIENT_TOKEN',
    DEFAULT_DATADOG_CLIENT_TOKEN,
  );
  const datadogSite = envValue('VITE_DATADOG_SITE', DEFAULT_DATADOG_SITE);
  const sentryDsn = envValue('VITE_SENTRY_DSN', DEFAULT_SENTRY_DSN);
  const clarityProjectId = envValue('VITE_CLARITY_PROJECT_ID');

  safe('PostHog init', () => {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false,
      mask_all_element_attributes: true,
      mask_all_text: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '*',
      },
    });
  });

  safe('Mixpanel init', () => {
    mixpanel.init(mixpanelToken, {
      track_pageview: false,
      persistence: 'localStorage',
      ip: false,
      property_blacklist: ['$email', 'email', '$name', 'name', 'password', 'phone', 'employee', 'occurrence'],
      record_mask_text_selector: '*',
      property_denylist: ['$email', 'email', '$name', 'name', 'password', 'phone', 'employee', 'occurrence'],
    } as Parameters<typeof mixpanel.init>[1]);
  });

  safe('GA init', () => {
    ReactGA.initialize(gaMeasurementId, {
      gtagOptions: {
        linker: {
          domains: [...GA_LINKER_DOMAINS],
        },
      },
    });
  });

  if (datadogApplicationId && datadogClientToken) {
    safe('Datadog RUM init', () => {
      datadogRum.init({
        applicationId: datadogApplicationId,
        clientToken: datadogClientToken,
        site: datadogSite,
        env: 'production',
        service: 'baldor-safety-insights',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        defaultPrivacyLevel: 'mask-user-input',
        trackUserInteractions: true,
      } as Parameters<typeof datadogRum.init>[0]);
    });
  }

  if (sentryDsn) {
    safe('Sentry init', () => {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.1,
        environment: 'production',
        sendDefaultPii: false,
      });
    });
  }

  if (clarityProjectId) {
    safe('Clarity init', () => {
      injectClarity(clarityProjectId);
    });
  }
}

export function identifyUser(identity: AnalyticsIdentity): void {
  initAnalytics();
  const userId = identity.userId;
  const traits = sanitizeProps(
    identity.isAdmin === undefined ? {} : { is_admin: identity.isAdmin },
  );

  safe('PostHog identify', () => {
    posthog.identify(userId, asEventProps(traits));
  });

  safe('Mixpanel identify', () => {
    mixpanel.identify(userId);
    if (Object.keys(traits).length > 0) {
      mixpanel.people.set(asEventProps(traits));
    }
  });

  safe('GA identify', () => {
    ReactGA.set({ userId });
  });

  safe('Datadog identify', () => {
    datadogRum.setUser({ id: userId, ...traits });
  });

  safe('Sentry identify', () => {
    Sentry.setUser({ id: userId });
  });

  safe('Clarity identify', () => {
    window.clarity?.('identify', userId);
  });
}

export function resetAnalytics(): void {
  safe('PostHog reset', () => {
    posthog.reset();
  });

  safe('Mixpanel reset', () => {
    mixpanel.reset();
  });

  safe('GA reset', () => {
    ReactGA.set({ userId: undefined });
  });

  safe('Datadog reset', () => {
    datadogRum.clearUser();
  });

  safe('Sentry reset', () => {
    Sentry.setUser(null);
  });
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  const props = sanitizeProps(properties);

  safe('PostHog capture', () => {
    posthog.capture(name, asEventProps(props));
  });

  safe('Mixpanel track', () => {
    mixpanel.track(name, asEventProps(props));
  });

  safe('GA event', () => {
    ReactGA.event(name, asEventProps(props));
  });

  safe('Datadog action', () => {
    datadogRum.addAction(name, asEventProps(props));
  });

  safe('Sentry breadcrumb', () => {
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: name,
      data: props,
      level: 'info',
    });
  });

  safe('Clarity event', () => {
    window.clarity?.('event', name);
  });
}

export function trackPageView(path: string): void {
  const props = sanitizeProps({ path });

  safe('PostHog pageview', () => {
    posthog.capture('$pageview', asEventProps(props));
  });

  safe('Mixpanel pageview', () => {
    mixpanel.track('Page View', asEventProps(props));
  });

  safe('GA pageview', () => {
    ReactGA.send({ hitType: 'pageview', page: path });
  });

  safe('Datadog view', () => {
    datadogRum.startView({ name: path });
  });
}
