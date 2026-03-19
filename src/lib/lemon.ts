/**
 * Lemon Squeezy overlay checkout helper.
 *
 * Relies on the global `window.LemonSqueezy` injected by lemon.js
 * (loaded via <script> in index.html). Degrades gracefully to new-tab
 * if the SDK fails to load or fails to initialise after createLemonSqueezy().
 *
 * The `userId` is appended as custom checkout data so the server-side
 * webhook can identify which user completed the purchase.
 */

export interface OpenCheckoutOptions {
    /** Base LS variant checkout URL (no ?embed=1 or custom params) */
    url: string
    /** Supabase user UUID — forwarded to webhook via checkout[custom][user_id] */
    userId: string
    /** Called immediately after the Checkout.Success event fires */
    onSuccess: () => void
}

export function openLemonSqueezyCheckout({ url, userId, onSuccess }: OpenCheckoutOptions): void {
    // Build checkout URL: append user_id custom param + embed flag
    const separator   = url.includes('?') ? '&' : '?'
    const checkoutUrl = `${url}${separator}checkout[custom][user_id]=${encodeURIComponent(userId)}&embed=1`
    const fallbackUrl = `${url}${separator}checkout[custom][user_id]=${encodeURIComponent(userId)}`

    if (typeof window.createLemonSqueezy === 'function') {
        window.createLemonSqueezy()

        // createLemonSqueezy() should synchronously populate window.LemonSqueezy.
        // Guard against SDK init failure — fall back to new-tab if not ready.
        if (!window.LemonSqueezy?.Url?.Open) {
            console.warn('[lemon] SDK init failed — falling back to new tab')
            window.open(fallbackUrl, '_blank')
            return
        }

        window.LemonSqueezy.Setup({
            eventHandler: (event) => {
                if (event.event === 'Checkout.Success') {
                    window.LemonSqueezy?.Url.Close()
                    onSuccess()
                }
            },
        })
        window.LemonSqueezy.Url.Open(checkoutUrl)
    } else {
        // lemon.js not loaded — open in new tab
        window.open(fallbackUrl, '_blank')
    }
}
