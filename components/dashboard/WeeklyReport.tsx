'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { X, TrendingUp, TrendingDown, Minus, Swords, CheckCircle, Target, Wallet, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { getSettings, getTasks, getAddictions, getAddictionLogs, getTransactions } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import type { Settings, Task, AddictionLog, Transaction, Addiction } from '@/lib/types';

interface WeeklyReportProps {
  open: boolean;
  onClose: () => void;
}

function computeWeekData(tasks: Task[], logs: AddictionLog[], transactions: Transaction[], addictions: Addiction[], weeksAgo: number) {
  let totalTasks = 0, completedTasks = 0, cleanDays = 0, totalSpent = 0, totalWasted = 0, totalSaved = 0;
  const scores: number[] = [];

  for (let i = 0; i < 7; i++) {
    const d = format(subDays(new Date(), i + weeksAgo * 7), 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => t.date === d);
    const dayCompleted = dayTasks.filter(t => t.completed);
    totalTasks += dayTasks.length;
    completedTasks += dayCompleted.length;

    const dayLogs = logs.filter(l => l.timestamp.startsWith(d));
    if (addictions.length > 0 && dayLogs.length === 0) cleanDays++;

    const dayExpenses = transactions.filter(t => t.date === d && t.type === 'expense');
    const dayIncome = transactions.filter(t => t.date === d && t.type === 'income');
    totalSpent += dayExpenses.reduce((s, t) => s + t.amount, 0);
    totalWasted += dayExpenses.filter(t => t.tag === 'wasteful').reduce((s, t) => s + t.amount, 0);
    totalSaved += dayIncome.reduce((s, t) => s + t.amount, 0) - dayExpenses.reduce((s, t) => s + t.amount, 0);

    let score = 50;
    score += dayCompleted.length * 7;
    score -= dayLogs.length * 5;
    score -= dayExpenses.filter(t => t.tag === 'wasteful').length * 3;
    if (addictions.length > 0 && dayLogs.length === 0) score += 10;
    score = Math.max(0, Math.min(100, score));
    if (dayTasks.length > 0 || dayLogs.length > 0 || dayExpenses.length > 0) scores.push(score);
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : -1;
  return { totalTasks, completedTasks, cleanDays, totalSpent, totalWasted, totalSaved, avgScore };
}

export function WeeklyReport({ open, onClose }: WeeklyReportProps) {
  const [data, setData] = useState<{ thisWeek: ReturnType<typeof computeWeekData>; lastWeek: ReturnType<typeof computeWeekData>; currency: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [settings, tasks, addictions, logs, transactions] = await Promise.all([
        getSettings(), getTasks(), getAddictions(), getAddictionLogs(), getTransactions(),
      ]);
      setData({
        thisWeek: computeWeekData(tasks, logs, transactions, addictions, 0),
        lastWeek: computeWeekData(tasks, logs, transactions, addictions, 1),
        currency: settings.currency || 'PKR',
      });
    })();
  }, [open]);

  if (!open || !data) return null;

  const { thisWeek, lastWeek, currency } = data;
  const diff = thisWeek.avgScore >= 0 && lastWeek.avgScore >= 0 ? thisWeek.avgScore - lastWeek.avgScore : 0;
  const verdict = diff > 5 ? 'leveled_up' : diff >= -5 ? 'steady' : 'knocked_down';

  const TrendArrow = ({ curr, prev }: { curr: number; prev: number }) => {
    if (curr > prev) return <ChevronUp size={14} className="text-accent" />;
    if (curr < prev) return <ChevronDown size={14} className="text-danger" />;
    return <Minus size={14} className="text-muted" />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-background flex justify-center">
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2"><Swords size={20} className="text-accent" /><h2 className="text-lg font-bold text-foreground">Weekly Report</h2></div>
          <button onClick={onClose} className="pressable p-2 rounded-xl"><X size={20} className="text-muted" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-5 space-y-8">
          <div className="text-center">
            <p className="text-xs text-muted mb-4">YOUR WEEKLY SCORE</p>
            <div className="flex items-center gap-8 justify-center">
              <div className="text-center"><p className="text-[10px] text-muted mb-2">LAST WEEK</p><CircularProgress value={lastWeek.avgScore} size={70} strokeWidth={5} /></div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                {verdict === 'leveled_up' ? <TrendingUp size={28} className="text-accent" /> : verdict === 'knocked_down' ? <TrendingDown size={28} className="text-danger" /> : <Minus size={28} className="text-warning" />}
              </motion.div>
              <div className="text-center"><p className="text-[10px] text-muted mb-2">THIS WEEK</p><CircularProgress value={thisWeek.avgScore} size={70} strokeWidth={5} glow={thisWeek.avgScore >= 71} /></div>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className={`text-center px-6 py-4 rounded-2xl ${verdict === 'leveled_up' ? 'bg-accent/10' : verdict === 'knocked_down' ? 'bg-danger/10' : 'bg-warning/10'}`}>
            <p className={`text-lg font-black ${verdict === 'leveled_up' ? 'text-accent' : verdict === 'knocked_down' ? 'text-danger' : 'text-warning'}`}>
              {verdict === 'leveled_up' ? 'You leveled up' : verdict === 'knocked_down' ? 'You got knocked down. Get back up.' : 'You held steady'}
            </p>
          </motion.div>
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><CheckCircle size={14} className="text-accent" /><span className="text-xs text-muted">Tasks Done</span></div><TrendArrow curr={thisWeek.completedTasks} prev={lastWeek.completedTasks} /></div>
              <p className="text-xl font-bold text-foreground"><AnimatedNumber value={thisWeek.completedTasks} /></p><p className="text-[10px] text-muted mt-1">of {thisWeek.totalTasks} planned</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Shield size={14} className="text-accent" /><span className="text-xs text-muted">Clean Days</span></div><TrendArrow curr={thisWeek.cleanDays} prev={lastWeek.cleanDays} /></div>
              <p className="text-xl font-bold text-foreground"><AnimatedNumber value={thisWeek.cleanDays} /></p><p className="text-[10px] text-muted mt-1">addiction-free</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Wallet size={14} className="text-accent" /><span className="text-xs text-muted">Saved</span></div><TrendArrow curr={thisWeek.totalSaved} prev={lastWeek.totalSaved} /></div>
              <p className={`text-lg font-bold ${thisWeek.totalSaved >= 0 ? 'text-accent' : 'text-danger'}`}>{formatCurrency(thisWeek.totalSaved, currency)}</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Target size={14} className="text-danger" /><span className="text-xs text-muted">Wasted</span></div><TrendArrow curr={thisWeek.totalWasted} prev={lastWeek.totalWasted} /></div>
              <p className="text-lg font-bold text-danger">{formatCurrency(thisWeek.totalWasted, currency)}</p>
            </div>
          </div>
          <button onClick={onClose} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">Done</button>
        </div>
      </div>
    </motion.div>
  );
}
