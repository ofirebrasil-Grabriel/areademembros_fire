export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
}

export interface UserDetailedProfile extends UserProfile {
  progress: {
    total_tasks: number;
    completed_tasks: number;
    completion_percentage: number;
    last_activity: string | null;
  };
  notes: UserNote[];
  completed_tasks_list: {
    day_number: number;
    task_title: string;
    completed_at: string;
  }[];
}

export interface ChallengeDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  morning_message?: string;
  fire_concept?: string;
  expected_result?: string;
  reflection_prompt?: string;
  tasks: ChallengeTask[];
  resources: ChallengeResource[];
  is_locked?: boolean; // Calculated frontend property
  progress?: number; // Calculated frontend property
}

export interface ChallengeTask {
  id: string;
  day_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
}

export type ResourceType = 'pdf' | 'sheet' | 'audio' | 'video' | 'link' | 'community';

export interface ChallengeResource {
  id: string;
  day_id: string;
  title: string;
  url: string;
  type: ResourceType;
}

export interface UserProgress {
  user_id: string;
  task_id: string;
  completed_at: string;
}

export interface UserNote {
  id?: string;
  user_id: string;
  day_id: string;
  content: string;
  updated_at: string;
  day_title?: string; // For display purposes
}

export interface DashboardStats {
  totalMembers: number;
  activeUsers: number;
  blockedUsers: number;
  avgCompletion: number;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    contentLength: number;
    httpStatusCode: number;
  };
  url?: string; // Helper for frontend
}