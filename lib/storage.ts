import { DEFAULT_SETTINGS } from './constants';
import type { Settings, Task, Addiction, AddictionLog, Transaction, DayTemplate, Milestone, DailyReview } from './types';

// ============================================================
// API-backed storage layer (Neon PostgreSQL via Prisma)
// All functions are async — pages must await them
// ============================================================

const API = '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function putJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function deleteAPI(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

// ============================================================
// Settings
// ============================================================

export async function getSettings(): Promise<Settings> {
  try {
    const s = await fetchJSON<Settings>(`${API}/settings`);
    return { ...DEFAULT_SETTINGS, ...s };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await putJSON(`${API}/settings`, settings);
}

// ============================================================
// Tasks
// ============================================================

export async function getTasks(userId: string = 'zeeshan'): Promise<Task[]> {
  try { return await fetchJSON<Task[]>(`${API}/tasks?userId=${userId}`); } catch { return []; }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  // Bulk save: we send each task individually
  // For efficiency, we just do a simple approach
  void tasks; // handled by individual create/update calls
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Task> {
  return postJSON<Task>(`${API}/tasks`, task);
}

export async function updateTask(task: Partial<Task> & { id: string }): Promise<Task> {
  return putJSON<Task>(`${API}/tasks`, task);
}

export async function deleteTask(id: string): Promise<void> {
  await deleteAPI(`${API}/tasks?id=${id}`);
}

// ============================================================
// Addictions
// ============================================================

export async function getAddictions(userId: string = 'zeeshan'): Promise<Addiction[]> {
  try { return await fetchJSON<Addiction[]>(`${API}/addictions?userId=${userId}`); } catch { return []; }
}

export async function saveAddictions(addictions: Addiction[]): Promise<void> {
  void addictions;
}

export async function createAddiction(addiction: Omit<Addiction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Addiction> {
  return postJSON<Addiction>(`${API}/addictions`, addiction);
}

export async function updateAddiction(addiction: Partial<Addiction> & { id: string }): Promise<Addiction> {
  return putJSON<Addiction>(`${API}/addictions`, addiction);
}

export async function deleteAddiction(id: string): Promise<void> {
  await deleteAPI(`${API}/addictions?id=${id}`);
}

// ============================================================
// Addiction Logs
// ============================================================

export async function getAddictionLogs(): Promise<AddictionLog[]> {
  try { return await fetchJSON<AddictionLog[]>(`${API}/addiction-logs`); } catch { return []; }
}

export async function saveAddictionLogs(logs: AddictionLog[]): Promise<void> {
  void logs;
}

export async function createAddictionLog(log: { addictionId: string; timestamp: string; note: string }): Promise<AddictionLog> {
  return postJSON<AddictionLog>(`${API}/addiction-logs`, log);
}

export async function deleteAddictionLogsByAddiction(addictionId: string): Promise<void> {
  await deleteAPI(`${API}/addiction-logs?id=by-addiction&addictionId=${addictionId}`);
}

// ============================================================
// Transactions
// ============================================================

export async function getTransactions(): Promise<Transaction[]> {
  try { return await fetchJSON<Transaction[]>(`${API}/transactions`); } catch { return []; }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  void transactions;
}

export async function createTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction> {
  return postJSON<Transaction>(`${API}/transactions`, tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteAPI(`${API}/transactions?id=${id}`);
}

// ============================================================
// Templates
// ============================================================

export async function getTemplates(userId: string = 'zeeshan'): Promise<DayTemplate[]> {
  try { return await fetchJSON<DayTemplate[]>(`${API}/templates?userId=${userId}`); } catch { return []; }
}

export async function saveTemplates(templates: DayTemplate[]): Promise<void> {
  void templates;
}

export async function createTemplate(template: { name: string; tasks: unknown; userId: string }): Promise<DayTemplate> {
  return postJSON<DayTemplate>(`${API}/templates`, template);
}

export async function deleteTemplate(id: string): Promise<void> {
  await deleteAPI(`${API}/templates?id=${id}`);
}

// ============================================================
// Milestones
// ============================================================

export async function getMilestones(): Promise<Milestone[]> {
  try { return await fetchJSON<Milestone[]>(`${API}/milestones`); } catch { return []; }
}

export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  void milestones;
}

export async function createMilestone(milestone: { addictionId: string; type: string; days: number }): Promise<Milestone> {
  return postJSON<Milestone>(`${API}/milestones`, milestone);
}

// ============================================================
// Reviews
// ============================================================

export async function getReviews(userId: string = 'zeeshan'): Promise<DailyReview[]> {
  try { return await fetchJSON<DailyReview[]>(`${API}/reviews?userId=${userId}`); } catch { return []; }
}

export async function saveReviews(reviews: DailyReview[]): Promise<void> {
  void reviews;
}

export async function createOrUpdateReview(review: Omit<DailyReview, 'createdAt' | 'id'> & { id?: string }): Promise<DailyReview> {
  return postJSON<DailyReview>(`${API}/reviews`, review);
}

// ============================================================
// Export / Import / Clear (still JSON-based for portability)
// ============================================================

export async function exportAllData(): Promise<string> {
  const [tasks, addictions, logs, transactions, templates, milestones, reviews, settings] = await Promise.all([
    getTasks(), getAddictions(), getAddictionLogs(), getTransactions(),
    getTemplates(), getMilestones(), getReviews(), getSettings(),
  ]);
  return JSON.stringify({ tasks, addictions, logs, transactions, templates, milestones, reviews, settings }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  // Import each entity type via API
  if (data.settings) await saveSettings(data.settings);
  if (data.tasks) for (const t of data.tasks) await createTask(t).catch(() => {});
  if (data.addictions) for (const a of data.addictions) await createAddiction(a).catch(() => {});
  if (data.logs) for (const l of data.logs) await createAddictionLog(l).catch(() => {});
  if (data.transactions) for (const t of data.transactions) await createTransaction(t).catch(() => {});
  if (data.templates) for (const t of data.templates) await createTemplate(t).catch(() => {});
  if (data.milestones) for (const m of data.milestones) await createMilestone(m).catch(() => {});
  if (data.reviews) for (const r of data.reviews) await createOrUpdateReview(r).catch(() => {});
}

export async function clearAllData(): Promise<void> {
  // Delete in dependency order
  const [tasks, logs, milestones, transactions, templates, reviews, addictions] = await Promise.all([
    getTasks(), getAddictionLogs(), getMilestones(), getTransactions(),
    getTemplates(), getReviews(), getAddictions(),
  ]);
  for (const t of tasks) await deleteTask(t.id).catch(() => {});
  for (const a of addictions) await deleteAddiction(a.id).catch(() => {}); // cascades logs + milestones
  for (const t of transactions) await deleteTransaction(t.id).catch(() => {});
  for (const t of templates) await deleteTemplate(t.id).catch(() => {});
  for (const r of reviews) await deleteAPI(`${API}/reviews?id=${r.id}`).catch(() => {});
}

// ============================================================
// Storage size (not applicable with DB, but keep compat)
// ============================================================

export function getStorageUsed(): string {
  return 'Cloud DB';
}
