import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
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
import ClientPortalPage from '@/pages/ClientPortalPage'
import CalendarPage from '@/pages/CalendarPage'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/portal/:portalLink" element={<ClientPortalPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/catalogue" element={<CataloguePage />} />
              <Route path="/registre" element={<InvoicesPage />} />
              <Route path="/projets" element={<ProjectsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/projets/nouveau" element={<ProjectWizard />} />
              <Route path="/projets/:id/devis" element={<QuoteBuilderPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}

export default App
