import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import { ProjectProvider } from './context/ProjectContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AppLayout } from './components/layout/AppLayout';
import { ProjectWorkspaceLayout } from './components/layout/ProjectWorkspaceLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SolutionsPage } from './pages/public/SolutionsPage';
import { PricingPage } from './pages/public/PricingPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { DocsPage } from './pages/public/DocsPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { FAQPage } from './pages/public/FAQPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { CookiesPage } from './pages/public/CookiesPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// App Portfolio Pages
import { PortfolioDashboardPage } from './pages/app/PortfolioDashboardPage';
import { ProjectsPage } from './pages/app/ProjectsPage';
import { CreateProjectPage } from './pages/app/CreateProjectPage';

// Project Workspace Pages
import { ProjectOverviewPage } from './pages/project/ProjectOverviewPage';
import { ProjectSchedulePage } from './pages/project/ProjectSchedulePage';
import { ProjectActivitiesPage } from './pages/project/ProjectActivitiesPage';
import { ProjectReportsPage } from './pages/project/ProjectReportsPage';
import { ProjectUploadPage } from './pages/project/ProjectUploadPage';
import { ProjectProcessingPage } from './pages/project/ProjectProcessingPage';
import { ProjectReconciliationPage } from './pages/project/ProjectReconciliationPage';
import { ProjectReviewPage } from './pages/project/ProjectReviewPage';
import { ProjectUnmatchedPage } from './pages/project/ProjectUnmatchedPage';
import { ProjectAnalyticsPage } from './pages/project/ProjectAnalyticsPage';
import { ProjectAuditPage } from './pages/project/ProjectAuditPage';
import { ProjectTeamPage } from './pages/project/ProjectTeamPage';
import { ProjectSettingsPage } from './pages/project/ProjectSettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <Routes>
            {/* PUBLIC MARKETING ROUTES */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
            </Route>

            {/* AUTHENTICATION ROUTES */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* PORTFOLIO APPLICATION ROUTES */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<PortfolioDashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<CreateProjectPage />} />
            </Route>

            {/* PROJECT WORKSPACE ROUTES */}
            <Route path="/projects/:id" element={<ProjectWorkspaceLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<ProjectOverviewPage />} />
              <Route path="schedule" element={<ProjectSchedulePage />} />
              <Route path="activities" element={<ProjectActivitiesPage />} />
              <Route path="reports" element={<ProjectReportsPage />} />
              <Route path="reports/upload" element={<ProjectUploadPage />} />
              <Route path="upload" element={<Navigate to="reports/upload" replace />} />
              <Route path="processing" element={<ProjectProcessingPage />} />
              <Route path="reconciliation" element={<ProjectReconciliationPage />} />
              <Route path="review" element={<ProjectReviewPage />} />
              <Route path="review/:matchId" element={<ProjectReviewPage />} />
              <Route path="unmatched" element={<ProjectUnmatchedPage />} />
              <Route path="analytics" element={<ProjectAnalyticsPage />} />
              <Route path="audit" element={<ProjectAuditPage />} />
              <Route path="team" element={<ProjectTeamPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
            </Route>

            {/* BACKWARD COMPATIBILITY / ALIAS REDIRECTS */}
            <Route path="/upload" element={<Navigate to="/projects/proj-01/reports/upload" replace />} />
            <Route path="/reconciliation" element={<Navigate to="/projects/proj-01/reconciliation" replace />} />
            <Route path="/review/:matchId" element={<Navigate to="/projects/proj-01/review" replace />} />
            <Route path="/unmatched" element={<Navigate to="/projects/proj-01/unmatched" replace />} />
            <Route path="/schedule" element={<Navigate to="/projects/proj-01/schedule" replace />} />
            <Route path="/audit" element={<Navigate to="/projects/proj-01/audit" replace />} />

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
};

export default App;
