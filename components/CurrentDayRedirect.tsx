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
        // The current challenge is always the next one after the last one that was 100% completed.
        // If it is already released (which is implied by the sequence), go to it.
        // If not (e.g. end of list), stay on the last released one.

        let lastCompletedDayNumber = 0;

        for (const day of days) {
          const dayTaskIds = day.tasks.map(t => t.id);

          // Treat days with 0 tasks as automatically complete for progression purposes
          const isDayComplete = dayTaskIds.length === 0 || dayTaskIds.every(id => completedTasks.includes(id));

          if (isDayComplete) {
            lastCompletedDayNumber = day.day_number;
          } else {
            // Found the first incomplete day.
            // This is our target, IF it exists (which it does, since we are iterating).
            break;
          }
        }

        // Target is the next day after the last completed one.
        let targetDayNumber = lastCompletedDayNumber + 1;

        // Check if target day exists in our list
        const targetDayExists = days.some(d => d.day_number === targetDayNumber);

        if (!targetDayExists) {
          // If next day doesn't exist (we finished everything), stay on the last completed day.
          targetDayNumber = Math.max(1, lastCompletedDayNumber);
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