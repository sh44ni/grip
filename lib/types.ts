// ============================================================
// GRIP — Type Definitions
// ============================================================

// --- Enums & Unions ---

export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'waste';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RepeatType = 'none' | 'daily' | 'weekdays' | 'weekly';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'bills'
  | 'groceries'
  | 'entertainment'
  | 'addiction'
  | 'shopping'
  | 'health'
  | 'wasted'
  | 'other';

export type IncomeCategory = 'salary' | 'freelance' | 'client' | 'other';

export type TransactionType = 'income' | 'expense';
export type TransactionTag = 'useful' | 'wasteful' | 'necessary';
export type DayRating = 'good' | 'mid' | 'bad';

// --- Data Models ---

export interface Task {
  id: string;
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: TaskCategory;
  priority: TaskPriority;
  repeat: RepeatType;
  notes: string;
  completed: boolean;
  skipped: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Addiction {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  dailyGoal: number;
  unit: string; // cigarettes, minutes, times, etc.
  costPerUnit: number; // e.g. PKR 50 per cigarette (for shame counter)
  createdAt: string;
  updatedAt: string;
}

export interface AddictionLog {
  id: string;
  addictionId: string;
  timestamp: string; // ISO datetime
  note: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  tag: TransactionTag;
  note: string;
  date: string; // ISO date YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface DayTemplate {
  id: string;
  name: string;
  tasks: Omit<Task, 'id' | 'date' | 'completed' | 'skipped' | 'createdAt' | 'updatedAt'>[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  addictionId: string;
  type: 'clean_days';
  days: number; // 1, 3, 7, 14, 30, 60, 90
  achievedAt: string;
  seen: boolean;
}

export interface DailyReview {
  id: string;
  date: string; // YYYY-MM-DD
  rating: DayRating;
  biggestWinTaskId: string | null;
  tomorrowFocus: string;
  finalScore: number;
  createdAt: string;
}

export interface Settings {
  name: string;
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
  slotDuration: 30 | 60; // minutes
  weekStartDay: 0 | 1; // 0=Sunday, 1=Monday
  currency: string;
  monthlyIncomeTarget: number;
  savingsGoal: number;
  theme: 'dark' | 'light';
  // Graveyard equivalents
  avgMealCost: number;
  monthlySubscriptionCost: number;
  dailyFuelCost: number;
  // Weekly report
  weeklyReportDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // day of week (0=Sun)
  // Data
  lastExportDate: string | null;
  firstUseDate: string | null;
}

// --- Storage Keys ---
export const STORAGE_KEYS = {
  TASKS: 'grip_tasks',
  ADDICTIONS: 'grip_addictions',
  ADDICTION_LOGS: 'grip_addiction_logs',
  TRANSACTIONS: 'grip_transactions',
  TEMPLATES: 'grip_templates',
  SETTINGS: 'grip_settings',
  MILESTONES: 'grip_milestones',
  REVIEWS: 'grip_reviews',
} as const;
