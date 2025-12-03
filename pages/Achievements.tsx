import React, { useEffect, useState } from 'react';
import { getDays, getUserProgress } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import { Award, Lock, Star, Flame, Target, Zap, ShieldCheck, Briefcase, TrendingUp, Flag, Crown } from 'lucide-react';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  requirement: string;
}

export const Achievements: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ daysCompleted: 0, tasksCompleted: 0 });

  useEffect(() => {
    const calculateBadges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'mock-user-id';

      const [days, completedTaskIds] = await Promise.all([
        getDays(),
        getUserProgress(userId)
      ]);

      // Calculate Stats
      const tasksCompleted = completedTaskIds.length;
      let daysCompleted = 0;

      days.forEach(day => {
        const dayTaskIds = day.tasks.map(t => t.id);
        if (dayTaskIds.length > 0 && dayTaskIds.every(id => completedTaskIds.includes(id))) {
          daysCompleted++;
        }
      });

      setStats({ daysCompleted, tasksCompleted });

      // Define Badges Logic
      const allBadges: Badge[] = [
        {
          id: 'start',
          title: 'Primeiro Passo',
          description: 'Completou o Dia 1 do desafio.',
          icon: <Star size={32} />,
          unlocked: daysCompleted >= 1,
          requirement: 'Completar Dia 1'
        },
        {
          id: 'focus',
          title: 'Foco Total',
          description: 'Completou 5 tarefas.',
          icon: <Target size={32} />,
          unlocked: tasksCompleted >= 5,
          requirement: '5 Tarefas'
        },
        {
          id: 'executor',
          title: 'Executor',
          description: 'Completou 10 tarefas.',
          icon: <Briefcase size={32} />,
          unlocked: tasksCompleted >= 10,
          requirement: '10 Tarefas'
        },
        {
          id: 'momentum',
          title: 'Pegando Ritmo',
          description: 'Completou 3 dias consecutivos.',
          icon: <Zap size={32} />,
          unlocked: daysCompleted >= 3,
          requirement: 'Completar 3 Dias'
        },
        {
          id: 'halfway',
          title: 'Meio Caminho',
          description: 'Chegou na metade! 7 dias completados.',
          icon: <ShieldCheck size={32} />,
          unlocked: daysCompleted >= 7,
          requirement: 'Completar 7 Dias'
        },
        {
          id: 'imparavel',
          title: 'Imparável',
          description: 'Completou 25 tarefas.',
          icon: <TrendingUp size={32} />,
          unlocked: tasksCompleted >= 25,
          requirement: '25 Tarefas'
        },
        {
          id: 'reta_final',
          title: 'Reta Final',
          description: 'Completou 12 dias do desafio.',
          icon: <Flag size={32} />,
          unlocked: daysCompleted >= 12,
          requirement: 'Completar 12 Dias'
        },
        {
          id: 'lenda_desafio',
          title: 'Lenda do Desafio',
          description: 'Completou 40 tarefas.',
          icon: <Crown size={32} />,
          unlocked: tasksCompleted >= 40,
          requirement: '40 Tarefas'
        },
        {
          id: 'fire_master',
          title: 'Mestre FIRE',
          description: 'Completou todo o desafio de 15 dias.',
          icon: <Flame size={32} />,
          unlocked: daysCompleted >= 15,
          requirement: 'Completar 15 Dias'
        }
      ];

      setBadges(allBadges);
      setLoading(false);
    };

    calculateBadges();
  }, []);

  if (loading) return <div className="text-center text-fire-gray py-12">Carregando conquistas...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white font-montserrat mb-2">Suas Conquistas</h1>
        <p className="text-fire-gray">Desbloqueie medalhas à medida que avança na sua jornada financeira.</p>

        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-fire-orange">{stats.daysCompleted}</div>
            <div className="text-xs text-fire-gray uppercase tracking-widest">Dias Completos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.tasksCompleted}</div>
            <div className="text-xs text-fire-gray uppercase tracking-widest">Tarefas Feitas</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`
              relative p-6 rounded-2xl border transition-all duration-300
              ${badge.unlocked
                ? 'bg-fire-secondary/40 border-fire-orange/30 shadow-[0_0_20px_rgba(255,102,0,0.1)]'
                : 'bg-white/5 border-transparent opacity-60 grayscale'}
            `}
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto
              ${badge.unlocked ? 'bg-gradient-to-br from-fire-orange to-red-600 text-white shadow-lg' : 'bg-white/10 text-white/20'}
            `}>
              {badge.unlocked ? badge.icon : <Lock size={24} />}
            </div>

            <div className="text-center">
              <h3 className={`text-lg font-bold mb-2 ${badge.unlocked ? 'text-white' : 'text-fire-gray'}`}>
                {badge.title}
              </h3>
              <p className="text-sm text-fire-gray mb-4 min-h-[40px]">{badge.description}</p>

              {!badge.unlocked && (
                <div className="text-xs font-bold text-fire-gray/50 uppercase tracking-widest border-t border-white/5 pt-2">
                  Requer: {badge.requirement}
                </div>
              )}

              {badge.unlocked && (
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest border-t border-white/5 pt-2 flex items-center justify-center gap-1">
                  <Award size={12} /> Desbloqueado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
