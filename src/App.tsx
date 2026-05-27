import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthProvider';
import LoginPage from './auth/LoginPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ExtensionDemo from './pages/ExtensionDemo';
import ApplicationHistory from './pages/ApplicationHistory';
import ResumeLibrary from './pages/ResumeLibrary';
import SavedAnswers from './pages/SavedAnswers';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route
              path="/onboarding"
              element={(
                <ProtectedRoute requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              )}
            />

            <Route
              element={(
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              )}
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/extension" element={<ExtensionDemo />} />
              <Route path="/history" element={<ApplicationHistory />} />
              <Route path="/resumes" element={<ResumeLibrary />} />
              <Route path="/saved-answers" element={<SavedAnswers />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
