'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Clock, Calendar, DollarSign, Palette,
  Download, Upload, Trash2, Info, ChevronRight,
  Save, Moon, Skull, Swords, Database, Shield,
} from 'lucide-react';
import { getSettings, saveSettings, exportAllData, importAllData, clearAllData, getStorageUsed } from '@/lib/storage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GripLogo } from '@/components/ui/GripLogo';
import { useToast } from '@/components/ui/Toast';
import { getDaysOnGrip } from '@/lib/utils';
import type { Settings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [storageUsed, setStorageUsed] = useState('0 KB');
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      setStorageUsed(getStorageUsed());
      setLoaded(true);
    })();
  }, []);

  const update = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grip-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const updated = { ...settings, lastExportDate: new Date().toISOString().split('T')[0] };
    setSettings(updated);
    await saveSettings(updated);
    showToast('Data exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await importAllData(reader.result as string);
          const s = await getSettings();
          setSettings(s);
          setStorageUsed(getStorageUsed());
          showToast('Data imported successfully');
        } catch {
          showToast('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = async () => {
    await clearAllData();
    setSettings(DEFAULT_SETTINGS);
    showToast('All data cleared');
  };

  if (!loaded) {
    return <div className="p-5 space-y-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>;
  }

  const daysOnGrip = getDaysOnGrip(settings.firstUseDate);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <GripLogo compact className="opacity-40" />
      </div>

      {/* Profile */}
      <Section title="Profile" icon={<User size={18} />}>
        <Field label="Your Name">
          <input type="text" value={settings.name} onChange={e => update('name', e.target.value)} placeholder="Enter your name" />
        </Field>
        <Field label="Wake Time">
          <input type="time" value={settings.wakeTime} onChange={e => update('wakeTime', e.target.value)} />
        </Field>
        <Field label="Sleep Time">
          <input type="time" value={settings.sleepTime} onChange={e => update('sleepTime', e.target.value)} />
        </Field>
      </Section>

      {/* Planner */}
      <Section title="Planner" icon={<Calendar size={18} />}>
        <Field label="Time Slot Duration">
          <div className="flex gap-3">
            {([30, 60] as const).map(d => (
              <button key={d} onClick={() => update('slotDuration', d)}
                className={`pressable flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${settings.slotDuration === d ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>
                {d} min
              </button>
            ))}
          </div>
        </Field>
        <Field label="Week Starts On">
          <div className="flex gap-3">
            {([{ value: 1, label: 'Monday' }, { value: 0, label: 'Sunday' }] as const).map(({ value, label }) => (
              <button key={value} onClick={() => update('weekStartDay', value)}
                className={`pressable flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${settings.weekStartDay === value ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>
                {label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Money */}
      <Section title="Money" icon={<DollarSign size={18} />}>
        <Field label="Currency">
          <input type="text" value={settings.currency} onChange={e => update('currency', e.target.value)} placeholder="PKR" />
        </Field>
        <Field label="Monthly Income Target">
          <input type="number" value={settings.monthlyIncomeTarget || ''} onChange={e => update('monthlyIncomeTarget', Number(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Savings Goal">
          <input type="number" value={settings.savingsGoal || ''} onChange={e => update('savingsGoal', Number(e.target.value))} placeholder="0" />
        </Field>
      </Section>

      {/* Graveyard Equivalents */}
      <Section title="Waste Equivalents" icon={<Skull size={18} />}>
        <p className="text-xs text-muted -mt-1">Used to show what your wasted money could have bought</p>
        <Field label={`Average Meal Cost (${settings.currency})`}>
          <input type="number" value={settings.avgMealCost || ''} onChange={e => update('avgMealCost', Number(e.target.value))} placeholder="500" />
        </Field>
        <Field label={`Monthly Subscription (${settings.currency})`}>
          <input type="number" value={settings.monthlySubscriptionCost || ''} onChange={e => update('monthlySubscriptionCost', Number(e.target.value))} placeholder="1200" />
        </Field>
        <Field label={`Daily Fuel Cost (${settings.currency})`}>
          <input type="number" value={settings.dailyFuelCost || ''} onChange={e => update('dailyFuelCost', Number(e.target.value))} placeholder="800" />
        </Field>
      </Section>

      {/* Weekly Report */}
      <Section title="Weekly Report" icon={<Swords size={18} />}>
        <Field label="Report Day">
          <select value={settings.weeklyReportDay} onChange={e => update('weeklyReportDay', Number(e.target.value) as Settings['weeklyReportDay'])}
            className="w-full bg-surface-2 text-foreground rounded-xl py-3 px-4 text-sm border-none outline-none">
            {WEEKDAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
          </select>
        </Field>
      </Section>

      {/* Theme */}
      <Section title="Theme" icon={<Palette size={18} />}>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-muted" />
            <span className="text-sm text-foreground">Dark Mode</span>
          </div>
          <div className="w-12 h-7 rounded-full bg-accent flex items-center justify-end px-1">
            <div className="w-5 h-5 rounded-full bg-white" />
          </div>
        </div>
        <p className="text-xs text-muted">Light mode coming soon</p>
      </Section>

      {/* Data Management */}
      <Section title="Data" icon={<Database size={18} />}>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{daysOnGrip}</p>
            <p className="text-[10px] text-muted">Days on GRIP</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{storageUsed}</p>
            <p className="text-[10px] text-muted">Storage Used</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-foreground">{settings.lastExportDate || 'Never'}</p>
            <p className="text-[10px] text-muted">Last Export</p>
          </div>
        </div>
        <button onClick={handleExport} className="pressable flex items-center justify-between w-full py-3">
          <div className="flex items-center gap-3"><Download size={18} className="text-accent" /><span className="text-sm text-foreground">Export Data</span></div>
          <ChevronRight size={16} className="text-muted" />
        </button>
        <div className="h-px bg-border" />
        <button onClick={handleImport} className="pressable flex items-center justify-between w-full py-3">
          <div className="flex items-center gap-3"><Upload size={18} className="text-accent" /><span className="text-sm text-foreground">Import Data</span></div>
          <ChevronRight size={16} className="text-muted" />
        </button>
        <div className="h-px bg-border" />
        <button onClick={() => setClearDialogOpen(true)} className="pressable flex items-center justify-between w-full py-3">
          <div className="flex items-center gap-3"><Trash2 size={18} className="text-danger" /><span className="text-sm text-danger">Clear All Data</span></div>
          <ChevronRight size={16} className="text-muted" />
        </button>
      </Section>

      {/* About */}
      <Section title="About" icon={<Info size={18} />}>
        <div className="flex justify-center mb-3">
          <GripLogo />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-sm text-muted">Version</span><span className="text-sm text-foreground">2.0.0</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted">Built by</span><span className="text-sm text-foreground">projekts.pk</span></div>
        </div>
      </Section>

      <div className="h-4" />

      <ConfirmDialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)} onConfirm={handleClear}
        title="Clear All Data" message="Are you sure? This cannot be undone. All tasks, addictions, transactions, and settings will be permanently deleted."
        confirmLabel="Clear Everything" danger />
    </motion.div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">{title}</h2>
      </div>
      <div className="bg-surface rounded-2xl p-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}
