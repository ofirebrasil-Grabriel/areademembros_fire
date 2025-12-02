import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserFullDetails, updateUserStatus, updateUserRole } from '../../services/dataService';
import { UserDetailedProfile, UserStatus, UserRole } from '../../types';
import { Button } from '../../components/Button';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Ban, 
  Shield, 
  Activity, 
  FileText,
  Clock,
  Loader2,
  Flame,
  MessageSquare
} from 'lucide-react';

export const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetailedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'progress' | 'notes'>('progress');

  useEffect(() => {
    if (id) {
      loadUser(id);
    }
  }, [id]);

  const loadUser = async (userId: string) => {
    setLoading(true);
    const data = await getUserFullDetails(userId);
    if (data) {
      setUser(data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    await updateUserStatus(user.id, newStatus);
    setUser({ ...user, status: newStatus });
    setActionLoading(false);
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user || actionLoading) return;
    if (!window.confirm("Alterar nível de acesso?")) return;
    setActionLoading(true);
    await updateUserRole(user.id, newRole);
    setUser({ ...user, role: newRole });
    setActionLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-fire-gray"><Loader2 className="animate-spin inline mr-2"/> Carregando dados do usuário...</div>;
  if (!user) return <div className="p-8 text-center text-white">Usuário não encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/users')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white font-montserrat">Detalhes do Usuário</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
           <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fire-orange to-fire-dark border-4 border-fire-secondary flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()
              )}
           </div>
           
           <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold text-white">{user.full_name || 'Sem Nome'}</h2>
                 <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.status === 'ACTIVE' ? 'Ativo' : user.status}
                 </span>
                 {user.role === 'admin' && (
                    <span className="text-xs font-bold px-2 py-1 rounded uppercase bg-purple-500/20 text-purple-400">Admin</span>
                 )}
              </div>
              <div className="text-fire-gray flex items-center gap-2">
                 <Mail size={16} /> {user.email}
              </div>
              <div className="text-fire-gray flex items-center gap-2 text-sm">
                 <Calendar size={16} /> Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </div>
           </div>

           <div className="flex flex-col gap-2 min-w-[160px]">
              {user.status === 'ACTIVE' ? (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange(UserStatus.BLOCKED)} disabled={actionLoading}>
                   <Ban size={16} className="mr-2" /> Bloquear
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange(UserStatus.ACTIVE)} disabled={actionLoading}>
                   <CheckCircle size={16} className="mr-2" /> Ativar
                </Button>
              )}
              
              <button 
                onClick={() => handleRoleChange(user.role === 'admin' ? UserRole.MEMBER : UserRole.ADMIN)}
                className="text-xs text-fire-gray hover:text-white underline text-center"
              >
                {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
              </button>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 text-fire-orange mb-2">
               <Flame size={24} /> <span className="font-bold">Progresso Geral</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{user.progress.completion_percentage}%</div>
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
               <div className="bg-fire-orange h-full" style={{ width: `${user.progress.completion_percentage}%` }}></div>
            </div>
         </div>
         
         <div className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 text-blue-400 mb-2">
               <CheckCircle size={24} /> <span className="font-bold">Tarefas</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
               {user.progress.completed_tasks} <span className="text-lg text-fire-gray font-normal">/ {user.progress.total_tasks}</span>
            </div>
            <div className="text-xs text-fire-gray">Tarefas concluídas</div>
         </div>

         <div className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 text-purple-400 mb-2">
               <Activity size={24} /> <span className="font-bold">Última Atividade</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
               {user.progress.last_activity ? new Date(user.progress.last_activity).toLocaleDateString('pt-BR') : 'Nunca'}
            </div>
            <div className="text-xs text-fire-gray">
                {user.progress.last_activity ? new Date(user.progress.last_activity).toLocaleTimeString('pt-BR') : '-'}
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div>
         <div className="flex gap-4 border-b border-white/10 mb-6">
            <button 
              onClick={() => setActiveTab('progress')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === 'progress' ? 'border-fire-orange text-white' : 'border-transparent text-fire-gray hover:text-white'}`}
            >
              Histórico de Tarefas
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === 'notes' ? 'border-fire-orange text-white' : 'border-transparent text-fire-gray hover:text-white'}`}
            >
              Anotações & Reflexões
            </button>
         </div>

         {activeTab === 'progress' && (
           <div className="bg-fire-secondary/10 rounded-xl border border-white/5 overflow-hidden">
              {user.completed_tasks_list.length > 0 ? (
                 <table className="w-full text-left">
                    <thead className="bg-black/20 text-xs uppercase text-fire-gray">
                       <tr>
                          <th className="p-4">Dia</th>
                          <th className="p-4">Tarefa</th>
                          <th className="p-4 text-right">Data Conclusão</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {user.completed_tasks_list.map((task, i) => (
                          <tr key={i} className="hover:bg-white/5">
                             <td className="p-4 font-bold text-fire-orange">Dia {task.day_number}</td>
                             <td className="p-4 text-white">{task.task_title}</td>
                             <td className="p-4 text-right text-fire-gray text-sm">
                                {new Date(task.completed_at).toLocaleString('pt-BR')}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              ) : (
                <div className="p-8 text-center text-fire-gray">Nenhuma tarefa completada ainda.</div>
              )}
           </div>
         )}

         {activeTab === 'notes' && (
            <div className="space-y-4">
               {user.notes.length > 0 ? (
                  user.notes.map((note) => (
                     <div key={note.id} className="bg-fire-secondary/20 p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between mb-4">
                           <h3 className="font-bold text-white flex items-center gap-2">
                             <MessageSquare size={18} className="text-blue-400" />
                             {note.day_title}
                           </h3>
                           <span className="text-xs text-fire-gray">{new Date(note.updated_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg text-fire-light italic">
                           "{note.content}"
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="p-8 text-center text-fire-gray border border-dashed border-white/10 rounded-xl">
                    Nenhuma anotação registrada.
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};