import React, { useEffect, useState } from 'react';
import { getUsers, updateUserStatus, updateUserRole } from '../../services/dataService';
import { UserProfile, UserRole, UserStatus } from '../../types';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Shield, 
  ShieldAlert, 
  User, 
  Ban, 
  CheckCircle, 
  Clock,
  Loader2,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [page, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, count } = await getUsers(page, limit, searchTerm);
    setUsers(data);
    setTotalCount(count);
    setLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); 
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (actionLoading) return;
    setActionLoading(userId);
    await updateUserStatus(userId, newStatus);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    setActionLoading(null);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (actionLoading) return;
    if (!window.confirm(`Tem certeza que deseja alterar o nível de acesso deste usuário para ${newRole}?`)) return;
    
    setActionLoading(userId);
    await updateUserRole(userId, newRole);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setActionLoading(null);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-montserrat">Gerenciar Usuários</h1>
          <p className="text-fire-gray text-sm mt-1">
            Controle de acesso, status e permissões dos membros.
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fire-gray" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 bg-fire-secondary/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-fire-orange w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-fire-secondary/20 border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-fire-gray text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-4 font-medium">Usuário</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Função</th>
                <th className="p-4 font-medium">Data Cadastro</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-fire-gray">
                    <Loader2 className="animate-spin inline-block mr-2" /> Carregando...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fire-secondary to-fire-dark border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.full_name || 'Usuário Sem Nome'}</div>
                          <div className="text-xs text-fire-gray flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                        ${user.status === UserStatus.ACTIVE ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          user.status === UserStatus.PENDING ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-red-500/10 text-red-400 border-red-500/20'}
                      `}>
                        {user.status === UserStatus.ACTIVE ? <CheckCircle size={12} /> : 
                         user.status === UserStatus.PENDING ? <Clock size={12} /> : 
                         <Ban size={12} />}
                        {user.status === UserStatus.ACTIVE ? 'Ativo' : 
                         user.status === UserStatus.PENDING ? 'Pendente' : 
                         'Bloqueado'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                        ${user.role === UserRole.ADMIN ? 'text-purple-300 bg-purple-500/10' : 'text-blue-300 bg-blue-500/10'}
                      `}>
                        {user.role === UserRole.ADMIN ? <ShieldAlert size={12} /> : <User size={12} />}
                        {user.role === UserRole.ADMIN ? 'Admin' : 'Membro'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-fire-gray">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => navigate(`/admin/users/${user.id}`)}
                           className="p-2 rounded-lg text-fire-gray hover:text-white hover:bg-white/10 transition-colors"
                           title="Ver Detalhes"
                         >
                           <Eye size={18} />
                         </button>

                         <button 
                           onClick={() => handleRoleChange(user.id, user.role === UserRole.ADMIN ? UserRole.MEMBER : UserRole.ADMIN)}
                           disabled={actionLoading === user.id}
                           className="p-2 rounded-lg text-fire-gray hover:text-white hover:bg-white/10 transition-colors"
                           title={user.role === UserRole.ADMIN ? "Rebaixar para Membro" : "Promover a Admin"}
                         >
                           <Shield size={18} />
                         </button>
  
                         {user.status === UserStatus.ACTIVE ? (
                           <button 
                             onClick={() => handleStatusChange(user.id, UserStatus.BLOCKED)}
                             disabled={actionLoading === user.id}
                             className="p-2 rounded-lg text-green-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                             title="Bloquear Acesso"
                           >
                             {actionLoading === user.id ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                           </button>
                         ) : (
                           <button 
                             onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)}
                             disabled={actionLoading === user.id}
                             className="p-2 rounded-lg text-red-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                             title="Ativar Acesso"
                           >
                             {actionLoading === user.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                           </button>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-fire-gray">
                    Nenhum usuário encontrado{searchTerm ? ` com "${searchTerm}"` : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/10">
          <div className="text-sm text-fire-gray">
            Mostrando <span className="text-white font-medium">{Math.min((page - 1) * limit + 1, totalCount)}</span> a <span className="text-white font-medium">{Math.min(page * limit, totalCount)}</span> de <span className="text-white font-medium">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1 || loading}
              className="px-3"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-fire-gray px-2">
              Página {page} de {totalPages || 1}
            </span>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page >= totalPages || loading}
              className="px-3"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};