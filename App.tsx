import React, { useEffect, useState, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Layouts & Pages
import { Layout } from './components/Layout';
import { Login } from './pages/Login';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const DayView = React.lazy(() => import('./pages/DayView').then(module => ({ default: module.DayView })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Library = React.lazy(() => import('./pages/Library').then(module => ({ default: module.Library })));
const Community = React.lazy(() => import('./pages/Community').then(module => ({ default: module.Community })));
const Achievements = React.lazy(() => import('./pages/Achievements').then(module => ({ default: module.Achievements })));
const CurrentDayRedirect = React.lazy(() => import('./components/CurrentDayRedirect').then(module => ({ default: module.CurrentDayRedirect })));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword').then(module => ({ default: module.ChangePassword })));

// Admin Pages Lazy Load
const AdminSettings = React.lazy(() => import('./pages/Admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard').then(module => ({ default: module.AdminDashboard })));
const AdminChallenges = React.lazy(() => import('./pages/Admin/AdminChallenges').then(module => ({ default: module.AdminChallenges })));
const ChallengeEditor = React.lazy(() => import('./pages/Admin/ChallengeEditor').then(module => ({ default: module.ChallengeEditor })));
const AdminUsers = React.lazy(() => import('./pages/Admin/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminUserDetail = React.lazy(() => import('./pages/Admin/AdminUserDetail').then(module => ({ default: module.AdminUserDetail })));
const AdminLibrary = React.lazy(() => import('./pages/Admin/AdminLibrary').then(module => ({ default: module.AdminLibrary })));

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-fire-dark flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-fire-orange border-t-transparent rounded-full animate-spin"></div>
    <p className="text-fire-gray font-medium animate-pulse">Carregando FIRE...</p>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Centralized session handler
    const handleSession = async (currentSession: Session | null) => {
      try {
        if (!currentSession) {
          if (mounted) {
            setSession(null);
            setMustChangePassword(false);
            setLoading(false);
          }
          return;
        }

        // Check profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('must_change_password, status')
          .eq('id', currentSession.user.id)
          .single();

        if (profile?.status === 'BLOCKED') {
          alert('Seu acesso foi bloqueado. Entre em contato com o suporte.');
          await supabase.auth.signOut();
          localStorage.clear();
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          window.location.href = '#/login';
          return;
        }

        if (error && !profile) {
          console.warn("Profile check failed - proceeding with session only", error);
        }

        if (mounted) {
          setSession(currentSession);
          setMustChangePassword(profile?.must_change_password || false);
          setLoading(false);
        }
      } catch (err) {
        console.error("Session handling error:", err);
        if (mounted) setLoading(false);
      }
    };

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <LoadingScreen />;

  // Helper to check if logged in user is admin
  const isAdmin = session?.user?.email === 'admin@ofire.com.br' ||
    session?.user?.app_metadata?.role === 'admin' ||
    session?.user?.user_metadata?.role === 'admin';

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Redirect Logic: If logged in as admin, go to /admin, else go to / */}
          <Route path="/login" element={
            !session ? <Login /> : (mustChangePassword ? <Navigate to="/change-password" /> : (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/" />))
          } />

          <Route path="/change-password" element={
            session ? <ChangePassword /> : <Navigate to="/login" />
          } />

          {/* Protected Member Routes */}
          <Route path="/" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><Dashboard /></Layout>) : <Navigate to="/login" />} />
          <Route path="/day/:id" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><DayView /></Layout>) : <Navigate to="/login" />} />
          <Route path="/profile" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><Profile /></Layout>) : <Navigate to="/login" />} />
          <Route path="/library" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><Library /></Layout>) : <Navigate to="/login" />} />
          <Route path="/community" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><Community /></Layout>) : <Navigate to="/login" />} />
          <Route path="/achievements" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><Achievements /></Layout>) : <Navigate to="/login" />} />
          <Route path="/day/current" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout><CurrentDayRedirect /></Layout>) : <Navigate to="/login" />} />

          {/* Admin Routes */}
          <Route path="/admin" element={session ? (mustChangePassword ? <Navigate to="/change-password" /> : <Layout isAdmin><AdminDashboard /></Layout>) : <Navigate to="/login" />} />
          <Route path="/admin/settings" element={session ? <Layout isAdmin><AdminSettings /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin/challenges" element={session ? <Layout isAdmin><AdminChallenges /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin/challenges/new" element={session ? <Layout isAdmin><ChallengeEditor /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin/challenges/edit/:id" element={session ? <Layout isAdmin><ChallengeEditor /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin/users" element={session ? <Layout isAdmin><AdminUsers /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin/users/:id" element={session ? <Layout isAdmin><AdminUserDetail /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin/library" element={session ? <Layout isAdmin><AdminLibrary /></Layout> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;