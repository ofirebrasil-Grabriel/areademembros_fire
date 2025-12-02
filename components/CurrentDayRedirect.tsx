import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDays, getUserProgress } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import { Flame, AlertTriangle } from 'lucide-react';

export const CurrentDayRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'mock-user-id';

        const [days, completedTasks] = await Promise.all([
          getDays(),
          getUserProgress(userId)
        ]);

        if (days.length === 0) {
          setError("Nenhum desafio encontrado. O sistema pode não ter sido inicializado.");
          return;
        }

        // Logic to find current day:
        // Iterate through days, check if prev day is fully complete.
        // The first day that is NOT fully complete, or the last day if all are complete.

        let targetDayNumber = 1;

        for (let i = 0; i < days.length; i++) {
          const day = days[i];
          const dayTaskIds = day.tasks.map(t => t.id);

          if (dayTaskIds.length === 0) continue;

          const isDayComplete = dayTaskIds.every(id => completedTasks.includes(id));

          if (!isDayComplete) {
            targetDayNumber = day.day_number;
            break;
          } else if (i === days.length - 1) {
            // Last day is also complete
            targetDayNumber = day.day_number;
          }
        }

        navigate(`/day/${targetDayNumber}`);

      } catch (error) {
        console.error("Redirect error", error);
        setError("Erro ao redirecionar para o desafio atual.");
      }
    };

    redirect();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-fire-dark flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <AlertTriangle className="text-yellow-500" size={48} />
          <h2 className="text-xl font-bold">Ops! Algo deu errado.</h2>
          <p className="text-fire-gray">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-fire-secondary hover:bg-fire-secondary/80 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fire-dark flex flex-col items-center justify-center text-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Flame className="text-fire-orange animate-bounce" size={48} />
        <p className="text-fire-gray font-medium">Buscando seu desafio atual...</p>
      </div>
    </div>
  );
};