export const fmtBRL = (cents: number) =>
  'R$ ' + (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtQty = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 4 });

export const fmtPct = (x: number) =>
  (x * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

export const fmtDate = (iso: string) => {
  if (!iso) return '—';
  const p = iso.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
};

export const daysUntil = (iso: string): number | null => {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
};

export const vigStatus = (vigFim: string): 'vigente' | 'vencendo' | 'vencida' => {
  const d = daysUntil(vigFim);
  if (d === null) return 'vigente';
  if (d < 0) return 'vencida';
  if (d <= 30) return 'vencendo';
  return 'vigente';
};

export const parseCents = (s: string): number => {
  const clean = String(s ?? '').replace(/\s/g, '').replace(/r\$/gi, '').replace(/\./g, '').replace(',', '.');
  const v = Number(clean);
  return Number.isFinite(v) ? Math.round(v * 100) : 0;
};

export const centsToDisplay = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
