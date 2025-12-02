import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, TrendingUp, ArrowRight, Loader2, FileText, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { getDashboardStats, getRecentActivity } from '../../services/dataService';
import { DashboardStats } from '../../types';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity()
      ]);
      setStats(statsData);
      setActivity(activityData);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-fire-gray">
        <Loader2 className="animate-spin mr-2" /> Carregando estatísticas...
      </div>
    );
  }

  const cards = [
    { label: 'Membros Totais', value: stats.totalMembers, icon: Users, change: 'Total', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Receita (Estimada)', value: `R$ ${(stats.activeUsers * 297).toLocaleString()}`, icon: DollarSign, change: 'Est.', color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Usuários Ativos', value: stats.activeUsers, icon: Activity, change: `${Math.round((stats.activeUsers/stats.totalMembers || 0)*100)}%`, color: 'text-fire-orange', bg: 'bg-fire-orange/10' },
    { label: 'Conclusão Média', value: `${stats.avgCompletion}%`, icon: TrendingUp, change: 'Geral', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-montserrat">Painel Administrativo</h1>
          <p className="text-fire-gray mt-1">Visão geral do desempenho e saúde do Desafio FIRE.</p>
        </div>
        <div className="text-sm text-fire-gray bg-white/5 px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2">
           <Clock size={14} />
           Atualizado: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, index) => (
          <div key={index} className="bg-fire-secondary/20 border border-white/5 p-6 rounded-xl hover:bg-fire-secondary/30 transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-fire-gray">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 font-montserrat">{stat.value}</h3>
            <p className="text-fire-gray text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Analytics */}
        <div className="lg:col-span-2 bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white font-montserrat flex items-center gap-2">
              <BarChart3 className="text-fire-orange" size={20} /> 
              Engajamento (Demo)
            </h2>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-3 px-2">
            {[35, 45, 30, 60, 55, 75, 50, 65, 80, 70, 90, 85, 95, 80, 70].map((h, i) => (
              <div key={i} className="w-full relative group">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-fire-dark text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {h}%
                </div>
                <div 
                   className="w-full bg-gradient-to-t from-fire-secondary to-fire-orange/50 rounded-t-sm hover:from-fire-orange hover:to-fire-orange transition-all duration-300 cursor-pointer" 
                   style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-fire-gray border-t border-white/5 pt-4">
            <span>Início do Mês</span>
            <span>Meio do Mês</span>
            <span>Hoje</span>
          </div>
        </div>

        {/* Content Overview */}
        <div className="space-y-6">
          <div className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 font-montserrat flex items-center gap-2">
              <FileText size={18} className="text-fire-orange" />
              Conteúdo
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="text-sm text-fire-gray">Módulo de Aulas</div>
                <div className="font-bold text-white">15 Dias</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="text-sm text-fire-gray">Status</div>
                <div className="font-bold text-green-400 text-xs uppercase bg-green-500/10 px-2 py-1 rounded">Ativo</div>
              </div>
              <button 
                onClick={() => navigate('/admin/challenges')}
                className="w-full mt-2 text-xs text-fire-orange hover:text-white transition-colors text-center"
              >
                Gerenciar Conteúdo &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
         <h2 className="text-xl font-bold text-white font-montserrat mb-4">Atividade Recente</h2>
         {activity.length > 0 ? (
           <div className="space-y-4">
              {activity.map((item, i) => (
                <div key={item.id || i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0 hover:bg-white/5 p-2 rounded transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-fire-orange/20 flex items-center justify-center text-fire-orange text-xs font-bold border border-fire-orange/20">
                         {item.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <p className="text-sm text-white">
                           <span className="font-bold">{item.user_name}</span> completou tarefa:
                         </p>
                         <p className="text-xs text-fire-gray">
                           Dia {item.day_number} - {item.task_title}
                         </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-fire-gray flex items-center gap-1 justify-end">
                        <Clock size={12} />
                        {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-[10px] text-fire-gray/60">
                        {new Date(item.completed_at).toLocaleTimeString('pt-BR')}
                      </div>
                   </div>
                </div>
              ))}
           </div>
         ) : (
           <div className="text-center py-8 text-fire-gray">
             <p>Nenhuma atividade recente registrada.</p>
           </div>
         )}
      </div>
    </div>
  );
};