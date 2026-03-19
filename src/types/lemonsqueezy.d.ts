// Type declarations for the Lemon Squeezy overlay SDK
// https://docs.lemonsqueezy.com/guides/developer-guide/taking-payments#overlay-checkout

interface LSCheckoutEvent {
    event: 'Checkout.Success' | 'Checkout.Dismissed' | string;
    data?: Record<string, unknown>;
}

interface LemonSqueezyInstance {
    Setup: (options: { eventHandler: (event: LSCheckoutEvent) => void }) => void;
    Url: {
        Open: (url: string) => void;
        Close: () => void;
    };
}

declare global {
    interface Window {
        createLemonSqueezy?: () => void;
        LemonSqueezy?: LemonSqueezyInstance;
    }
}

export {};
