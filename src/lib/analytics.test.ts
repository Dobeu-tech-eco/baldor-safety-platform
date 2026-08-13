/**
 * Dynamic `import('./analytics')` is used only in tests so `vi.resetModules()`
 * can re-run module-level idempotency state. Production code uses static imports.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mixpanel, posthog, ReactGA, datadogRum, Sentry } = vi.hoisted(() => ({
  mixpanel: {
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    people: { set: vi.fn() },
  },
  posthog: {
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
  },
  ReactGA: {
    initialize: vi.fn(),
    event: vi.fn(),
    send: vi.fn(),
    set: vi.fn(),
  },
  datadogRum: {
    init: vi.fn(),
    setUser: vi.fn(),
    clearUser: vi.fn(),
    addAction: vi.fn(),
    startView: vi.fn(),
  },
  Sentry: {
    init: vi.fn(),
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
  },
}));

vi.mock('mixpanel-browser', () => ({ default: mixpanel }));
vi.mock('posthog-js', () => ({ default: posthog }));
vi.mock('react-ga4', () => ({ default: ReactGA }));
vi.mock('@datadog/browser-rum', () => ({ datadogRum }));
vi.mock('@sentry/react', () => Sentry);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('sanitizeProps', () => {
  it('strips email and occurrence keys', async () => {
    const { sanitizeProps } = await import('./analytics');
    const result = sanitizeProps({
      email: 'user@example.com',
      occurrence: 'OCC-12345',
      occurrence_number: 'OCC-999',
      action: 'open',
      count: 3,
    });

    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('occurrence');
    expect(result).not.toHaveProperty('occurrence_number');
    expect(result).toEqual({ action: 'open', count: 3 });
  });

  it('strips string values that look like emails', async () => {
    const { sanitizeProps } = await import('./analytics');
    const result = sanitizeProps({
      note: 'person@company.com',
      ok: 'yes',
    });

    expect(result).not.toHaveProperty('note');
    expect(result).toEqual({ ok: 'yes' });
  });
});

describe('trackEvent', () => {
  it('does not pass email in properties to mixpanel', async () => {
    const { trackEvent } = await import('./analytics');
    trackEvent('view_dashboard', {
      email: 'admin@baldor.test',
      section: 'ytd',
    });

    expect(mixpanel.track).toHaveBeenCalledTimes(1);
    expect(mixpanel.track).toHaveBeenCalledWith(
      'view_dashboard',
      expect.objectContaining({ section: 'ytd' }),
    );

    const props = mixpanel.track.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(props).not.toHaveProperty('email');
    expect(JSON.stringify(props)).not.toContain('admin@baldor.test');
  });
});

describe('initAnalytics', () => {
  it('is idempotent (second call does not re-init)', async () => {
    const { initAnalytics } = await import('./analytics');
    initAnalytics();
    initAnalytics();

    expect(mixpanel.init).toHaveBeenCalledTimes(1);
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
  });
});

describe('identifyUser', () => {
  it('uses userId not email', async () => {
    const { identifyUser } = await import('./analytics');
    identifyUser({ userId: 'usr_abc123', isAdmin: true });

    expect(mixpanel.identify).toHaveBeenCalledWith('usr_abc123');
    expect(mixpanel.identify).not.toHaveBeenCalledWith(expect.stringMatching(/@/));
    expect(JSON.stringify(mixpanel.identify.mock.calls)).not.toMatch(/email/i);
    expect(JSON.stringify(mixpanel.identify.mock.calls)).not.toContain('@');

    expect(posthog.identify).toHaveBeenCalledWith(
      'usr_abc123',
      expect.not.objectContaining({ email: expect.anything() }),
    );
    const posthogTraits = posthog.identify.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(posthogTraits).not.toHaveProperty('email');
    expect(JSON.stringify(posthog.identify.mock.calls)).not.toContain('@');

    expect(ReactGA.set).toHaveBeenCalledWith({ userId: 'usr_abc123' });
  });
});
