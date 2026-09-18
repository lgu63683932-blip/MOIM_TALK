export function formatWon(amount: number): string {
  return `${amount < 0 ? "-" : ""}₩${Math.abs(amount).toLocaleString("ko-KR")}`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function recentMonths(count: number): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function monthChipLabel(month: string): string {
  const [y, m] = month.split("-");
  const curYear = new Date().getFullYear();
  return Number(y) === curYear ? `${Number(m)}월` : `${y.slice(2)}.${m}`;
}

export function formatMonthsRemark(months: string[]): string {
  const sorted = [...months].sort();
  const byYear = new Map<string, number[]>();
  for (const m of sorted) {
    const [y, mm] = m.split("-");
    const arr = byYear.get(y) ?? [];
    arr.push(Number(mm));
    byYear.set(y, arr);
  }
  return Array.from(byYear.entries())
    .map(([y, ms]) => `${y}년${ms.map((n) => `${n}월`).join(",")}`)
    .join(", ");
}

export function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}
