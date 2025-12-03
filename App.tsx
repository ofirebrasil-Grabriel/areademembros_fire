import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Layouts & Pages
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Payment } from './pages/Payment';
import { Dashboard } from './pages/Dashboard';
import { DayView } from './pages/DayView';
import { Profile } from './pages/Profile';
import { Library } from './pages/Library';
import { Community } from './pages/Community';
import { Achievements } from './pages/Achievements';
import { AdminSettings } from './pages/Admin/AdminSettings';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { AdminChallenges } from './pages/Admin/AdminChallenges';
import { ChallengeEditor } from './pages/Admin/ChallengeEditor';
import { AdminUsers } from './pages/Admin/AdminUsers';
import { AdminUserDetail } from './pages/Admin/AdminUserDetail';
import { AdminLibrary } from './pages/Admin/AdminLibrary';
import { CurrentDayRedirect } from './components/CurrentDayRedirect';

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

  useEffect(() => {
    // 1. Check for Demo Session first (for quick testing without backend)
    const demoSession = localStorage.getItem('fire_demo_session');
    if (demoSession) {
      try {
        setSession(JSON.parse(demoSession));
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse demo session", e);
        localStorage.removeItem('fire_demo_session');
      }
    }

    // 2. Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      }
      setLoading(false);
    });

    // 3. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  // Helper to check if logged in user is admin
  const isAdmin = session?.user?.email === 'admin@ofire.com.br' ||
    session?.user?.app_metadata?.role === 'admin' ||
    session?.user?.user_metadata?.role === 'admin';

  return (
    <Router>
      <Routes>
        {/* Redirect Logic: If logged in as admin, go to /admin, else go to / */}
        <Route path="/login" element={
          !session ? <Login /> : (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/" />)
        } />

        <Route path="/payment" element={session ? <Payment /> : <Navigate to="/login" />} />

        {/* Protected Member Routes */}
        <Route path="/" element={session ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/day/:id" element={session ? <Layout><DayView /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Layout><Profile /></Layout> : <Navigate to="/login" />} />
        <Route path="/library" element={session ? <Layout><Library /></Layout> : <Navigate to="/login" />} />
        <Route path="/community" element={session ? <Layout><Community /></Layout> : <Navigate to="/login" />} />
        <Route path="/achievements" element={session ? <Layout><Achievements /></Layout> : <Navigate to="/login" />} />
        <Route path="/day/current" element={session ? <Layout><CurrentDayRedirect /></Layout> : <Navigate to="/login" />} />

        {/* Admin Routes */}
        <Route path="/admin" element={session ? <Layout isAdmin><AdminDashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/settings" element={session ? <Layout isAdmin><AdminSettings /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/challenges" element={session ? <Layout isAdmin><AdminChallenges /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/challenges/new" element={session ? <Layout isAdmin><ChallengeEditor /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/challenges/edit/:id" element={session ? <Layout isAdmin><ChallengeEditor /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/users" element={session ? <Layout isAdmin><AdminUsers /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/users/:id" element={session ? <Layout isAdmin><AdminUserDetail /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/library" element={session ? <Layout isAdmin><AdminLibrary /></Layout> : <Navigate to="/login" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;