import type { ScheduledPayment } from '../types';

const STORAGE_KEY = 'stellarflow:scheduled';

export function getScheduled(): ScheduledPayment[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

export function saveScheduled(payments: ScheduledPayment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

export function addScheduled(p: Omit<ScheduledPayment, 'id' | 'createdAt' | 'executionLog'>): ScheduledPayment {
  const all = getScheduled();
  const entry: ScheduledPayment = {
    ...p,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    executionLog: [],
  };
  saveScheduled([...all, entry]);
  return entry;
}

export function updateScheduled(id: string, patch: Partial<ScheduledPayment>): void {
  const all = getScheduled().map(p => p.id === id ? { ...p, ...patch } : p);
  saveScheduled(all);
}

export function deleteScheduled(id: string): void {
  saveScheduled(getScheduled().filter(p => p.id !== id));
}

export function getNextRun(frequency: ScheduledPayment['frequency'], from: Date = new Date()): string {
  const d = new Date(from);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function isDue(p: ScheduledPayment): boolean {
  return p.enabled && new Date(p.nextRun) <= new Date();
}

export function formatFrequency(f: ScheduledPayment['frequency']): string {
  return { daily: 'Every day', weekly: 'Every week', monthly: 'Every month' }[f];
}

export function formatNextRun(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return 'Due now';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h`;
  return 'in < 1h';
}
