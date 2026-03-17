'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import {
  Plus, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, AlertTriangle, Skull, UtensilsCrossed, Tv, Fuel, PiggyBank,
} from 'lucide-react';
import * as Icons from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap = Icons as unknown as Record<string, React.ComponentType<any>>;
import { getSettings, getTransactions, createTransaction, deleteTransaction } from '@/lib/storage';
import { formatCurrency, todayISO, haptic } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEFAULT_SETTINGS } from '@/lib/constants';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { nanoid } from 'nanoid';
import type { Transaction, TransactionType, TransactionTag, ExpenseCategory, IncomeCategory, Settings } from '@/lib/types';

export default function MoneyPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast } = useToast();

  // Form
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('food');
  const [tag, setTag] = useState<TransactionTag>('necessary');
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(todayISO());

  const loadData = useCallback(async () => {
    const [s, t] = await Promise.all([getSettings(), getTransactions()]);
    setSettings(s); setTransactions(t);
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const currency = settings.currency || 'PKR';

  // Monthly data
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthTxs = transactions.filter((t) => {
    const d = parseISO(t.date);
    return d >= monthStart && d <= monthEnd;
  });
  const monthIncome = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthSaved = monthIncome - monthExpenses;
  const monthWasted = monthTxs.filter((t) => t.type === 'expense' && t.tag === 'wasteful').reduce((s, t) => s + t.amount, 0);

  // Graveyard equivalents
  const graveyardMeals = settings.avgMealCost > 0 ? Math.floor(monthWasted / settings.avgMealCost) : 0;
  const graveyardSubs = settings.monthlySubscriptionCost > 0 ? Math.round((monthWasted / settings.monthlySubscriptionCost) * 10) / 10 : 0;
  const graveyardFuel = settings.dailyFuelCost > 0 ? Math.round((monthWasted / settings.dailyFuelCost) * 10) / 10 : 0;
  const graveyardSavingsPct = settings.savingsGoal > 0 ? Math.round((monthWasted / settings.savingsGoal) * 100) : 0;

  // Group by date
  const grouped = monthTxs.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Weekly spending comparison
  const thisWeekSpend = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'))
    .reduce((sum, d) => sum + transactions.filter((t) => t.date === d && t.type === 'expense').reduce((s, t) => s + t.amount, 0), 0);
  const lastWeekSpend = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i + 7), 'yyyy-MM-dd'))
    .reduce((sum, d) => sum + transactions.filter((t) => t.date === d && t.type === 'expense').reduce((s, t) => s + t.amount, 0), 0);

  // Category breakdown
  const categoryBreakdown = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: monthTxs.filter((t) => t.type === 'expense' && t.category === c.value).reduce((s, t) => s + t.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  // Daily spending last 7 days
  const dailySpending = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const total = transactions.filter((t) => t.date === d && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { date: d, total, day: format(subDays(new Date(), 6 - i), 'EEE') };
  });
  const maxDaily = Math.max(...dailySpending.map((d) => d.total), 1);

  const addTransaction = async () => {
    if (!amount || Number(amount) <= 0) return;
    haptic();
    const newTx = await createTransaction({ id: nanoid(), amount: Number(amount), type: txType, category, tag: txType === 'income' ? 'useful' : tag, note, date: txDate });
    setTransactions([...transactions, newTx]);
    setFormOpen(false);
    setAmount('');
    setNote('');
    if (txType === 'expense' && tag === 'wasteful') {
      showToast(`${currency} ${Number(amount).toLocaleString()} wasted`, 'error');
    } else {
      showToast(txType === 'income' ? 'Income added' : 'Expense logged');
    }
  };

  const deleteTx = async (id: string) => {
    haptic();
    await deleteTransaction(id);
    setTransactions(transactions.filter((t) => t.id !== id));
    showToast('Transaction deleted');
  };

  if (!loaded) {
    return <div className="p-5 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Money</h1>

      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} className="pressable p-2 rounded-xl bg-surface"><ChevronLeft size={18} className="text-muted" /></button>
        <span className="text-sm font-semibold text-foreground">{format(selectedMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="pressable p-2 rounded-xl bg-surface"><ChevronRight size={18} className="text-muted" /></button>
      </div>

      {/* Balance Overview */}
      <div className="bg-surface rounded-2xl p-5 space-y-4">
        <div className="text-center">
          <p className="text-xs text-muted mb-1">Balance</p>
          <p className={`text-3xl font-bold ${monthSaved >= 0 ? 'text-accent' : 'text-danger'}`}>
            <AnimatedNumber value={monthSaved} prefix={`${currency} `} />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1"><ArrowDownRight size={14} className="text-accent" /><span className="text-xs text-muted">Income</span></div>
            <p className="text-sm font-semibold text-accent">{formatCurrency(monthIncome, currency)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1"><ArrowUpRight size={14} className="text-danger" /><span className="text-xs text-muted">Expenses</span></div>
            <p className="text-sm font-semibold text-danger">{formatCurrency(monthExpenses, currency)}</p>
          </div>
        </div>
      </div>

      {/* GRAVEYARD */}
      {monthWasted > 0 && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Skull size={18} className="text-danger" />
              <h3 className="text-sm font-bold text-danger uppercase tracking-wider">Graveyard</h3>
            </div>
            <p className="text-3xl font-black text-danger mb-1">
              <AnimatedNumber value={monthWasted} prefix={`${currency} `} />
            </p>
            <p className="text-xs text-danger/60 mb-4">wasted this month</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <UtensilsCrossed size={14} className="text-muted shrink-0" />
                <span className="text-foreground/70">{graveyardMeals} meals</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Tv size={14} className="text-muted shrink-0" />
                <span className="text-foreground/70">{graveyardSubs} months of subscriptions</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Fuel size={14} className="text-muted shrink-0" />
                <span className="text-foreground/70">{graveyardFuel} days of fuel</span>
              </div>
              {graveyardSavingsPct > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <PiggyBank size={14} className="text-muted shrink-0" />
                  <span className="text-foreground/70">{graveyardSavingsPct}% of your savings goal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Comparison */}
      <div className="bg-surface rounded-2xl p-4">
        <p className="text-xs text-muted mb-3">This week vs last week</p>
        <div className="flex items-center gap-3">
          <div className="flex-1"><p className="text-xs text-muted">This week</p><p className="text-sm font-semibold text-foreground">{formatCurrency(thisWeekSpend, currency)}</p></div>
          <div className="flex-1"><p className="text-xs text-muted">Last week</p><p className="text-sm font-semibold text-foreground">{formatCurrency(lastWeekSpend, currency)}</p></div>
          <div>{thisWeekSpend < lastWeekSpend ? <TrendingDown size={20} className="text-accent" /> : thisWeekSpend > lastWeekSpend ? <TrendingUp size={20} className="text-danger" /> : <Minus size={20} className="text-muted" />}</div>
        </div>
      </div>

      {/* Daily Bar Chart */}
      <div className="bg-surface rounded-2xl p-4">
        <p className="text-xs text-muted mb-3">Daily spending (last 7 days)</p>
        <div className="flex items-end gap-2 h-24">
          {dailySpending.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <motion.div className="w-full rounded-t-md bg-accent/60" initial={{ height: 0 }} animate={{ height: `${(d.total / maxDaily) * 80}px` }}
                transition={{ duration: 0.5, delay: 0.1 }} style={{ minHeight: d.total > 0 ? 4 : 0 }} />
              <span className="text-[9px] text-muted">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-surface rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">Spending by category</p>
          <div className="space-y-3">
            {categoryBreakdown.map((c) => {
              const IC = IconMap[c.icon] || Icons.MoreHorizontal;
              const pct = monthExpenses > 0 ? (c.total / monthExpenses) * 100 : 0;
              return (
                <div key={c.value} className="flex items-center gap-3">
                  <IC size={16} className="text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1"><span className="text-xs text-foreground">{c.label}</span><span className="text-xs text-muted">{formatCurrency(c.total, currency)}</span></div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Button */}
      <button onClick={() => { setTxType('expense'); setCategory('food'); setFormOpen(true); }}
        className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2">
        <Plus size={16} /> Add Transaction
      </button>

      {/* Transaction List */}
      {sortedDates.length === 0 ? (
        <EmptyState icon="Wallet" message="No transactions this month" actionLabel="Add Transaction" onAction={() => setFormOpen(true)} />
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              <p className="text-xs text-muted mb-2">{format(parseISO(date), 'EEEE, MMM d')}</p>
              <div className="space-y-1.5">
                {grouped[date].map((tx) => {
                  const cats = tx.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                  const cat = cats.find((c) => c.value === tx.category);
                  const IC = cat ? IconMap[cat.icon] || Icons.MoreHorizontal : Icons.MoreHorizontal;
                  return (
                    <motion.div key={tx.id} layout className="bg-surface rounded-xl p-3 flex items-center gap-3" onClick={() => setDeleteConfirm(tx.id)}>
                      <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center shrink-0"><IC size={16} className="text-muted" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{tx.note || cat?.label || tx.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.type === 'expense' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tx.tag === 'wasteful' ? 'bg-danger/20 text-danger' : tx.tag === 'useful' ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'}`}>{tx.tag}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-accent' : 'text-danger'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />

      {/* Add Form */}
      <BottomSheet open={formOpen} onClose={() => setFormOpen(false)} title="Add Transaction">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setTxType('expense'); setCategory('food'); }} className={`pressable flex-1 py-2.5 rounded-xl text-sm font-medium ${txType === 'expense' ? 'bg-danger text-white' : 'bg-surface-2 text-muted'}`}>Expense</button>
            <button onClick={() => { setTxType('income'); setCategory('salary'); }} className={`pressable flex-1 py-2.5 rounded-xl text-sm font-medium ${txType === 'income' ? 'bg-accent text-white' : 'bg-surface-2 text-muted'}`}>Income</button>
          </div>
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl font-bold text-center" />
          <div className="space-y-2">
            <label className="text-xs text-muted">Category</label>
            <div className="flex flex-wrap gap-2">{(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => <Chip key={c.value} label={c.label} selected={category === c.value} onClick={() => setCategory(c.value)} />)}</div>
          </div>
          {txType === 'expense' && (<div className="space-y-2"><label className="text-xs text-muted">Tag</label><div className="flex gap-2">{(['useful', 'necessary', 'wasteful'] as const).map((t) => <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} selected={tag === t} color={t === 'wasteful' ? '#EF4444' : t === 'useful' ? '#10B981' : '#F59E0B'} onClick={() => setTag(t)} />)}</div></div>)}
          <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="space-y-1"><label className="text-xs text-muted">Date</label><input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="color-scheme-dark" /></div>
          <button onClick={addTransaction} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">{txType === 'income' ? 'Add Income' : 'Log Expense'}</button>
        </div>
      </BottomSheet>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && deleteTx(deleteConfirm)}
        title="Delete Transaction" message="This transaction will be permanently deleted." confirmLabel="Delete" danger />
    </motion.div>
  );
}
