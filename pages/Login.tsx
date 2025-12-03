import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Button } from '../components/Button';
import { Mail, Lock, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Check if user is BLOCKED
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single();

        if (profile?.status === 'BLOCKED') {
          // Sign out immediately
          await supabase.auth.signOut();
          throw new Error('Seu acesso foi bloqueado. Entre em contato com o suporte.');
        }
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { email: forgotEmail }
      });

      if (error) throw error;

      setForgotMessage({ type: 'success', text: 'Se o e-mail existir, uma nova senha foi enviada.' });
      setForgotEmail('');
    } catch (err: any) {
      setForgotMessage({ type: 'error', text: 'Erro ao solicitar recuperação.' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fire-dark p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-fire-orange/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-fire-secondary/30 backdrop-blur-lg border border-white/5 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="FIRE Logo" className="h-16 w-auto" width="88" height="64" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-white font-montserrat">
          Bem-vindo de volta
        </h2>
        <p className="text-center text-fire-gray mb-8 text-sm">
          Acesse sua área exclusiva do Desafio FIRE 15 Dias
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-fire-orange hover:text-fire-orange/80 transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
          </Button>
        </form>






      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fire-secondary/20 border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-fire-gray hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-4 font-montserrat">Recuperar Senha</h3>
            <p className="text-fire-gray text-sm mb-6">
              Digite seu e-mail abaixo. Se ele estiver cadastrado, enviaremos uma nova senha temporária para você.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-fire-gray">E-mail cadastrado</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3.5 text-fire-gray" size={18} />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-fire-orange transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <Button type="submit" fullWidth disabled={forgotLoading}>
                {forgotLoading ? <Loader2 className="animate-spin" /> : 'Enviar Nova Senha'}
              </Button>

              {forgotMessage && (
                <div className={`p-3 rounded-lg text-sm text-center ${forgotMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {forgotMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};