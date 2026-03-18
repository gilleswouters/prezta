import * as Sentry from '@sentry/react';

export function initSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
    if (!dsn) return; // no-op gracefully if env var is missing (dev safety)
    Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
    });
}

export { Sentry };
