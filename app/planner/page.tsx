'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { Plus, Copy, Save, ChevronLeft, ChevronRight, CheckCircle, Trash2, GripVertical } from 'lucide-react';
import { getSettings, getTasks, getTemplates, createTask, updateTask, deleteTask as deleteTaskAPI, createTemplate } from '@/lib/storage';
import { formatTime, generateTimeSlots, haptic, todayISO } from '@/lib/utils';
import { CATEGORY_COLORS, TASK_CATEGORIES, DEFAULT_SETTINGS } from '@/lib/constants';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { nanoid } from 'nanoid';
import type { Task, TaskCategory, TaskPriority, RepeatType, Settings, DayTemplate } from '@/lib/types';

export default function PlannerPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const { showToast } = useToast();

  const [taskName, setTaskName] = useState('');
  const [taskStart, setTaskStart] = useState('09:00');
  const [taskEnd, setTaskEnd] = useState('10:00');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('work');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskRepeat, setTaskRepeat] = useState<RepeatType>('none');
  const [taskNotes, setTaskNotes] = useState('');

  const loadData = useCallback(async () => {
    const [s, t, tmpl] = await Promise.all([getSettings(), getTasks(), getTemplates()]);
    setSettings(s); setTasks(t); setTemplates(tmpl);
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: settings.weekStartDay });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayTasks = tasks.filter(t => t.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openForm = (task?: Task) => {
    if (task) {
      setEditingTask(task); setTaskName(task.name); setTaskStart(task.startTime); setTaskEnd(task.endTime);
      setTaskCategory(task.category); setTaskPriority(task.priority); setTaskRepeat(task.repeat); setTaskNotes(task.notes);
    } else {
      setEditingTask(null); setTaskName(''); setTaskStart('09:00'); setTaskEnd('10:00');
      setTaskCategory('work'); setTaskPriority('medium'); setTaskRepeat('none'); setTaskNotes('');
    }
    setFormOpen(true);
  };

  const submitTask = async () => {
    if (!taskName.trim()) return;
    haptic();
    if (editingTask) {
      const updated = await updateTask({ id: editingTask.id, name: taskName, startTime: taskStart, endTime: taskEnd, category: taskCategory, priority: taskPriority, repeat: taskRepeat, notes: taskNotes });
      setTasks(tasks.map(t => t.id === editingTask.id ? updated : t));
      showToast('Task updated');
    } else {
      const newTask = await createTask({ id: nanoid(), name: taskName, date: selectedDate, startTime: taskStart, endTime: taskEnd, category: taskCategory, priority: taskPriority, repeat: taskRepeat, notes: taskNotes, completed: false, skipped: false });
      setTasks([...tasks, newTask]);
      showToast('Task added');
    }
    setFormOpen(false);
  };

  const doDeleteTask = async (id: string) => {
    haptic();
    await deleteTaskAPI(id);
    setTasks(tasks.filter(t => t.id !== id));
    showToast('Task deleted');
  };

  const toggleComplete = async (id: string) => {
    haptic();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = await updateTask({ id, completed: !task.completed });
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const copyToTomorrow = async () => {
    haptic();
    const tomorrow = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    const copied: Task[] = [];
    for (const t of dayTasks) {
      const newTask = await createTask({ id: nanoid(), name: t.name, date: tomorrow, startTime: t.startTime, endTime: t.endTime, category: t.category, priority: t.priority, repeat: 'none', notes: t.notes, completed: false, skipped: false });
      copied.push(newTask);
    }
    setTasks([...tasks, ...copied]);
    showToast(`Copied ${copied.length} tasks to tomorrow`);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    haptic();
    const tmpl = await createTemplate({ name: templateName, tasks: dayTasks.map(({ name, startTime, endTime, category, priority, repeat, notes }) => ({ name, startTime, endTime, category, priority, repeat, notes })) });
    setTemplates([...templates, tmpl]);
    setSaveTemplateOpen(false); setTemplateName('');
    showToast('Template saved');
  };

  const applyTemplate = async (tmpl: DayTemplate) => {
    haptic();
    const templateTasks = tmpl.tasks as Array<{ name: string; startTime: string; endTime: string; category: TaskCategory; priority: TaskPriority; repeat: RepeatType; notes: string }>;
    const newTasks: Task[] = [];
    for (const t of templateTasks) {
      const newTask = await createTask({ id: nanoid(), ...t, date: selectedDate, completed: false, skipped: false });
      newTasks.push(newTask);
    }
    setTasks([...tasks, ...newTasks]);
    setApplyTemplateOpen(false);
    showToast(`Applied template "${tmpl.name}"`);
  };

  if (!loaded) {
    return <div className="p-5 space-y-4"><div className="skeleton h-12 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Planner</h1>
        <div className="flex gap-2">
          {dayTasks.length > 0 && (
            <>
              <button onClick={copyToTomorrow} className="pressable p-2 rounded-xl bg-surface-2" title="Copy to tomorrow"><Copy size={18} className="text-muted" /></button>
              <button onClick={() => setSaveTemplateOpen(true)} className="pressable p-2 rounded-xl bg-surface-2" title="Save as template"><Save size={18} className="text-muted" /></button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isToday = isSameDay(day, new Date());
          const hasTasks = tasks.some(t => t.date === dateStr);
          return (
            <button key={dateStr} onClick={() => { haptic(20); setSelectedDate(dateStr); }}
              className={`pressable flex flex-col items-center min-w-[48px] py-2.5 px-2 rounded-xl transition-colors ${isSelected ? 'bg-accent' : 'bg-surface'}`}>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-muted'}`}>{format(day, 'EEE')}</span>
              <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-accent' : 'text-foreground'}`}>{format(day, 'd')}</span>
              {hasTasks && !isSelected && <div className="w-1 h-1 rounded-full bg-accent mt-1" />}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={() => openForm()} className="pressable flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium flex items-center justify-center gap-2"><Plus size={16} /> Add Task</button>
        {templates.length > 0 && <button onClick={() => setApplyTemplateOpen(true)} className="pressable py-2.5 px-4 rounded-xl bg-surface-2 text-muted text-sm font-medium">Templates</button>}
      </div>

      {dayTasks.length === 0 ? (
        <EmptyState icon="CalendarDays" message={`No tasks for ${format(parseISO(selectedDate), 'EEEE, MMM d')}`} actionLabel="Add Task" onAction={() => openForm()} />
      ) : (
        <div className="space-y-2">
          {dayTasks.map(task => (
            <motion.div key={task.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`bg-surface rounded-xl overflow-hidden ${task.completed ? 'opacity-50' : ''}`}>
              <div className="flex">
                <div className="w-1 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[task.category] }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0" onClick={() => openForm(task)}>
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted' : 'text-foreground'}`}>{task.name}</p>
                      <p className="text-xs text-muted mt-1">{formatTime(task.startTime)} - {formatTime(task.endTime)}</p>
                      {task.notes && <p className="text-xs text-muted mt-1 truncate">{task.notes}</p>}
                    </div>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button onClick={() => toggleComplete(task.id)} className="pressable p-1.5 rounded-lg"><CheckCircle size={18} className={task.completed ? 'text-accent' : 'text-muted'} /></button>
                      <button onClick={() => setDeleteConfirm(task.id)} className="pressable p-1.5 rounded-lg"><Trash2 size={18} className="text-muted" /></button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: CATEGORY_COLORS[task.category] + '20', color: CATEGORY_COLORS[task.category] }}>{task.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${task.priority === 'high' ? 'bg-danger/20 text-danger' : task.priority === 'medium' ? 'bg-warning/20 text-warning' : 'bg-surface-2 text-muted'}`}>{task.priority}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <BottomSheet open={formOpen} onClose={() => setFormOpen(false)} title={editingTask ? 'Edit Task' : 'Add Task'}>
        <div className="space-y-4">
          <input type="text" placeholder="Task name" value={taskName} onChange={e => setTaskName(e.target.value)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-xs text-muted">Start</label><input type="time" value={taskStart} onChange={e => setTaskStart(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-xs text-muted">End</label><input type="time" value={taskEnd} onChange={e => setTaskEnd(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><label className="text-xs text-muted">Category</label><div className="flex flex-wrap gap-2">{TASK_CATEGORIES.map(c => <Chip key={c.value} label={c.label} selected={taskCategory === c.value} color={c.color} onClick={() => setTaskCategory(c.value)} />)}</div></div>
          <div className="space-y-2"><label className="text-xs text-muted">Priority</label><div className="flex gap-2">{(['low','medium','high'] as const).map(p => <Chip key={p} label={p.charAt(0).toUpperCase()+p.slice(1)} selected={taskPriority===p} color={p==='high'?'#EF4444':p==='medium'?'#F59E0B':'#6B7280'} onClick={() => setTaskPriority(p)} />)}</div></div>
          <div className="space-y-2"><label className="text-xs text-muted">Repeat</label><div className="flex flex-wrap gap-2">{(['none','daily','weekdays','weekly'] as const).map(r => <Chip key={r} label={r==='none'?'None':r.charAt(0).toUpperCase()+r.slice(1)} selected={taskRepeat===r} onClick={() => setTaskRepeat(r)} />)}</div></div>
          <textarea placeholder="Notes (optional)" value={taskNotes} onChange={e => setTaskNotes(e.target.value)} rows={2} />
          <button onClick={submitTask} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">{editingTask ? 'Update Task' : 'Add Task'}</button>
        </div>
      </BottomSheet>

      <BottomSheet open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} title="Save as Template">
        <div className="space-y-4">
          <input type="text" placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)} />
          <p className="text-xs text-muted">This will save {dayTasks.length} tasks as a reusable template.</p>
          <button onClick={saveAsTemplate} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">Save Template</button>
        </div>
      </BottomSheet>

      <BottomSheet open={applyTemplateOpen} onClose={() => setApplyTemplateOpen(false)} title="Apply Template">
        <div className="space-y-2">
          {templates.map(tmpl => (
            <button key={tmpl.id} onClick={() => applyTemplate(tmpl)} className="pressable w-full flex items-center justify-between bg-surface-2 rounded-xl p-4">
              <div><p className="text-sm font-medium text-foreground">{tmpl.name}</p><p className="text-xs text-muted">{(tmpl.tasks as unknown[]).length} tasks</p></div>
              <ChevronRight size={16} className="text-muted" />
            </button>
          ))}
        </div>
      </BottomSheet>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && doDeleteTask(deleteConfirm)} title="Delete Task" message="This task will be permanently deleted." confirmLabel="Delete" danger />
    </motion.div>
  );
}
