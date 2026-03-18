import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { initPlausible } from '@/lib/plausible'
import { initSentry, Sentry } from '@/lib/sentry'

// Initialise monitoring before React renders
initSentry();
initPlausible();

const queryClient = new QueryClient()

function ErrorFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-8">
            <div className="bg-white border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
                <div className="h-14 w-14 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h1 className="text-xl font-bold text-text mb-2">Une erreur est survenue</h1>
                <p className="text-text-muted mb-6">Rechargez la page. Si le problème persiste, contactez le support.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-brand text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-hover transition-colors"
                >
                    Recharger la page
                </button>
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
