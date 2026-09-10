import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ReconciliationPage } from './pages/ReconciliationPage';
import { UnmatchedPage } from './pages/UnmatchedPage';
import { AuditPage } from './pages/AuditPage';
import { SchedulePage } from './pages/SchedulePage';
import { ReviewPage } from './pages/ReviewPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
            <Route path="review/:matchId" element={<ReviewPage />} />
            <Route path="unmatched" element={<UnmatchedPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="schedule" element={<SchedulePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};


export default App;
