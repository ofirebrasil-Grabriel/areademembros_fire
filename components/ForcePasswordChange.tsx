import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Button } from './Button';
import { Loader2, Shield, Lock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ForcePasswordChangeProps {
    onSuccess: () => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (newPassword.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            // 1. Update Password
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            // 2. Update Profile Flag
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ must_change_password: false })
                    .eq('id', user.id);

                if (profileError) throw profileError;
            }

            onSuccess();
        } catch (err: any) {
            console.error("Error changing password:", err);
            setError(err.message || "Erro ao alterar senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-fire-secondary/20 border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                        <Lock className="text-yellow-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white font-montserrat">Alteração de Senha Necessária</h2>
                    <p className="text-fire-gray text-sm mt-2">
                        Por segurança, você precisa definir uma nova senha antes de continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-fire-gray">Nova Senha</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-3.5 text-fire-gray" size={18} />
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-fire-orange transition-all"
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-fire-gray">Confirmar Senha</label>
                        <div className="relative mt-1">
                            <Shield className="absolute left-3 top-3.5 text-fire-gray" size={18} />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-fire-orange transition-all"
                                placeholder="Repita a nova senha"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'Definir Nova Senha'}
                    </Button>
                </form>
            </div>
        </div>
    );
};
