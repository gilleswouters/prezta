import { lazy, Suspense } from 'react';
import MaintenancePage from '@/pages/MaintenancePage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import ClientsPage from '@/pages/ClientsPage'
import CataloguePage from '@/pages/CataloguePage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectWizard from '@/components/projects/ProjectWizard'
import QuoteBuilderPage from '@/pages/QuoteBuilderPage'
import LandingPage from '@/pages/LandingPage'
import AppLayout from '@/components/layout/AppLayout'
import InvoicesPage from '@/pages/InvoicesPage'
import PricingPage from '@/pages/PricingPage'
import CalendarPage from '@/pages/CalendarPage'
import ParametresEmailsPage from '@/pages/ParametresEmailsPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import MentionsLegalesPage from '@/pages/legal/MentionsLegalesPage'
import ConfidentialitePage from '@/pages/legal/ConfidentialitePage'
import CGVPage from '@/pages/legal/CGVPage'
import { Toaster } from '@/components/ui/sonner'

// Heavy pages — code-split to reduce main bundle size
const TimesheetPage        = lazy(() => import('@/pages/TimesheetPage'))
const PlanningPage         = lazy(() => import('@/pages/PlanningPage'))
const RevenueDashboardPage = lazy(() => import('@/pages/RevenueDashboardPage'))
const ExportComptablePage  = lazy(() => import('@/pages/ExportComptablePage'))
const ContractTemplatesPage = lazy(() => import('@/pages/ContractTemplatesPage'))
const ClientPortalPage     = lazy(() => import('@/pages/ClientPortalPage'))
const FournisseursPage     = lazy(() => import('@/pages/FournisseursPage'))

const PageFallback = (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--brand]" />
  </div>
)

function App() {
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
  const isPreviewBypass =
    window.location.pathname === '/admin-preview' &&
    new URLSearchParams(window.location.search).get('key') === 'prezta-admin-2026'

  if (isMaintenanceMode && !isPreviewBypass) {
    return <MaintenancePage />
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={PageFallback}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/portal/:portalLink" element={<ClientPortalPage />} />
            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
            <Route path="/confidentialite" element={<ConfidentialitePage />} />
            <Route path="/cgv" element={<CGVPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/calendrier" element={<CalendarPage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/catalogue" element={<CataloguePage />} />
                <Route path="/templates" element={<ContractTemplatesPage />} />
                <Route path="/registre" element={<InvoicesPage />} />
                <Route path="/projets" element={<ProjectsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/projets/nouveau" element={<ProjectWizard />} />
                <Route path="/projets/:id/devis" element={<QuoteBuilderPage />} />
                <Route path="/parametres/emails" element={<ParametresEmailsPage />} />
                <Route path="/parametres/abonnement" element={<Navigate to="/profil#abonnement" replace />} />
                <Route path="/planning" element={<PlanningPage />} />
                <Route path="/calculateur" element={<Navigate to="/catalogue?tab=calculateur" replace />} />
                <Route path="/revenus" element={<RevenueDashboardPage />} />
                <Route path="/export-comptable" element={<ExportComptablePage />} />
                <Route path="/temps" element={<TimesheetPage />} />
                <Route path="/fournisseurs" element={<FournisseursPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}

export default App
