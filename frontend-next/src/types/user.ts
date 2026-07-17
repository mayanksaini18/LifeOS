export interface UserGoals {
  sleep: number;
  exercise: number;
  mood: number;
  water: number;
}

export interface ReminderTimes {
  mood: string;
  sleep: string;
  water: string;
  exercise: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  xp: number;
  level: number;
  goals: UserGoals;
  reminderTimes: ReminderTimes;
  emailReminders: boolean;
  onboardingComplete: boolean;
  timezone: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
