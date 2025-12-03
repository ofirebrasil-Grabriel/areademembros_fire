import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Button } from '../components/Button';
import { Lock, Loader2, Shield, CheckCircle } from 'lucide-react';
import { getCurrentUserProfile } from '../services/dataService';

export const ChangePassword: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            // 1. Update Password
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            // 2. Update Profile flag
            const user = await supabase.auth.getUser();
            if (user.data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ must_change_password: false })
                    .eq('id', user.data.user.id);

                if (profileError) throw profileError;
            }

            setSuccess(true);
            setTimeout(() => {
                // Force reload to update App.tsx state (must_change_password)
                window.location.href = '/';
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-fire-dark p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-fire-orange/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-fire-secondary/30 backdrop-blur-lg border border-white/5 p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-fire-orange/20 rounded-full flex items-center justify-center">
                        <Shield className="text-fire-orange" size={32} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2 text-white font-montserrat">
                    Defina sua Senha
                </h2>
                <p className="text-center text-fire-gray mb-8 text-sm">
                    Por segurança, você precisa definir uma nova senha para continuar acessando a plataforma.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-white mb-2">Senha Atualizada!</h3>
                        <p className="text-fire-gray">Redirecionando para o painel...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-fire-gray">Nova Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-fire-gray" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-fire-dark border border-fire-secondary rounded-lg py-3 pl-10 pr-4 text-white placeholder-fire-secondary/50 focus:outline-none focus:ring-2 focus:ring-fire-orange focus:border-transparent transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-fire-gray">Confirmar Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-fire-gray" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-fire-dark border border-fire-secondary rounded-lg py-3 pl-10 pr-4 text-white placeholder-fire-secondary/50 focus:outline-none focus:ring-2 focus:ring-fire-orange focus:border-transparent transition-all"
                                    placeholder="Repita a nova senha"
                                />
                            </div>
                        </div>

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Atualizar e Entrar'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
