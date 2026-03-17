'use client';

import React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle, SkipForward, Wallet, Moon, Calendar, Swords } from 'lucide-react';
import * as Icons from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap = Icons as unknown as Record<string, React.ComponentType<any>>;
import { getSettings, getTasks, getAddictions, getAddictionLogs, getTransactions, getReviews, createTask, updateTask, createAddictionLog, createTransaction } from '@/lib/storage';
import { getGreeting, todayISO, formatTime, calculateDailyScore, getScoreTier, getAddictionCountToday, getCurrentStreak, formatCurrency, haptic, getDaysOnGrip, getGhostTasks } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { FAB } from '@/components/layout/FAB';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { GripLogo } from '@/components/ui/GripLogo';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { NightReview } from '@/components/dashboard/NightReview';
import { WeeklyReport } from '@/components/dashboard/WeeklyReport';
import { CATEGORY_COLORS, TASK_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, WAR_MESSAGES } from '@/lib/constants';
import { useUser } from '@/lib/UserContext';

import type { Task, Addiction, AddictionLog, Transaction, Settings, TaskCategory, TaskPriority, TransactionType, TransactionTag, ExpenseCategory, IncomeCategory, DailyReview } from '@/lib/types';

export default function DashboardPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [logs, setLogs] = useState<AddictionLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [nightReviewOpen, setNightReviewOpen] = useState(false);
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false);
  const { user } = useUser();
  const userId = user?.id || 'zeeshan';
  const { showToast } = useToast();

  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [addictionSheetOpen, setAddictionSheetOpen] = useState(false);

  const [taskName, setTaskName] = useState('');
  const [taskStart, setTaskStart] = useState('09:00');
  const [taskEnd, setTaskEnd] = useState('10:00');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('work');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseType, setExpenseType] = useState<TransactionType>('expense');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | IncomeCategory>('food');
  const [expenseTag, setExpenseTag] = useState<TransactionTag>('necessary');
  const [expenseNote, setExpenseNote] = useState('');

  const loadData = useCallback(async () => {
    const [s, t, a, l, tx, r] = await Promise.all([
      getSettings(), getTasks(userId), getAddictions(userId), getAddictionLogs(), getTransactions(), getReviews(userId),
    ]);
    setSettings(s); setTasks(t); setAddictions(a); setLogs(l); setTransactions(tx); setReviews(r);
    setLoaded(true);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const today = todayISO();
  const todayTasks = tasks.filter(t => t.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const ghostTasks = loaded ? getGhostTasks(tasks) : [];
  const todayExpenses = transactions.filter(t => t.date === today && t.type === 'expense');
  const todayWasted = todayExpenses.filter(t => t.tag === 'wasteful').reduce((s, t) => s + t.amount, 0);
  const todaySpent = todayExpenses.reduce((s, t) => s + t.amount, 0);

  const scoreResult = (settings && addictions)
    ? calculateDailyScore(tasks, logs, transactions, addictions)
    : { score: -1, hasData: false, taskPoints: 0, addictionPoints: 0, moneyPoints: 0, cleanDayBonus: 0 };
  const score = scoreResult.hasData ? scoreResult.score : -1;
  const scoreTier = getScoreTier(Math.max(0, score));
  const currency = settings?.currency || 'PKR';
  const daysOnGrip = settings ? getDaysOnGrip(settings.firstUseDate) : 0;

  const yesterdayReview = reviews.find(r => {
    const yd = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');
    return r.date === yd;
  });
  const todayFocus = yesterdayReview?.tomorrowFocus || '';

  const todayReviewDone = reviews.some(r => r.date === today);
  const isReportDay = new Date().getDay() === (settings?.weeklyReportDay ?? 0);
  const isDayEmpty = todayTasks.length === 0 && addictions.length === 0 && todayExpenses.length === 0 && !scoreResult.hasData;

  const toggleTask = async (id: string, action: 'complete' | 'skip') => {
    haptic();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updates = action === 'complete' ? { completed: !task.completed } : { skipped: !task.skipped };
    await updateTask({ id, ...updates });
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    showToast(action === 'complete' ? 'Task completed' : 'Task skipped');
  };

  const rescheduleGhost = async (ghost: Task) => {
    haptic();
    const newTask = await createTask({ userId, name: ghost.name, date: today, startTime: ghost.startTime, endTime: ghost.endTime, category: ghost.category, priority: ghost.priority, repeat: 'none', notes: ghost.notes, completed: false, skipped: false });
    setTasks([...tasks, newTask]);
    showToast('Rescheduled to today');
  };

  const incrementAddiction = async (addictionId: string) => {
    haptic(30);
    const prevStreak = getCurrentStreak(addictionId, logs);
    const newLog = await createAddictionLog({ addictionId, timestamp: new Date().toISOString(), note: '' });
    setLogs([...logs, newLog]);
    if (prevStreak > 0) showToast(WAR_MESSAGES.relapse(prevStreak), 'warning');
    else showToast(WAR_MESSAGES.slip, 'warning');
  };

  const addTask = async () => {
    if (!taskName.trim()) return;
    const newTask = await createTask({ userId, name: taskName, date: today, startTime: taskStart, endTime: taskEnd, category: taskCategory, priority: taskPriority, repeat: 'none', notes: '', completed: false, skipped: false });
    setTasks([...tasks, newTask]);
    setTaskSheetOpen(false);
    setTaskName('');
    showToast('Task added');
  };

  const addExpense = async () => {
    if (!expenseAmount) return;
    const newTx = await createTransaction({ madeBy: userId, amount: Number(expenseAmount), type: expenseType, category: expenseCategory, tag: expenseTag, note: expenseNote, date: today });
    setTransactions([...transactions, newTx]);
    setExpenseSheetOpen(false);
    setExpenseAmount('');
    setExpenseNote('');
    if (expenseType === 'expense' && expenseTag === 'wasteful') showToast(`${currency} ${Number(expenseAmount).toLocaleString()} wasted`, 'error');
    else showToast(expenseType === 'income' ? 'Income added' : 'Expense logged');
  };

  if (!loaded || !settings) {
    return <div className="p-5 space-y-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>;
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <GripLogo compact />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{format(new Date(), 'EEEE')}</p>
            <p className="text-xs text-muted">{format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
        </div>

        <p className="text-lg font-semibold text-foreground">
          {getGreeting()}{settings.name ? `, ${settings.name}` : ''}
        </p>

        {todayFocus && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
            <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Today&apos;s Focus</p>
            <p className="text-sm text-foreground font-medium">{todayFocus}</p>
          </div>
        )}

        {isDayEmpty && (
          <div className="flex flex-col items-center py-12">
            <motion.div className="w-24 h-24 rounded-full border-2 border-accent/30 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1], borderColor: ['#14B8A640', '#14B8A680', '#14B8A640'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <motion.div className="w-12 h-12 rounded-full bg-accent/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            </motion.div>
            <p className="text-sm text-muted mt-6">Start your day</p>
            <p className="text-xs text-muted/60 mt-1">Add a task, log something, or just breathe</p>
          </div>
        )}

        {!isDayEmpty && (
          <div className="flex items-center justify-between bg-surface rounded-2xl p-5">
            <div>
              <p className="text-sm text-muted mb-1">Daily Score</p>
              <p className="text-xs text-muted">{score >= 0 ? scoreTier.label : 'No data yet'}</p>
              {daysOnGrip > 0 && <p className="text-[10px] text-muted/60 mt-2">Day {daysOnGrip} on GRIP</p>}
            </div>
            <CircularProgress value={score} size={80} strokeWidth={6} glow={score >= 71} />
          </div>
        )}

        {ghostTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">Unfinished Business</h2>
            <div className="space-y-1.5">
              {ghostTasks.map(ghost => (
                <button key={ghost.id} onClick={() => rescheduleGhost(ghost)}
                  className="pressable w-full bg-surface/50 rounded-xl p-3 flex items-center gap-3 opacity-60 border border-dashed border-border">
                  <Calendar size={14} className="text-warning" />
                  <span className="text-sm text-foreground/60 flex-1 text-left">{ghost.name}</span>
                  <span className="text-[10px] text-warning">Reschedule</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(todayTasks.length > 0 || !isDayEmpty) && (
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Schedule</h2>
            {todayTasks.length === 0 ? (
              <EmptyState icon="CalendarDays" message="No tasks planned for today" actionLabel="Add Task" onAction={() => setTaskSheetOpen(true)} />
            ) : (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <motion.div key={task.id} layout className={`bg-surface rounded-xl p-4 flex items-center gap-3 border-l-[3px] ${task.completed ? 'opacity-50' : ''}`}
                    style={{ borderLeftColor: CATEGORY_COLORS[task.category] }}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted' : 'text-foreground'}`}>{task.name}</p>
                      <p className="text-xs text-muted mt-0.5">{formatTime(task.startTime)} - {formatTime(task.endTime)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleTask(task.id, 'complete')} className="pressable p-2 rounded-lg hover:bg-surface-2">
                        <CheckCircle size={18} className={task.completed ? 'text-accent' : 'text-muted'} />
                      </button>
                      <button onClick={() => toggleTask(task.id, 'skip')} className="pressable p-2 rounded-lg hover:bg-surface-2">
                        <SkipForward size={18} className={task.skipped ? 'text-warning' : 'text-muted'} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {addictions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">The Fight</h2>
            <div className="grid grid-cols-2 gap-3">
              {addictions.map(addiction => {
                const IconComp = IconMap[addiction.icon] || Icons.Flame;
                const count = getAddictionCountToday(addiction.id, logs);
                const streak = getCurrentStreak(addiction.id, logs);
                const overGoal = count >= addiction.dailyGoal;
                return (
                  <motion.button key={addiction.id} onClick={() => incrementAddiction(addiction.id)} whileTap={{ scale: 0.95 }}
                    className="pressable bg-surface rounded-xl p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <IconComp size={16} className="text-muted" />
                      <span className="text-xs text-muted truncate">{addiction.name}</span>
                    </div>
                    <motion.div className={`text-2xl font-bold ${overGoal ? 'text-danger' : 'text-foreground'}`}
                      animate={overGoal ? { x: [0, -2, 2, -2, 0] } : {}} transition={{ duration: 0.3 }}>
                      <AnimatedNumber value={count} />
                    </motion.div>
                    <div className="mt-1.5"><StreakFlame streak={streak} size={14} showLabel className="text-xs" /></div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {!isDayEmpty && (
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Spending</h2>
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Wallet size={18} className="text-muted" /><span className="text-sm text-muted">Total Spent</span></div>
                <span className="text-lg font-bold text-foreground"><AnimatedNumber value={todaySpent} prefix={`${currency} `} /></span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><p className="text-xs text-muted">Useful</p><p className="text-sm font-medium text-accent">{formatCurrency(todaySpent - todayWasted, currency)}</p></div>
                <div className="flex-1"><p className="text-xs text-muted">Wasted</p><p className="text-sm font-medium text-danger">{formatCurrency(todayWasted, currency)}</p></div>
              </div>
            </div>
          </div>
        )}

        {isReportDay && (
          <button onClick={() => { haptic(); setWeeklyReportOpen(true); }}
            className="pressable w-full py-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center gap-3">
            <Swords size={18} className="text-accent" /><span className="text-sm font-semibold text-accent">Your weekly report is ready</span>
          </button>
        )}

        {!todayReviewDone && (
          <button onClick={() => { haptic(); setNightReviewOpen(true); }}
            className="pressable w-full py-4 rounded-xl bg-surface border border-accent/20 flex items-center justify-center gap-3">
            <Moon size={18} className="text-accent" /><span className="text-sm font-semibold text-accent">Close your day</span>
          </button>
        )}

        <div className="h-4" />

        <FAB onAddTask={() => setTaskSheetOpen(true)} onLogExpense={() => setExpenseSheetOpen(true)} onLogAddiction={() => setAddictionSheetOpen(true)} />

        <BottomSheet open={taskSheetOpen} onClose={() => setTaskSheetOpen(false)} title="Add Task">
          <div className="space-y-4">
            <input type="text" placeholder="Task name" value={taskName} onChange={e => setTaskName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-muted">Start</label><input type="time" value={taskStart} onChange={e => setTaskStart(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-muted">End</label><input type="time" value={taskEnd} onChange={e => setTaskEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><label className="text-xs text-muted">Category</label><div className="flex flex-wrap gap-2">{TASK_CATEGORIES.map(c => <Chip key={c.value} label={c.label} selected={taskCategory === c.value} color={c.color} onClick={() => setTaskCategory(c.value)} />)}</div></div>
            <div className="space-y-2"><label className="text-xs text-muted">Priority</label><div className="flex gap-2">{(['low','medium','high'] as const).map(p => <Chip key={p} label={p.charAt(0).toUpperCase()+p.slice(1)} selected={taskPriority === p} color={p==='high'?'#EF4444':p==='medium'?'#F59E0B':'#6B7280'} onClick={() => setTaskPriority(p)} />)}</div></div>
            <button onClick={addTask} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">Add Task</button>
          </div>
        </BottomSheet>

        <BottomSheet open={expenseSheetOpen} onClose={() => setExpenseSheetOpen(false)} title="Log Transaction">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => {setExpenseType('expense');setExpenseCategory('food');}} className={`pressable flex-1 py-2.5 rounded-xl text-sm font-medium ${expenseType==='expense'?'bg-danger text-white':'bg-surface-2 text-muted'}`}>Expense</button>
              <button onClick={() => {setExpenseType('income');setExpenseCategory('salary');}} className={`pressable flex-1 py-2.5 rounded-xl text-sm font-medium ${expenseType==='income'?'bg-accent text-white':'bg-surface-2 text-muted'}`}>Income</button>
            </div>
            <input type="number" placeholder="Amount" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="text-2xl font-bold text-center" />
            <div className="space-y-2"><label className="text-xs text-muted">Category</label><div className="flex flex-wrap gap-2">{(expenseType==='expense'?EXPENSE_CATEGORIES:INCOME_CATEGORIES).map(c => <Chip key={c.value} label={c.label} selected={expenseCategory===c.value} onClick={() => setExpenseCategory(c.value)} />)}</div></div>
            {expenseType==='expense' && <div className="space-y-2"><label className="text-xs text-muted">Tag</label><div className="flex gap-2">{(['useful','necessary','wasteful'] as const).map(t => <Chip key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} selected={expenseTag===t} color={t==='wasteful'?'#EF4444':t==='useful'?'#10B981':'#F59E0B'} onClick={() => setExpenseTag(t)} />)}</div></div>}
            <input type="text" placeholder="Note (optional)" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} />
            <button onClick={addExpense} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">{expenseType==='income'?'Add Income':'Log Expense'}</button>
          </div>
        </BottomSheet>

        <BottomSheet open={addictionSheetOpen} onClose={() => setAddictionSheetOpen(false)} title="Log Addiction">
          {addictions.length === 0 ? (
            <EmptyState icon="Target" message="No addictions tracked yet. Add one in the Tracker tab." />
          ) : (
            <div className="space-y-2">
              {addictions.map(a => {
                const IconComp = IconMap[a.icon] || Icons.Flame;
                return (
                  <button key={a.id} onClick={() => { incrementAddiction(a.id); setAddictionSheetOpen(false); }}
                    className="pressable w-full flex items-center gap-3 bg-surface-2 rounded-xl p-4">
                    <IconComp size={20} className="text-muted" />
                    <span className="text-sm text-foreground font-medium">{a.name}</span>
                    <span className="ml-auto text-sm text-muted">{getAddictionCountToday(a.id, logs)} today</span>
                  </button>
                );
              })}
            </div>
          )}
        </BottomSheet>
      </motion.div>

      <AnimatePresence>
        {nightReviewOpen && <NightReview open={nightReviewOpen} onClose={() => { setNightReviewOpen(false); loadData(); }} settings={settings} userId={userId} />}
      </AnimatePresence>
      <AnimatePresence>
        {weeklyReportOpen && <WeeklyReport open={weeklyReportOpen} onClose={() => setWeeklyReportOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
