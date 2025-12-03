import { ChallengeDay, ChallengeTask, UserProfile, UserRole, UserStatus, UserNote, DashboardStats, ChallengeResource, StorageFile, UserDetailedProfile } from '../types';
import { supabase } from './supabaseClient';

// --- MOCK DATA (Used for Seeding) ---

const MOCK_DAYS: Partial<ChallengeDay>[] = Array.from({ length: 15 }, (_, i) => ({
  day_number: i + 1,
  title: `Dia ${i + 1}: ${[
    "Diagnóstico Financeiro", "Mentalidade FIRE", "Corte de Gastos", "Renda Extra", "Fundo de Emergência",
    "Dívidas Nunca Mais", "Investimentos Básicos", "Renda Fixa", "Ações e FIIs", "Diversificação",
    "Planejamento Tributário", "Aposentadoria INSS", "Seguros e Proteção", "Plano de Liberdade", "O Grande Salto"
  ][i]}`,
  description: "Um passo fundamental para sua liberdade financeira.",
  morning_message: "Bom dia! Hoje é o dia de transformar sua visão sobre dinheiro. Respire fundo e foque no objetivo.",
  fire_concept: "FIRE (Financial Independence, Retire Early) não é apenas sobre parar de trabalhar, é sobre ter a opção de fazer o que ama.",
  expected_result: "Ao final do dia, você terá um mapa claro da sua situação atual.",
  reflection_prompt: "O que te impede de atingir a liberdade hoje?",
  tasks: [
    { id: `t-${i}-1`, day_id: `day-${i + 1}`, title: "Ler o material de apoio", is_completed: false, order_index: 0 },
    { id: `t-${i}-2`, day_id: `day-${i + 1}`, title: "Preencher a planilha de controle", is_completed: false, order_index: 1 },
    { id: `t-${i}-3`, day_id: `day-${i + 1}`, title: "Compartilhar insight na comunidade", is_completed: false, order_index: 2 },
  ],
  resources: [
    { id: `r-${i}-1`, day_id: `day-${i + 1}`, title: "Guia PDF", url: "#", type: "pdf" },
    { id: `r-${i}-2`, day_id: `day-${i + 1}`, title: "Planilha FIRE", url: "#", type: "sheet" },
  ]
}));

// --- SEED DATABASE SERVICE ---

export const seedDatabase = async () => {
  try {
    // 1. Check if data exists
    const { count } = await supabase.from('challenges').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      return { success: false, message: 'O banco de dados já possui dados. Limpe-o antes de inicializar.' };
    }

    console.log("Starting seed process...");

    // 2. Insert Days
    for (const day of MOCK_DAYS) {
      // Insert Challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          morning_message: day.morning_message,
          fire_concept: day.fire_concept,
          expected_result: day.expected_result,
          reflection_prompt: day.reflection_prompt
        })
        .select()
        .single();

      if (challengeError || !challengeData) {
        console.error(`Error inserting day ${day.day_number}:`, challengeError);
        continue;
      }

      // Insert Tasks
      if (day.tasks && day.tasks.length > 0) {
        const tasksPayload = day.tasks.map(t => ({
          day_id: challengeData.id,
          title: t.title,
          description: t.description,
          order_index: t.order_index
        }));
        await supabase.from('challenge_tasks').insert(tasksPayload);
      }

      // Insert Resources
      if (day.resources && day.resources.length > 0) {
        const resourcesPayload = day.resources.map(r => ({
          day_id: challengeData.id,
          title: r.title,
          url: r.url,
          type: r.type
        }));
        await supabase.from('challenge_resources').insert(resourcesPayload);
      }
    }

    return { success: true, message: 'Banco de dados inicializado com sucesso!' };
  } catch (error: any) {
    console.error("Seed error:", error);
    return { success: false, message: error.message };
  }
};

// --- CHALLENGE SERVICES ---

export const getDays = async (): Promise<ChallengeDay[]> => {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      tasks:challenge_tasks(*),
      resources:challenge_resources(*)
    `)
    .order('day_number');

  if (error) {
    console.error("Error fetching days:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Transform logic
  const sortedData = data.map((day: any) => ({
    ...day,
    tasks: day.tasks ? day.tasks.sort((a: any, b: any) => a.order_index - b.order_index) : [],
    resources: day.resources || []
  }));

  return sortedData as ChallengeDay[];
};

export const getDayByNumber = async (dayNumber: number): Promise<ChallengeDay | null> => {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      tasks:challenge_tasks(*),
      resources:challenge_resources(*)
    `)
    .eq('day_number', dayNumber)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    tasks: data.tasks ? data.tasks.sort((a: any, b: any) => a.order_index - b.order_index) : [],
    resources: data.resources || []
  } as ChallengeDay;
};

// --- LIBRARY SERVICES ---

export interface LibraryResource extends ChallengeResource {
  day_number: number;
  day_title: string;
}

export const getAllResources = async (): Promise<LibraryResource[]> => {
  const { data, error } = await supabase
    .from('challenge_resources')
    .select(`
      *,
      challenges (day_number, title)
    `)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((item: any) => ({
    ...item,
    day_number: item.challenges?.day_number,
    day_title: item.challenges?.title
  }));
};

// --- EVENTS SERVICES (Mock) ---

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  type: 'live' | 'webinar' | 'qa';
  link?: string;
}

export const getUpcomingEvents = async (): Promise<CommunityEvent[]> => {
  // In a real app, this would come from a 'events' table
  return [
    {
      id: '1',
      title: 'Mentoria em Grupo: Dúvidas do Dia 1-5',
      date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      type: 'qa',
      link: 'https://zoom.us/j/example'
    },
    {
      id: '2',
      title: 'Live: Como investir com pouco dinheiro',
      date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
      type: 'live',
      link: 'https://youtube.com/live/example'
    }
  ];
};

// --- USER PROGRESS SERVICES ---

export const getUserProgress = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('task_id')
    .eq('user_id', userId);

  if (error) return [];
  return data.map(p => p.task_id);
};

export const toggleTaskCompletion = async (userId: string, taskId: string, isCompleted: boolean) => {
  if (isCompleted) {
    await supabase.from('user_progress').insert({ user_id: userId, task_id: taskId });
  } else {
    await supabase.from('user_progress').delete().match({ user_id: userId, task_id: taskId });
  }
};

// --- NOTES SERVICES ---

export const getUserNote = async (userId: string, dayId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('user_notes')
    .select('content')
    .eq('user_id', userId)
    .eq('day_id', dayId)
    .single();

  if (error || !data) {
    return '';
  }
  return data.content;
};

export const saveUserNote = async (userId: string, dayId: string, content: string) => {
  await supabase
    .from('user_notes')
    .upsert({
      user_id: userId,
      day_id: dayId,
      content,
      updated_at: new Date().toISOString()
    });
};

// --- USER MANAGEMENT SERVICES ---

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // If profile missing, return basic auth info mocked as profile
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      role: (user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin') ? UserRole.ADMIN : UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      created_at: user.created_at,
      avatar_url: user.user_metadata?.avatar_url
    } as UserProfile;
  }

  return data as UserProfile;
};

export const updateCurrentUserProfile = async (fullName: string, avatarUrl?: string, phone?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updates: any = { full_name: fullName };
  if (avatarUrl) updates.avatar_url = avatarUrl;
  if (phone) updates.phone = phone;

  await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  // Also update auth metadata to keep sync
  const metadataUpdates: any = { full_name: fullName };
  if (avatarUrl) metadataUpdates.avatar_url = avatarUrl;
  if (phone) metadataUpdates.phone = phone;

  await supabase.auth.updateUser({
    data: metadataUpdates
  });
};

export const getUsers = async (
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<{ data: UserProfile[], count: number }> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    console.error("Error fetching users:", error);
    return { data: [], count: 0 };
  }

  return { data: data as UserProfile[], count: count || 0 };
};

export const getUserFullDetails = async (userId: string): Promise<UserDetailedProfile | null> => {
  // 1. Get Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return null;

  // 2. Get Progress (Completed Tasks)
  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select(`
      completed_at,
      task:challenge_tasks (
        title,
        challenges (day_number)
      )
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  // 3. Get Notes
  const { data: notes, error: notesError } = await supabase
    .from('user_notes')
    .select(`
      *,
      challenges (title)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  // 4. Get Totals
  const { count: totalTasks } = await supabase.from('challenge_tasks').select('*', { count: 'exact', head: true });

  const completedCount = progress?.length || 0;
  const percentage = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Transform progress data for UI
  const completedTasksList = progress?.map((p: any) => ({
    day_number: p.task?.challenges?.day_number || 0,
    task_title: p.task?.title || 'Tarefa Desconhecida',
    completed_at: p.completed_at
  })) || [];

  const notesList = notes?.map((n: any) => ({
    ...n,
    day_title: n.challenges?.title
  })) || [];

  return {
    ...profile,
    progress: {
      total_tasks: totalTasks || 0,
      completed_tasks: completedCount,
      completion_percentage: percentage,
      last_activity: completedTasksList[0]?.completed_at || null
    },
    completed_tasks_list: completedTasksList,
    notes: notesList
  };
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId);
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
};

export const deleteUser = async (userId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  const { error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'deleteUser', userId }
  });

  if (error) throw error;
  if (error) throw error;
};

export const createAdminUser = async (userData: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'createUser', ...userData }
  });

  if (error) throw error;
  return data;
};

export const updateAdminUser = async (userData: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action: 'updateUser', ...userData }
  });

  if (error) throw error;
  return data;
};

// --- STORAGE SERVICES ---

export const getStorageFiles = async (): Promise<StorageFile[]> => {
  const { data, error } = await supabase
    .storage
    .from('challenges_assets')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error("Storage list error:", error);
    return [];
  }

  // Files at root
  const rootFiles = data.filter(d => d.id !== null).map(d => ({
    ...d,
    url: supabase.storage.from('challenges_assets').getPublicUrl(d.name).data.publicUrl
  }));

  // Simple implementation: We only list root for now, or assume flat structure for "Library" view
  // If folders are used (like day-01/), we'd need recursive listing or folder navigation UI.
  // For this version, let's list root.

  return rootFiles as unknown as StorageFile[];
};

export const deleteStorageFile = async (fileName: string) => {
  const { error } = await supabase
    .storage
    .from('challenges_assets')
    .remove([fileName]);

  if (error) throw error;
};


// --- ADMIN STATS & ACTIVITY ---

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // 1. Fetch Users Stats
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('status');

    if (profilesError) throw profilesError;

    const totalMembers = profiles?.length || 0;
    const activeUsers = profiles?.filter(p => p.status === 'ACTIVE').length || 0;
    const blockedUsers = profiles?.filter(p => p.status === 'BLOCKED').length || 0;

    // 2. Fetch Completion Stats
    const { count: totalTasksCount } = await supabase.from('challenge_tasks').select('*', { count: 'exact', head: true });
    const { count: completedTasksCount } = await supabase.from('user_progress').select('*', { count: 'exact', head: true });

    let avgCompletion = 0;
    if (totalMembers > 0 && totalTasksCount && totalTasksCount > 0) {
      avgCompletion = Math.round(((completedTasksCount || 0) / (totalMembers * totalTasksCount)) * 100);
    }

    return {
      totalMembers,
      activeUsers,
      blockedUsers,
      avgCompletion
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalMembers: 0,
      activeUsers: 0,
      blockedUsers: 0,
      avgCompletion: 0
    };
  }
};

export const getRecentActivity = async () => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        id,
        completed_at,
        profiles:user_id (full_name, email),
        challenge_tasks!inner (
          title,
          challenges!inner (day_number)
        )
      `)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      user_name: item.profiles?.full_name || item.profiles?.email || 'Usuário Desconhecido',
      task_title: item.challenge_tasks?.title,
      day_number: item.challenge_tasks?.challenges?.day_number,
      completed_at: item.completed_at
    }));
  } catch (error) {
    console.error("Error getting activity:", error);
    return [];
  }
};