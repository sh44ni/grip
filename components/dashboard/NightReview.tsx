'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle, ArrowRight, X, Minus } from 'lucide-react';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useToast } from '@/components/ui/Toast';
import { getTasks, getAddictions, getAddictionLogs, getTransactions, createOrUpdateReview } from '@/lib/storage';
import { todayISO, calculateDailyScore, getScoreTier, formatCurrency, haptic } from '@/lib/utils';
import type { Task, DailyReview, DayRating, Settings } from '@/lib/types';

interface NightReviewProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
}

export function NightReview({ open, onClose, settings }: NightReviewProps) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState<DayRating | null>(null);
  const [winTaskId, setWinTaskId] = useState<string | null>(null);
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [saved, setSaved] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [score, setScore] = useState(0);
  const [slipCount, setSlipCount] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [todayWasted, setTodayWasted] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const { showToast } = useToast();

  const today = todayISO();
  const currency = settings.currency || 'PKR';

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [t, a, l, tx] = await Promise.all([getTasks(), getAddictions(), getAddictionLogs(), getTransactions()]);
      const dayTasks = t.filter(task => task.date === today);
      setTasks(dayTasks);
      const todayExpenses = tx.filter(tr => tr.date === today && tr.type === 'expense');
      setTodaySpent(todayExpenses.reduce((s, tr) => s + tr.amount, 0));
      setTodayWasted(todayExpenses.filter(tr => tr.tag === 'wasteful').reduce((s, tr) => s + tr.amount, 0));
      setSlipCount(l.filter(log => log.timestamp.startsWith(today)).length);
      const scoreResult = calculateDailyScore(t, l, tx, a);
      setScore(scoreResult.hasData ? scoreResult.score : 0);
      setLoaded(true);
    })();
  }, [open, today]);

  const completedTasks = tasks.filter(t => t.completed);
  const tier = getScoreTier(score);

  const saveReview = async () => {
    haptic();
    await createOrUpdateReview({ date: today, rating: rating || 'mid', biggestWinTaskId: winTaskId, tomorrowFocus, finalScore: score });
    setSaved(true);
    showToast('Day closed');
    setTimeout(onClose, 3000);
  };

  if (!open || !loaded) return null;

  const RATING_OPTIONS: { value: DayRating; label: string; color: string }[] = [
    { value: 'good', label: 'Good', color: '#10B981' },
    { value: 'mid', label: 'Mid', color: '#F59E0B' },
    { value: 'bad', label: 'Bad', color: '#EF4444' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-background flex justify-center">
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-bold text-foreground">Close Your Day</h2>
          <button onClick={onClose} className="pressable p-2 rounded-xl"><X size={20} className="text-muted" /></button>
        </div>

        <div className="flex-1 flex items-center justify-center p-5">
          <AnimatePresence mode="wait">
            {!saved && step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full space-y-8 text-center">
                <h3 className="text-xl font-bold text-foreground">How was today?</h3>
                <div className="flex gap-4 justify-center">
                  {RATING_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { haptic(); setRating(opt.value); setStep(1); }}
                      className="pressable w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 bg-surface"
                      style={{ border: `2px solid ${opt.color}30` }}>
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: opt.color }} />
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {!saved && step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full space-y-6">
                <h3 className="text-xl font-bold text-foreground text-center">Biggest win?</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {completedTasks.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">No tasks completed today</p>
                  ) : (
                    completedTasks.map(task => (
                      <button key={task.id} onClick={() => { haptic(); setWinTaskId(task.id); setStep(2); }}
                        className={`pressable w-full text-left p-4 rounded-xl ${winTaskId === task.id ? 'bg-accent/20 ring-1 ring-accent' : 'bg-surface'}`}>
                        <div className="flex items-center gap-3"><CheckCircle size={18} className="text-accent shrink-0" /><span className="text-sm text-foreground">{task.name}</span></div>
                      </button>
                    ))
                  )}
                  <button onClick={() => { setWinTaskId(null); setStep(2); }} className="pressable w-full text-left p-4 rounded-xl bg-surface flex items-center gap-3">
                    <Minus size={18} className="text-muted" /><span className="text-sm text-muted">Nothing today</span>
                  </button>
                </div>
              </motion.div>
            )}

            {!saved && step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full space-y-6">
                <h3 className="text-xl font-bold text-foreground text-center">One thing for tomorrow?</h3>
                <input type="text" placeholder="Your focus for tomorrow" value={tomorrowFocus} onChange={e => setTomorrowFocus(e.target.value)} className="text-center" autoFocus />
                <button onClick={saveReview} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2">Close the day <ArrowRight size={16} /></button>
              </motion.div>
            )}

            {saved && (
              <motion.div key="summary" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-6 text-center">
                <CircularProgress value={score} size={120} strokeWidth={8} glow={score >= 71} label={tier.label} />
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface rounded-xl p-3"><p className="text-xs text-muted mb-1">Tasks</p><p className="text-lg font-bold text-foreground">{completedTasks.length}/{tasks.length}</p></div>
                  <div className="bg-surface rounded-xl p-3"><p className="text-xs text-muted mb-1">Slips</p><p className="text-lg font-bold text-danger"><AnimatedNumber value={slipCount} /></p></div>
                  <div className="bg-surface rounded-xl p-3"><p className="text-xs text-muted mb-1">Spent</p><p className="text-sm font-bold text-foreground">{formatCurrency(todaySpent, currency)}</p></div>
                </div>
                {todayWasted > 0 && <p className="text-sm text-danger">{formatCurrency(todayWasted, currency)} wasted</p>}
                <p className="text-sm text-muted">{rating === 'good' ? 'You called it a good day. Carry that momentum.' : rating === 'bad' ? 'Rough one. Tomorrow is a clean slate.' : 'An average day. Push harder tomorrow.'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!saved && (
          <div className="flex justify-center gap-2 pb-8">
            {[0, 1, 2].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-accent' : 'bg-surface-2'}`} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
