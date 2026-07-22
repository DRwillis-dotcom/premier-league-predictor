import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import { LeaguePage } from './pages/LeaguePage'
import { LoginPage } from './pages/LoginPage'
import { MyScoresPage } from './pages/MyScoresPage'
import { PredictionsPage } from './pages/PredictionsPage'
import { SignUpPage } from './pages/SignUpPage'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route element={<Layout />}>
        <Route index element={<PredictionsPage />} />
        <Route path="league" element={<LeaguePage />} />
        <Route
          path="my-scores"
          element={
            <ProtectedRoute>
              <MyScoresPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="setup-screen">
        <h1>Premier League Predictor</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env</code> and add your Supabase project URL and
          anon key, then restart the dev server.
        </p>
      </div>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
