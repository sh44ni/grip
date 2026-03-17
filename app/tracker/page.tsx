'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, parseISO } from 'date-fns';
import { Plus, TrendingUp, TrendingDown, Minus, Trophy, Calendar, ChevronDown, ChevronUp, X, DollarSign } from 'lucide-react';
import * as Icons from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap = Icons as unknown as Record<string, React.ComponentType<any>>;
import { getAddictions, getAddictionLogs, getMilestones, getSettings, createAddiction, updateAddiction, deleteAddiction as deleteAddictionAPI, createAddictionLog, createMilestone, deleteAddictionLogsByAddiction } from '@/lib/storage';
import { getAddictionCountToday, getCurrentStreak, getBestStreak, getDailyAverage, getTrend, getTotalBurned, todayISO, haptic, formatCurrency } from '@/lib/utils';
import { ADDICTION_ICONS, MILESTONE_DAYS, WAR_MESSAGES } from '@/lib/constants';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StreakFlame } from '@/components/ui/StreakFlame';
import { useToast } from '@/components/ui/Toast';
import { nanoid } from 'nanoid';
import type { Addiction, AddictionLog, Milestone } from '@/lib/types';

function AddictionCard({ addiction, logs, milestones, currency, onLog, onLongPress, onEdit, onDelete, onExpand, expanded, checkMilestones }: {
  addiction: Addiction; logs: AddictionLog[]; milestones: Milestone[]; currency: string;
  onLog: (id: string) => void; onLongPress: (id: string) => void;
  onEdit: (a: Addiction) => void; onDelete: (id: string) => void;
  onExpand: (id: string | null) => void; expanded: boolean;
  checkMilestones: (id: string, streak: number, name: string) => void;
}) {
  const IconComp = IconMap[addiction.icon] || Icons.Flame;
  const count = getAddictionCountToday(addiction.id, logs);
  const streak = getCurrentStreak(addiction.id, logs);
  const best = getBestStreak(addiction.id, logs);
  const avg = getDailyAverage(addiction.id, logs);
  const trend = getTrend(addiction.id, logs);
  const totalBurned = getTotalBurned(addiction, logs);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'down' ? 'text-accent' : trend === 'up' ? 'text-danger' : 'text-muted';
  const overGoal = count >= addiction.dailyGoal;
  const todayLogs = logs.filter(l => l.addictionId === addiction.id && l.timestamp.startsWith(todayISO()));

  useEffect(() => {
    if (streak > 0) checkMilestones(addiction.id, streak, addiction.name);
  }, [streak, addiction.id, addiction.name, checkMilestones]);

  const heatmap = expanded ? Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
    return { date: d, count: logs.filter(l => l.addictionId === addiction.id && l.timestamp.startsWith(d)).length };
  }) : [];

  const getStreakMessage = () => {
    if (streak >= 90) return WAR_MESSAGES.streak90;
    if (streak >= 60) return WAR_MESSAGES.streak60;
    if (streak >= 30) return WAR_MESSAGES.streak30;
    if (streak >= 14) return WAR_MESSAGES.streak14;
    if (streak >= 7) return WAR_MESSAGES.streak7;
    if (streak >= 1 && count === 0) return WAR_MESSAGES.cleanDay;
    return null;
  };
  const streakMsg = getStreakMessage();

  return (
    <motion.div layout className="bg-surface rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center"><IconComp size={20} className="text-muted" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">{addiction.name}</p>
              <div className="flex items-center gap-1 mt-0.5"><TrendIcon size={12} className={trendColor} /><span className={`text-xs ${trendColor}`}>{trend === 'down' ? 'Improving' : trend === 'up' ? 'Increasing' : 'Stable'}</span></div>
            </div>
          </div>
          <button onClick={() => onExpand(expanded ? null : addiction.id)} className="pressable p-1.5 rounded-lg">
            {expanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="text-center"><p className="text-xs text-muted mb-1">Today</p><motion.p className={`text-xl font-bold ${overGoal ? 'text-danger' : 'text-foreground'}`} animate={overGoal ? { x: [0, -2, 2, -2, 0] } : {}} transition={{ duration: 0.3 }}><AnimatedNumber value={count} /></motion.p></div>
          <div className="text-center"><p className="text-xs text-muted mb-1">Best</p><p className="text-xl font-bold text-foreground">{best}d</p></div>
          <div className="text-center"><p className="text-xs text-muted mb-1">Avg/7d</p><p className="text-xl font-bold text-foreground">{avg}</p></div>
          <div className="text-center flex flex-col items-center"><p className="text-xs text-muted mb-1">Streak</p><StreakFlame streak={streak} size={20} /></div>
        </div>
        <div className="bg-surface-2 rounded-xl p-3 mb-3">
          <StreakFlame streak={streak} size={16} showLabel className="justify-center w-full" />
          {streakMsg && <p className="text-[10px] text-muted text-center mt-1.5">{streakMsg}</p>}
        </div>
        {addiction.costPerUnit > 0 && totalBurned > 0 && (
          <div className="flex items-center gap-2 mb-3 px-1"><DollarSign size={12} className="text-danger/60 shrink-0" /><p className="text-[11px] text-danger/60">Total burned on {addiction.name} since tracking: {formatCurrency(totalBurned, currency)}</p></div>
        )}
        <div className="flex gap-2">
          <button onClick={() => onLog(addiction.id)} onContextMenu={e => { e.preventDefault(); onLongPress(addiction.id); }}
            className="pressable flex-1 py-2.5 rounded-xl bg-danger/10 text-danger text-sm font-medium flex items-center justify-center gap-2"><Plus size={16} /> Log ({addiction.unit})</button>
          <button onClick={() => onEdit(addiction)} className="pressable py-2.5 px-4 rounded-xl bg-surface-2 text-muted text-sm">Edit</button>
          <button onClick={() => onDelete(addiction.id)} className="pressable py-2.5 px-3 rounded-xl bg-surface-2"><X size={16} className="text-muted" /></button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              <div><p className="text-xs text-muted mb-2 flex items-center gap-1"><Calendar size={12} /> Last 30 days</p>
                <div className="grid grid-cols-10 gap-1">{heatmap.map(({ date, count: c }) => (<div key={date} className="aspect-square rounded-sm" style={{ backgroundColor: c === 0 ? 'var(--color-accent)' : c <= 2 ? '#F59E0B40' : c <= 5 ? '#EF444460' : '#EF4444', opacity: c === 0 ? 0.3 : 1 }} title={`${date}: ${c}`} />))}</div>
                <div className="flex items-center gap-2 mt-2"><span className="text-[10px] text-muted">Clean</span><div className="flex gap-0.5">{[0.3, 0.5, 0.7, 1].map((op, i) => (<div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: i === 0 ? 'var(--color-accent)' : '#EF4444', opacity: op }} />))}</div><span className="text-[10px] text-muted">Heavy</span></div>
              </div>
              {todayLogs.length > 0 && (<div><p className="text-xs text-muted mb-2">Today&apos;s logs</p><div className="space-y-1">{todayLogs.map(log => (<div key={log.id} className="flex items-center gap-2 text-xs"><span className="text-muted">{format(parseISO(log.timestamp), 'h:mm a')}</span>{log.note && <span className="text-foreground/70">{log.note}</span>}</div>))}</div></div>)}
              <div><p className="text-xs text-muted mb-2 flex items-center gap-1"><Trophy size={12} /> Milestones</p><div className="flex flex-wrap gap-2">{MILESTONE_DAYS.map(d => { const achieved = milestones.some(m => m.addictionId === addiction.id && m.days === d); return <div key={d} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${achieved ? 'bg-accent/20 text-accent' : 'bg-surface-2 text-muted'}`}>{d}d {achieved ? 'clean' : ''}</div>; })}</div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TrackerPage() {
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [logs, setLogs] = useState<AddictionLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editingAddiction, setEditingAddiction] = useState<Addiction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteAddictionId, setNoteAddictionId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [milestonePopup, setMilestonePopup] = useState<{ addiction: string; days: number } | null>(null);
  const [currency, setCurrency] = useState('PKR');
  const { showToast } = useToast();
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Cigarette');
  const [formGoal, setFormGoal] = useState('5');
  const [formUnit, setFormUnit] = useState('times');
  const [formCost, setFormCost] = useState('0');

  const loadData = useCallback(async () => {
    const [a, l, m, s] = await Promise.all([getAddictions(), getAddictionLogs(), getMilestones(), getSettings()]);
    setAddictions(a); setLogs(l); setMilestones(m); setCurrency(s.currency || 'PKR');
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const checkMilestones = useCallback(async (addictionId: string, currentStreak: number, addictionName: string) => {
    for (const days of MILESTONE_DAYS) {
      if (currentStreak >= days && !milestones.some(m => m.addictionId === addictionId && m.days === days)) {
        const nm = await createMilestone({ addictionId, type: 'clean_days', days });
        setMilestones(prev => [...prev, nm]);
        setMilestonePopup({ addiction: addictionName, days });
      }
    }
  }, [milestones]);

  const logAddiction = async (id: string, note = '') => {
    haptic(30);
    const prevStreak = getCurrentStreak(id, logs);
    const nl = await createAddictionLog({ addictionId: id, timestamp: new Date().toISOString(), note });
    setLogs([...logs, nl]);
    if (prevStreak > 0) showToast(WAR_MESSAGES.relapse(prevStreak), 'warning');
    else showToast(WAR_MESSAGES.slip, 'warning');
  };

  const openAddForm = (a?: Addiction) => {
    if (a) { setEditingAddiction(a); setFormName(a.name); setFormIcon(a.icon); setFormGoal(String(a.dailyGoal)); setFormUnit(a.unit); setFormCost(String(a.costPerUnit || 0)); }
    else { setEditingAddiction(null); setFormName(''); setFormIcon('Cigarette'); setFormGoal('5'); setFormUnit('times'); setFormCost('0'); }
    setAddFormOpen(true);
  };

  const submitAddiction = async () => {
    if (!formName.trim()) return;
    haptic();
    if (editingAddiction) {
      const updated = await updateAddiction({ id: editingAddiction.id, name: formName, icon: formIcon, dailyGoal: Number(formGoal), unit: formUnit, costPerUnit: Number(formCost) || 0 });
      setAddictions(addictions.map(a => a.id === editingAddiction.id ? updated : a));
      showToast('Updated');
    } else {
      const newA = await createAddiction({ id: nanoid(), name: formName, icon: formIcon, dailyGoal: Number(formGoal) || 5, unit: formUnit || 'times', costPerUnit: Number(formCost) || 0 });
      setAddictions([...addictions, newA]);
      showToast('Addiction added');
    }
    setAddFormOpen(false);
  };

  const doDeleteAddiction = async (id: string) => {
    haptic();
    await deleteAddictionAPI(id);
    setAddictions(addictions.filter(a => a.id !== id));
    setLogs(logs.filter(l => l.addictionId !== id));
    showToast('Deleted');
  };

  if (!loaded) return <div className="p-5 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">The Fight</h1>
      <p className="text-xs text-muted -mt-3">Track your battles. Every day is a new round.</p>

      {addictions.length === 0 ? (
        <EmptyState icon="Target" message="No battles being fought yet. Add something you want to conquer." actionLabel="Add Addiction" onAction={() => openAddForm()} />
      ) : (
        <div className="space-y-3">
          {addictions.map(a => (
            <AddictionCard key={a.id} addiction={a} logs={logs} milestones={milestones} currency={currency}
              onLog={id => logAddiction(id)} onLongPress={id => { haptic(100); setNoteAddictionId(id); setNoteText(''); setNoteModalOpen(true); }}
              onEdit={openAddForm} onDelete={id => setDeleteConfirm(id)}
              onExpand={setExpandedId} expanded={expandedId === a.id}
              checkMilestones={checkMilestones} />
          ))}
        </div>
      )}

      <button onClick={() => openAddForm()} className="pressable w-full py-3.5 rounded-xl border border-dashed border-border text-muted text-sm font-medium flex items-center justify-center gap-2"><Plus size={16} /> Add Addiction</button>

      <BottomSheet open={addFormOpen} onClose={() => setAddFormOpen(false)} title={editingAddiction ? 'Edit Addiction' : 'Add Addiction'}>
        <div className="space-y-4">
          <input type="text" placeholder="Addiction name" value={formName} onChange={e => setFormName(e.target.value)} />
          <div className="space-y-2"><label className="text-xs text-muted">Icon</label><div className="grid grid-cols-5 gap-2">{ADDICTION_ICONS.map(iconName => { const IC = IconMap[iconName] || Icons.Flame; return <button key={iconName} onClick={() => setFormIcon(iconName)} className={`pressable aspect-square rounded-xl flex items-center justify-center ${formIcon === iconName ? 'bg-accent/20 ring-2 ring-accent' : 'bg-surface-2'}`}><IC size={20} className={formIcon === iconName ? 'text-accent' : 'text-muted'} /></button>; })}</div></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><label className="text-xs text-muted">Daily Goal (max)</label><input type="number" value={formGoal} onChange={e => setFormGoal(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs text-muted">Unit Label</label><input type="text" value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="times" /></div>
            <div className="space-y-1"><label className="text-xs text-muted">Cost/unit ({currency})</label><input type="number" value={formCost} onChange={e => setFormCost(e.target.value)} placeholder="0" /></div>
          </div>
          <p className="text-[10px] text-muted">Cost per unit is used for the shame counter. Set to 0 to hide.</p>
          <button onClick={submitAddiction} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">{editingAddiction ? 'Update' : 'Add Addiction'}</button>
        </div>
      </BottomSheet>

      <BottomSheet open={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="Add Note">
        <div className="space-y-4">
          <textarea placeholder="What triggered this? (optional)" value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} autoFocus />
          <button onClick={() => { logAddiction(noteAddictionId, noteText); setNoteModalOpen(false); }} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">Log with Note</button>
        </div>
      </BottomSheet>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && doDeleteAddiction(deleteConfirm)} title="Delete Addiction" message="This will permanently delete this addiction and all its logs." confirmLabel="Delete" danger />

      <AnimatePresence>
        {milestonePopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60" onClick={() => setMilestonePopup(null)}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', duration: 0.6 }}
              className="bg-surface rounded-2xl p-8 text-center max-w-[300px]">
              <motion.div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={32} className="text-accent" /></motion.div>
              <h3 className="text-2xl font-black text-foreground mb-2">{milestonePopup.days} DAYS</h3>
              <p className="text-sm text-muted">{milestonePopup.days} days clean from {milestonePopup.addiction}</p>
              <p className="text-xs text-accent mt-2">{milestonePopup.days >= 90 ? WAR_MESSAGES.streak90 : milestonePopup.days >= 60 ? WAR_MESSAGES.streak60 : milestonePopup.days >= 30 ? WAR_MESSAGES.streak30 : milestonePopup.days >= 7 ? WAR_MESSAGES.streak7 : 'Keep fighting.'}</p>
              <button onClick={() => setMilestonePopup(null)} className="pressable mt-6 px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-medium">Keep Going</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
