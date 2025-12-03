import React, { useEffect, useState } from 'react';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../services/dataService';
import { UserProfile } from '../types';
import { Button } from '../components/Button';
import { User, Mail, Calendar, Shield, Save, CheckCircle, Loader2, Camera, Phone } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getCurrentUserProfile();
      if (data) {
        setProfile(data);
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Use current profile avatar url, name from state
    await updateCurrentUserProfile(fullName, profile?.avatar_url, phone);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return;
    const file = event.target.files[0];

    // Size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setAvatarUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to 'challenges_assets' bucket (assuming it's public/available based on schema)
      const { error: uploadError } = await supabase.storage
        .from('challenges_assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenges_assets')
        .getPublicUrl(filePath);

      // Update local state and persist immediately
      setProfile({ ...profile, avatar_url: publicUrl });
      await updateCurrentUserProfile(fullName, publicUrl, phone);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setPasswordLoading(true);

    try {
      // 1. Verify old password (optional but recommended for security)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: oldPassword
      });

      if (signInError) {
        throw new Error("Senha atual incorreta.");
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) throw updateError;

      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Erro ao alterar senha.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-fire-gray">Carregando perfil...</div>;
  }

  if (!profile) return <div className="p-8 text-center text-fire-gray">Erro ao carregar perfil.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white font-montserrat">Minha Conta</h1>

      <div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-fire-orange to-fire-dark border-4 border-fire-secondary flex items-center justify-center shadow-lg shadow-fire-orange/20 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white font-montserrat">
                  {fullName ? fullName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Upload Overlay */}
            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {avatarUploading ? (
                <Loader2 className="animate-spin text-white" />
              ) : (
                <Camera className="text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
            </label>
          </div>

          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold text-white">{fullName || 'Membro FIRE'}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${profile.role === 'admin'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                {profile.role === 'admin' ? 'Admin' : 'Membro'}
              </span>
            </div>
            <p className="text-fire-gray flex items-center justify-center md:justify-start gap-2">
              <Mail size={14} /> {profile.email}
            </p>
            <p className="text-fire-gray/60 text-sm flex items-center justify-center md:justify-start gap-2">
              <Calendar size={14} /> Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 max-w-lg mx-auto md:mx-0">
          <div>
            <label className="block text-sm font-medium text-fire-gray mb-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-fire-gray" size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-fire-secondary/50 focus:outline-none focus:border-fire-orange focus:ring-1 focus:ring-fire-orange transition-all"
                placeholder="Como você gostaria de ser chamado?"
              />
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-fire-gray mb-2">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 text-fire-gray" size={18} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-fire-secondary/50 focus:outline-none focus:border-fire-orange focus:ring-1 focus:ring-fire-orange transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fire-gray mb-2">E-mail (Não editável)</label>
            <div className="relative opacity-60">
              <Mail className="absolute left-3 top-3.5 text-fire-gray" size={18} />
              <input
                type="text"
                value={profile.email}
                disabled
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-fire-gray cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <div className="flex items-center gap-2"><Save size={18} /> Salvar Alterações</div>}
            </Button>
            {saved && (
              <span className="flex items-center gap-2 text-green-400 text-sm animate-in fade-in">
                <CheckCircle size={16} /> Dados atualizados!
              </span>
            )}
          </div>
        </form>
      </div >

      {/* Change Password Section */}
      < div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-8 shadow-xl" >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield className="text-fire-orange" /> Alterar Senha
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg mx-auto md:mx-0">
          <div>
            <label className="block text-sm font-medium text-fire-gray mb-2">Senha Atual</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-fire-orange transition-all"
              placeholder="Digite sua senha atual"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fire-gray mb-2">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-fire-orange transition-all"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fire-gray mb-2">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-fire-orange transition-all"
                placeholder="Repita a nova senha"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={passwordLoading} variant="secondary" className="w-full md:w-auto">
              {passwordLoading ? <Loader2 className="animate-spin" /> : 'Atualizar Senha'}
            </Button>
          </div>

          {passwordMessage && (
            <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {passwordMessage.text}
            </div>
          )}
        </form>
      </div >

      <div className="bg-fire-secondary/10 border border-white/5 rounded-2xl p-6 flex items-start gap-4">
        <Shield className="text-blue-400 shrink-0 mt-1" size={24} />
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Segurança e Privacidade</h3>
          <p className="text-fire-gray text-sm leading-relaxed">
            Seus dados estão seguros. Se precisar alterar sua senha ou solicitar a exclusão da conta,
            entre em contato com o suporte através do e-mail de boas-vindas.
          </p>
        </div>
      </div>
    </div >
  );
};