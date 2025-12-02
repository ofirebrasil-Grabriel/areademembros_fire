import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { FireLogo } from '../components/Logo';
import { Button } from '../components/Button';
import { Mail, Lock, Loader2, ShieldCheck, Info, User } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createMockSession = (role: 'admin' | 'member') => ({
    access_token: `demo-token-${role}`,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: `demo-refresh-${role}`,
    user: {
      id: `${role}-user-id`,
      aud: 'authenticated',
      role: 'authenticated',
      email: `${role}@ofire.com.br`,
      app_metadata: { provider: 'email', role: role },
      user_metadata: { full_name: role === 'admin' ? 'Super Admin' : 'Membro Visitante', role: role },
      created_at: new Date().toISOString(),
    }
  });

  const handleDemoLogin = (role: 'admin' | 'member') => {
    const session = createMockSession(role);
    localStorage.setItem('fire_demo_session', JSON.stringify(session));
    // Force a reload to ensure App.tsx picks up the new "session" and redirects correctly
    window.location.href = role === 'admin' ? '/admin' : '/';
    window.location.reload();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Backdoor for Admin Demo
    if (email === 'admin@ofire.com.br' && password === 'admin') {
      setTimeout(() => {
        handleDemoLogin('admin');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fire-dark p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-fire-orange/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-fire-secondary/30 backdrop-blur-lg border border-white/5 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-8">
          <FireLogo className="scale-125" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-white font-montserrat">
          {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
        </h2>
        <p className="text-center text-fire-gray mb-8 text-sm">
          Acesse sua área exclusiva do Desafio FIRE 15 Dias
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Admin Tip */}
        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
          <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-blue-200">
            <span className="font-bold text-blue-300 block mb-1">Dica para Desenvolvedor:</span>
            Para acessar como Admin, use:<br/>
            E-mail: <code className="bg-black/20 px-1 rounded text-white">admin@ofire.com.br</code><br/>
            Senha: <code className="bg-black/20 px-1 rounded text-white">admin</code>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-fire-gray">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-fire-gray" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-fire-dark border border-fire-secondary rounded-lg py-3 pl-10 pr-4 text-white placeholder-fire-secondary/50 focus:outline-none focus:ring-2 focus:ring-fire-orange focus:border-transparent transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-fire-gray">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-fire-gray" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-fire-dark border border-fire-secondary rounded-lg py-3 pl-10 pr-4 text-white placeholder-fire-secondary/50 focus:outline-none focus:ring-2 focus:ring-fire-orange focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px bg-fire-secondary flex-1"></div>
          <span className="text-xs text-fire-gray uppercase">Ou entre com</span>
          <div className="h-px bg-fire-secondary flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-sm text-fire-gray">
          {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-fire-orange hover:underline font-medium"
          >
            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
          </button>
        </p>

        {/* Demo Access Buttons */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
          <p className="text-[10px] text-fire-gray uppercase tracking-widest font-bold">Acesso de Demonstração</p>
          <div className="flex gap-3">
            <button 
              onClick={() => handleDemoLogin('member')}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs text-fire-gray hover:text-white transition-all border border-white/5 hover:border-green-400/30"
            >
              <User size={14} className="text-green-400" />
              <span>Membro</span>
            </button>
            <button 
              onClick={() => handleDemoLogin('admin')}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs text-fire-gray hover:text-white transition-all border border-white/5 hover:border-fire-orange/30"
            >
              <ShieldCheck size={14} className="text-fire-orange" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};