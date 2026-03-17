'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Trash2, TrendingUp, TrendingDown, Crown, Swords, ChevronLeft, ChevronRight, Wallet, X } from 'lucide-react';
import * as Icons from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap = Icons as unknown as Record<string, React.ComponentType<any>>;
import { getSettings, getTransactions, createTransaction, deleteTransaction } from '@/lib/storage';
import { todayISO, formatCurrency, haptic } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useUser } from '@/lib/UserContext';
import { UserBadge } from '@/components/ui/UserBadge';
import { USERS } from '@/lib/users';
import type { Transaction, TransactionType, TransactionTag, ExpenseCategory, IncomeCategory, Settings } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────
const MONTH_FMT = 'yyyy-MM';
function monthOf(d: string) { return d.slice(0, 7); }

export default function MoneyPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [viewMonth, setViewMonth] = useState(format(new Date(), MONTH_FMT));
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user } = useUser();
  const userId = user?.id || 'zeeshan';

  // form state
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('food');
  const [tag, setTag] = useState<TransactionTag>('necessary');
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(todayISO());

  const loadData = useCallback(async () => {
    const [txs, s] = await Promise.all([getTransactions(), getSettings()]);
    setTransactions(txs); setSettings(s);
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const monthTxs = transactions.filter(t => monthOf(t.date) === viewMonth);
  const currency = settings?.currency || 'PKR';

  // ─── Joint totals ─────────────────────────────────────────
  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalWasted = monthTxs.filter(t => t.type === 'expense' && t.tag === 'wasteful').reduce((s, t) => s + t.amount, 0);

  // ─── Per-user stats ────────────────────────────────────────
  const perUser = USERS.map(u => {
    const uTxs = monthTxs.filter(t => t.madeBy === u.id);
    const income = uTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const spent = uTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const wasted = uTxs.filter(t => t.type === 'expense' && t.tag === 'wasteful').reduce((s, t) => s + t.amount, 0);
    return { ...u, income, spent, wasted };
  });
  const [zee, mar] = perUser;

  const incomeWinner = zee.income > mar.income ? zee : mar.income > zee.income ? mar : null;
  const spendWinner = zee.spent < mar.spent ? zee : mar.spent < zee.spent ? mar : null; // less spending = winner

  // ─── Navigation ───────────────────────────────────────────
  const prevMonth = () => {
    const d = parseISO(viewMonth + '-01');
    setViewMonth(format(subDays(d, 1), MONTH_FMT));
  };
  const nextMonth = () => {
    const d = parseISO(viewMonth + '-01');
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    setViewMonth(format(next, MONTH_FMT));
  };

  // ─── Add transaction ──────────────────────────────────────
  const addTransaction = async () => {
    if (!amount || Number(amount) <= 0) return;
    haptic();
    const newTx = await createTransaction({
      madeBy: userId,
      amount: Number(amount),
      type: txType,
      category,
      tag: txType === 'income' ? 'useful' : tag,
      note,
      date: txDate,
    });
    setTransactions([...transactions, newTx]);
    setFormOpen(false);
    setAmount(''); setNote(''); setTxDate(todayISO());
    showToast(txType === 'income' ? 'Income added' : 'Expense logged');
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(transactions.filter(t => t.id !== id));
    showToast('Deleted');
  };

  // ─── Sort newest first ────────────────────────────────────
  const sortedTxs = [...monthTxs].sort((a, b) => b.date.localeCompare(a.date));

  if (!loaded || !settings) {
    return <div className="p-5 space-y-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>;
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-4 pb-6">

        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="pressable p-2 rounded-xl bg-surface"><ChevronLeft size={18} className="text-muted" /></button>
          <h2 className="text-base font-bold text-foreground">
            {format(parseISO(viewMonth + '-01'), 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="pressable p-2 rounded-xl bg-surface"><ChevronRight size={18} className="text-muted" /></button>
        </div>

        {/* Joint Account Summary */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={16} className="text-accent" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Joint Account</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted mb-1">Income</p>
              <p className="text-lg font-bold text-accent">{formatCurrency(totalIncome, currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted mb-1">Spent</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalExpense, currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted mb-1">Balance</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-accent' : 'text-danger'}`}>{formatCurrency(balance, currency)}</p>
            </div>
          </div>
          {totalWasted > 0 && (
            <p className="text-xs text-danger mt-3">💀 {formatCurrency(totalWasted, currency)} wasted this month</p>
          )}
        </div>

        {/* Battle: Who's Winning? */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-warning" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Battle Stats</span>
          </div>

          {/* Earnings battle */}
          <BattleRow
            label="Earning"
            leftUser={zee}
            rightUser={mar}
            leftValue={zee.income}
            rightValue={mar.income}
            currency={currency}
            higherIsBetter={true}
          />

          {/* Spending battle */}
          <BattleRow
            label="Spending"
            leftUser={zee}
            rightUser={mar}
            leftValue={zee.spent}
            rightValue={mar.spent}
            currency={currency}
            higherIsBetter={false}
          />

          {/* Wasted battle */}
          {(zee.wasted > 0 || mar.wasted > 0) && (
            <BattleRow
              label="Wasted"
              leftUser={zee}
              rightUser={mar}
              leftValue={zee.wasted}
              rightValue={mar.wasted}
              currency={currency}
              higherIsBetter={false}
            />
          )}

          {/* Winner verdict */}
          {(incomeWinner || spendWinner) && (
            <div className="pt-2 border-t border-border">
              {incomeWinner && (
                <p className="text-sm text-foreground">
                  <Crown size={14} className="inline mr-1 text-warning" />
                  <span style={{ color: incomeWinner.color }} className="font-bold">{incomeWinner.name}</span>
                  {' '}earned {formatCurrency(
                    incomeWinner.id === zee.id ? zee.income - mar.income : mar.income - zee.income,
                    currency
                  )} more this month
                </p>
              )}
              {spendWinner && (
                <p className="text-sm text-foreground mt-1">
                  <span style={{ color: spendWinner.color }} className="font-bold">{spendWinner.name}</span>
                  {' '}spent {formatCurrency(
                    spendWinner.id === zee.id ? mar.spent - zee.spent : zee.spent - mar.spent,
                    currency
                  )} less 💪
                </p>
              )}
            </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Transactions</h3>
            <span className="text-xs text-muted">{sortedTxs.length} entries</span>
          </div>

          {sortedTxs.length === 0 ? (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <Wallet size={32} className="text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted">No transactions this month</p>
            </div>
          ) : (
            sortedTxs.map(tx => {
              const CatIcon = IconMap[tx.type === 'income' ? 'TrendingUp' : 'TrendingDown'] || IconMap['Wallet'];
              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface rounded-xl p-3.5 flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-accent/10' : 'bg-surface-2'}`}>
                    <CatIcon size={16} className={tx.type === 'income' ? 'text-accent' : tx.tag === 'wasteful' ? 'text-danger' : 'text-muted'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <UserBadge userId={tx.madeBy} size="sm" />
                      <p className="text-xs text-muted capitalize truncate">{tx.category}{tx.note ? ` · ${tx.note}` : ''}</p>
                    </div>
                    <p className="text-[10px] text-muted/60 mt-0.5">{tx.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-accent' : tx.tag === 'wasteful' ? 'text-danger' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </p>
                    {tx.tag === 'wasteful' && <p className="text-[9px] text-danger">wasteful</p>}
                  </div>
                  <button onClick={() => setDeleteConfirm(tx.id)} className="pressable p-1.5 rounded-lg">
                    <Trash2 size={14} className="text-muted/40" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="pressable fixed bottom-24 right-4 w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-lg z-30"
        style={{ boxShadow: '0 0 20px rgba(20,184,166,0.4)' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Add Transaction Sheet */}
      <BottomSheet open={formOpen} onClose={() => setFormOpen(false)} title="Add Transaction">
        <div className="space-y-4">
          {/* Who's adding */}
          <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-xl">
            <UserBadge userId={userId} size="md" showName />
            <span className="text-xs text-muted">is adding this transaction</span>
          </div>

          <div className="flex gap-3">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} onClick={() => { setTxType(t); setCategory(t === 'expense' ? 'food' : 'salary'); }}
                className={`pressable flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-colors ${txType === t ? (t === 'expense' ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent') : 'bg-surface-2 text-muted'}`}>
                {t === 'expense' ? '↓ Expense' : '↑ Income'}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />
          <div className="flex flex-wrap gap-2">
            {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
              <Chip key={c.value} selected={category === c.value} onClick={() => setCategory(c.value as ExpenseCategory | IncomeCategory)} label={c.label} />
            ))}
          </div>
          {txType === 'expense' && (
            <div className="flex gap-2">
              {(['necessary', 'useful', 'wasteful'] as const).map(t => (
                <button key={t} onClick={() => setTag(t)}
                  className={`pressable flex-1 py-2 rounded-xl text-xs font-medium capitalize ${tag === t ? (t === 'wasteful' ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent') : 'bg-surface-2 text-muted'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
          <button onClick={addTransaction} className="pressable w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm">
            Add Transaction
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
        title="Delete Transaction"
        message="Remove this transaction from the joint account?"
        confirmLabel="Delete"
        danger
      />
    </>
  );
}

// ─── Battle Row Component ─────────────────────────────────────
function BattleRow({
  label, leftUser, rightUser, leftValue, rightValue, currency, higherIsBetter
}: {
  label: string;
  leftUser: typeof USERS[number];
  rightUser: typeof USERS[number];
  leftValue: number;
  rightValue: number;
  currency: string;
  higherIsBetter: boolean;
}) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPct = 100 - leftPct;

  const leftWins = higherIsBetter ? leftValue > rightValue : leftValue < rightValue;
  const rightWins = higherIsBetter ? rightValue > leftValue : rightValue < leftValue;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-1">
          {leftWins && <Crown size={10} className="text-warning" />}
          <span style={{ color: leftUser.color }} className="font-semibold">{leftUser.name}</span>
          <span className="text-muted">{formatCurrency(leftValue, currency)}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-muted">{formatCurrency(rightValue, currency)}</span>
          <span style={{ color: rightUser.color }} className="font-semibold">{rightUser.name}</span>
          {rightWins && <Crown size={10} className="text-warning" />}
        </div>
      </div>
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-l-full"
          style={{ backgroundColor: leftUser.color }}
          initial={{ width: 0 }}
          animate={{ width: `${leftPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{ backgroundColor: rightUser.color }}
          initial={{ width: 0 }}
          animate={{ width: `${rightPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
