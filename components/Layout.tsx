import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FireLogo } from './Logo';
import { ForcePasswordChange } from './ForcePasswordChange';
import { getCurrentUserProfile } from '../services/dataService';
import {
  LogOut,
  LayoutDashboard,
  Settings,
  Users,
  Menu,
  X,
  Flame,
  Award,
  BookOpen,
  UserCircle,
  Library,
  MessageSquare,
  Folder
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const Layout: React.FC<{ children: React.ReactNode; isAdmin?: boolean }> = ({ children, isAdmin = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      const profile = await getCurrentUserProfile();
      if (profile?.must_change_password) {
        setMustChangePassword(true);
      }
    };
    checkPasswordStatus();
  }, [location.pathname]);

  const handleLogout = async () => {
    // Standard supabase logout
    await supabase.auth.signOut();
    navigate('/login');
  };



  const navItems = isAdmin ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BookOpen, label: 'Desafios', path: '/admin/challenges' },
    { icon: Users, label: 'Usuários', path: '/admin/users' },
    { icon: Folder, label: 'Biblioteca', path: '/admin/library' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Painel', path: '/' },
    { icon: Flame, label: 'Desafio Atual', path: '/day/current' },
    { icon: Library, label: 'Biblioteca', path: '/library' },
    { icon: MessageSquare, label: 'Comunidade', path: '/community' },
    { icon: Award, label: 'Conquistas', path: '/achievements' },
    { icon: UserCircle, label: 'Minha Conta', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-fire-dark flex">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-fire-secondary rounded-md text-fire-light"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
        bg-[#011627] border-r border-fire-secondary
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center justify-center border-b border-fire-secondary/50">
            <FireLogo />
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-fire-orange text-white shadow-lg shadow-orange-900/20'
                      : 'text-fire-gray hover:bg-fire-secondary hover:text-white'}
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-fire-secondary/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-fire-gray hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-fire-dark relative">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {
        isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )
      }
      {mustChangePassword && (
        <ForcePasswordChange onSuccess={() => setMustChangePassword(false)} />
      )}
    </div>
  );
};