import type { Settings, TaskCategory, ExpenseCategory, IncomeCategory, TransactionTag } from './types';

// ============================================================
// Colors
// ============================================================

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work: '#3B82F6',
  personal: '#8B5CF6',
  health: '#10B981',
  learning: '#F59E0B',
  waste: '#EF4444',
};

export const TAG_COLORS: Record<TransactionTag, string> = {
  useful: '#10B981',
  wasteful: '#EF4444',
  necessary: '#F59E0B',
};

export const ACCENT = '#14B8A6';
export const ACCENT_DARK = '#0D9488';
export const DANGER = '#EF4444';
export const WARNING = '#F59E0B';
export const SUCCESS = '#10B981';

// ============================================================
// Categories
// ============================================================

export const TASK_CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: CATEGORY_COLORS.work },
  { value: 'personal', label: 'Personal', color: CATEGORY_COLORS.personal },
  { value: 'health', label: 'Health', color: CATEGORY_COLORS.health },
  { value: 'learning', label: 'Learning', color: CATEGORY_COLORS.learning },
  { value: 'waste', label: 'Waste', color: CATEGORY_COLORS.waste },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'food', label: 'Food', icon: 'UtensilsCrossed' },
  { value: 'transport', label: 'Transport', icon: 'Car' },
  { value: 'bills', label: 'Bills', icon: 'Receipt' },
  { value: 'groceries', label: 'Groceries', icon: 'ShoppingCart' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Tv' },
  { value: 'addiction', label: 'Addiction', icon: 'Flame' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { value: 'health', label: 'Health', icon: 'Heart' },
  { value: 'wasted', label: 'Wasted', icon: 'Trash2' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; icon: string }[] = [
  { value: 'salary', label: 'Salary', icon: 'Briefcase' },
  { value: 'freelance', label: 'Freelance', icon: 'Laptop' },
  { value: 'client', label: 'Client Payment', icon: 'Handshake' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

// ============================================================
// Addiction Icon Options
// ============================================================

export const ADDICTION_ICONS = [
  'Cigarette', 'Wine', 'Coffee', 'Smartphone', 'Tv',
  'Pizza', 'Cookie', 'Candy', 'IceCream', 'Beer',
  'Gamepad2', 'ScrollText', 'Moon', 'ShoppingBag',
  'CreditCard', 'Flame', 'Zap', 'Eye', 'Clock',
  'AlertTriangle',
];

// ============================================================
// Milestone Thresholds
// ============================================================

export const MILESTONE_DAYS = [1, 3, 7, 14, 30, 60, 90];

// ============================================================
// Default Settings
// ============================================================

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  wakeTime: '07:00',
  sleepTime: '23:00',
  slotDuration: 60,
  weekStartDay: 1,
  currency: 'PKR',
  monthlyIncomeTarget: 0,
  savingsGoal: 0,
  theme: 'dark',
  avgMealCost: 500,
  monthlySubscriptionCost: 1200,
  dailyFuelCost: 800,
  weeklyReportDay: 0, // Sunday
  lastExportDate: null,
  firstUseDate: null,
};

// ============================================================
// Score Tiers
// ============================================================

export const SCORE_TIERS = [
  { min: 86, max: 100, label: 'Beast mode', color: '#22C55E', glow: true },
  { min: 71, max: 85, label: 'Strong day', color: '#10B981', glow: false },
  { min: 51, max: 70, label: 'Solid', color: '#737373', glow: false },
  { min: 31, max: 50, label: 'Surviving', color: '#F59E0B', glow: false },
  { min: 0, max: 30, label: 'Rough day', color: '#EF4444', glow: false },
];

// ============================================================
// War Framing Messages
// ============================================================

export const WAR_MESSAGES = {
  slip: 'You lost a battle. The war continues.',
  cleanDay: 'You held the line today.',
  streak7: '7 days unbroken. You\'re getting stronger.',
  streak14: '14 days. The enemy is weakening.',
  streak30: '30 days. A month of war, won.',
  streak60: '60 days. You\'re forged in fire now.',
  streak90: '90 days. You\'ve become the weapon.',
  relapse: (days: number) => `You fell after ${days} days. But you know how to fight. Start again.`,
  flameDied: 'The flame died. Light it again.',
  streakPrefix: (days: number) => `Day ${days} of the fight`,
};

// ============================================================
// Navigation
// ============================================================

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/planner', label: 'Planner', icon: 'CalendarDays' },
  { href: '/tracker', label: 'Tracker', icon: 'Target' },
  { href: '/money', label: 'Money', icon: 'Wallet' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const;
