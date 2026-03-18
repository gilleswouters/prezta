import Plausible from 'plausible-tracker';

let _trackFn: ((name: string, opts?: { props?: Record<string, string> }) => void) | null = null;

export function initPlausible(): void {
    const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
    if (!domain) return; // no-op in dev if env var is missing
    const { trackEvent } = Plausible({ domain, trackLocalhost: false });
    _trackFn = trackEvent;
}

export function trackEvent(name: string, props?: Record<string, string>): void {
    _trackFn?.(name, props ? { props } : undefined);
}
