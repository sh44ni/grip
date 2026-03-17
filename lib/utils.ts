import {
  format,
  isToday,
  startOfWeek,
  addDays,
  parseISO,
  differenceInDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subDays,
} from 'date-fns';
import type { Task, AddictionLog, Transaction, Addiction } from './types';
import { SCORE_TIERS } from './constants';

// ============================================================
// Date Helpers
// ============================================================

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'MMM d, yyyy');
}

export function formatDay(d: string | Date): string {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return format(date, 'EEE');
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function getWeekDays(weekStart: 0 | 1 = 1): Date[] {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: weekStart });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isTodayDate(d: string | Date): boolean {
  const date = typeof d === 'string' ? parseISO(d) : d;
  return isToday(date);
}

export function isSameDayDate(a: string | Date, b: string | Date): boolean {
  const dateA = typeof a === 'string' ? parseISO(a) : a;
  const dateB = typeof b === 'string' ? parseISO(b) : b;
  return isSameDay(dateA, dateB);
}

export function getDaysInMonth(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

export function getDaysOnGrip(firstUseDate: string | null): number {
  if (!firstUseDate) return 0;
  return differenceInDays(new Date(), parseISO(firstUseDate)) + 1;
}

// ============================================================
// Time Slots
// ============================================================

export function generateTimeSlots(
  wakeTime: string,
  sleepTime: string,
  slotDuration: 30 | 60
): string[] {
  const slots: string[] = [];
  const [wH, wM] = wakeTime.split(':').map(Number);
  const [sH, sM] = sleepTime.split(':').map(Number);
  let currentMinutes = wH * 60 + wM;
  const endMinutes = sH * 60 + sM;

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += slotDuration;
  }

  return slots;
}

// ============================================================
// Addiction Helpers
// ============================================================

export function getAddictionCountToday(addictionId: string, logs: AddictionLog[]): number {
  const today = todayISO();
  return logs.filter(
    (l) => l.addictionId === addictionId && l.timestamp.startsWith(today)
  ).length;
}

export function getAddictionCountForDate(addictionId: string, logs: AddictionLog[], date: string): number {
  return logs.filter(
    (l) => l.addictionId === addictionId && l.timestamp.startsWith(date)
  ).length;
}

export function getCurrentStreak(addictionId: string, logs: AddictionLog[]): number {
  const relevantLogs = logs.filter(l => l.addictionId === addictionId);
  
  // No logs at all = just added, streak is 0
  if (relevantLogs.length === 0) return 0;

  let streak = 0;
  let checkDate = subDays(new Date(), 1);

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const hasLogs = relevantLogs.some(l => l.timestamp.startsWith(dateStr));
    if (hasLogs) break;
    streak++;
    checkDate = subDays(checkDate, 1);
    if (streak > 365) break;
  }

  const todayCount = getAddictionCountToday(addictionId, logs);
  if (todayCount === 0) streak++;

  return streak;
}


export function getBestStreak(addictionId: string, logs: AddictionLog[]): number {
  const relevantLogs = logs
    .filter((l) => l.addictionId === addictionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (relevantLogs.length === 0) return 0;

  const firstLogDate = parseISO(relevantLogs[0].timestamp);
  const today = new Date();
  const totalDays = differenceInDays(today, firstLogDate) + 1;

  let best = 0;
  let current = 0;

  for (let i = 0; i < totalDays; i++) {
    const d = addDays(firstLogDate, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const hasLogs = relevantLogs.some((l) => l.timestamp.startsWith(dateStr));
    if (!hasLogs) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }

  return best;
}

export function getDailyAverage(addictionId: string, logs: AddictionLog[]): number {
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  );
  const counts = last7Days.map(
    (d) => logs.filter((l) => l.addictionId === addictionId && l.timestamp.startsWith(d)).length
  );
  const total = counts.reduce((a, b) => a + b, 0);
  return Math.round((total / 7) * 10) / 10;
}

export function getTrend(addictionId: string, logs: AddictionLog[]): 'up' | 'down' | 'same' {
  const thisWeek = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  );
  const lastWeek = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i + 7), 'yyyy-MM-dd')
  );

  const thisCount = thisWeek.reduce(
    (sum, d) =>
      sum + logs.filter((l) => l.addictionId === addictionId && l.timestamp.startsWith(d)).length,
    0
  );
  const lastCount = lastWeek.reduce(
    (sum, d) =>
      sum + logs.filter((l) => l.addictionId === addictionId && l.timestamp.startsWith(d)).length,
    0
  );

  if (thisCount > lastCount) return 'up';
  if (thisCount < lastCount) return 'down';
  return 'same';
}

export function getTotalBurned(addiction: Addiction, logs: AddictionLog[]): number {
  const count = logs.filter((l) => l.addictionId === addiction.id).length;
  return count * (addiction.costPerUnit || 0);
}

// ============================================================
// Score Calculation — NEW SYSTEM
// ============================================================

export interface ScoreBreakdown {
  score: number;
  hasData: boolean;
  taskPoints: number;
  addictionPoints: number;
  moneyPoints: number;
  cleanDayBonus: number;
}

export function calculateDailyScore(
  tasks: Task[],
  logs: AddictionLog[],
  transactions: Transaction[],
  addictions: Addiction[],
): ScoreBreakdown {
  const today = todayISO();
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedTasks = todayTasks.filter((t) => t.completed);
  const todayLogs = logs.filter((l) => l.timestamp.startsWith(today));
  const todayExpenses = transactions.filter((t) => t.date === today && t.type === 'expense');
  const todayUseful = todayExpenses.filter((t) => t.tag === 'useful');
  const todayWasted = todayExpenses.filter((t) => t.tag === 'wasteful');

  // Check if any data exists
  const hasData = todayTasks.length > 0 || todayLogs.length > 0 || todayExpenses.length > 0;

  if (!hasData) {
    return { score: -1, hasData: false, taskPoints: 0, addictionPoints: 0, moneyPoints: 0, cleanDayBonus: 0 };
  }

  let score = 50; // start neutral

  // Task points: +5 low, +7 medium, +10 high per completion
  let taskPoints = 0;
  for (const task of completedTasks) {
    if (task.priority === 'low') taskPoints += 5;
    else if (task.priority === 'medium') taskPoints += 7;
    else if (task.priority === 'high') taskPoints += 10;
  }

  // Addiction points: -5 per log
  const addictionPoints = -(todayLogs.length * 5);

  // Money points: -3 per wasteful, +1 per useful
  const moneyPoints = -(todayWasted.length * 3) + todayUseful.length;

  // Clean day bonus: +10 for each addiction with 0 logs today
  let cleanDayBonus = 0;
  if (addictions.length > 0) {
    for (const a of addictions) {
      const count = todayLogs.filter((l) => l.addictionId === a.id).length;
      if (count === 0) cleanDayBonus += 10;
    }
  }

  score += taskPoints + addictionPoints + moneyPoints + cleanDayBonus;
  score = Math.max(0, Math.min(100, score));

  return { score, hasData: true, taskPoints, addictionPoints, moneyPoints, cleanDayBonus };
}

export function getScoreTier(score: number) {
  return SCORE_TIERS.find((t) => score >= t.min && score <= t.max) || SCORE_TIERS[SCORE_TIERS.length - 1];
}

// ============================================================
// Weekly Score
// ============================================================

export function getWeeklyAvgScore(
  tasks: Task[], logs: AddictionLog[], transactions: Transaction[], addictions: Addiction[],
  weeksAgo: number = 0
): number {
  const scores: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(new Date(), i + weeksAgo * 7), 'yyyy-MM-dd');
    const dayTasks = tasks.filter((t) => t.date === d);
    const dayLogs = logs.filter((l) => l.timestamp.startsWith(d));
    const dayTx = transactions.filter((t) => t.date === d);
    const hasData = dayTasks.length > 0 || dayLogs.length > 0 || dayTx.length > 0;
    if (hasData) {
      const result = calculateDailyScore(
        tasks.map(t => ({ ...t, date: t.date === d ? todayISO() : 'x' })),
        dayLogs.map(l => ({ ...l, timestamp: todayISO() + l.timestamp.substring(10) })),
        dayTx.map(t => ({ ...t, date: todayISO() })),
        addictions,
      );
      if (result.hasData) scores.push(result.score);
    }
  }
  if (scores.length === 0) return -1;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ============================================================
// Ghost Tasks (unfinished yesterday)
// ============================================================

export function getGhostTasks(tasks: Task[]): Task[] {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  return tasks.filter((t) => t.date === yesterday && !t.completed && !t.skipped);
}

// ============================================================
// Currency
// ============================================================

export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

// ============================================================
// Haptic Feedback
// ============================================================

export function haptic(duration: number = 50): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}
