// Pure helpers for the historical rainfall analysis. All inputs are real daily
// rainfall values; nothing here invents data — missing days stay null.

/** IMD 24-hour rainfall categories (mm). */
export const IMD = { heavy: 64.5, veryHeavy: 115.6, extreme: 204.5 } as const;

/** Simple baseline: flag a day when its rain reaches IMD "heavy". */
export const BASELINE_MM = IMD.heavy;
/** MeghDrishti history rule: day rain + half of the previous 3 days' rain. */
export const RULE_THRESHOLD = 100;
export const RULE_ANTECEDENT_WEIGHT = 0.5;

export type Daily = { date: string; mm: number | null };
export type RainCategory = "none" | "heavy" | "veryHeavy" | "extreme";

const DAY = 86_400_000;

export function expand(start: string, mm: (number | null)[]): Daily[] {
  const t0 = Date.parse(`${start}T00:00:00Z`);
  return mm.map((v, i) => ({ date: new Date(t0 + i * DAY).toISOString().slice(0, 10), mm: v }));
}

export function category(mm: number | null): RainCategory {
  if (mm == null) return "none";
  if (mm >= IMD.extreme) return "extreme";
  if (mm >= IMD.veryHeavy) return "veryHeavy";
  if (mm >= IMD.heavy) return "heavy";
  return "none";
}

export function byYear(days: Daily[]): Map<number, Daily[]> {
  const m = new Map<number, Daily[]>();
  for (const d of days) {
    const y = +d.date.slice(0, 4);
    if (!m.has(y)) m.set(y, []);
    m.get(y)!.push(d);
  }
  return m;
}

export type YearStats = {
  total: number;
  days: number;
  missing: number;
  peak: { date: string; mm: number } | null;
  heavyDays: number;
  veryHeavyDays: number;
};

export function yearStats(days: Daily[]): YearStats {
  let total = 0, missing = 0, heavyDays = 0, veryHeavyDays = 0;
  let peak: YearStats["peak"] = null;
  for (const d of days) {
    if (d.mm == null) { missing++; continue; }
    total += d.mm;
    if (d.mm >= IMD.heavy) heavyDays++;
    if (d.mm >= IMD.veryHeavy) veryHeavyDays++;
    if (!peak || d.mm > peak.mm) peak = { date: d.date, mm: d.mm };
  }
  return { total, days: days.length, missing, peak, heavyDays, veryHeavyDays };
}

/** 12 monthly totals; null for a month with no data at all. */
export function monthlyTotals(days: Daily[]): (number | null)[] {
  const out: (number | null)[] = Array(12).fill(null);
  for (const d of days) {
    if (d.mm == null) continue;
    const m = +d.date.slice(5, 7) - 1;
    out[m] = (out[m] ?? 0) + d.mm;
  }
  return out;
}

export function isCompleteYear(year: number, days: Daily[] | undefined) {
  if (!days) return false;
  const len = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY;
  return days.length === len && days.every((d) => d.mm != null);
}

/** Mean monthly totals over complete years only. */
export function monthlyClimatology(groups: Map<number, Daily[]>): number[] {
  const sums = Array(12).fill(0) as number[];
  let n = 0;
  for (const [y, days] of groups) {
    if (!isCompleteYear(y, days)) continue;
    n++;
    monthlyTotals(days).forEach((v, i) => (sums[i]! += v ?? 0));
  }
  return n ? sums.map((s) => s / n) : sums;
}

export type Season = { year: number; total: number; complete: boolean; pct: number | null };

/** June–September (monsoon) totals per year with % anomaly vs mean of complete seasons. */
export function monsoonSeasons(groups: Map<number, Daily[]>): Season[] {
  const rows: Omit<Season, "pct">[] = [];
  for (const [year, days] of groups) {
    const js = days.filter((d) => { const m = +d.date.slice(5, 7); return m >= 6 && m <= 9; });
    if (!js.length) continue;
    const complete = js.length === 122 && js.every((d) => d.mm != null);
    rows.push({ year, total: js.reduce((a, d) => a + (d.mm ?? 0), 0), complete });
  }
  const full = rows.filter((r) => r.complete);
  const mean = full.length ? full.reduce((a, r) => a + r.total, 0) / full.length : 0;
  return rows
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ ...r, pct: r.complete && mean ? ((r.total - mean) / mean) * 100 : null }));
}

export function seasonMean(seasons: Season[]) {
  const full = seasons.filter((s) => s.complete);
  return full.length ? full.reduce((a, s) => a + s.total, 0) / full.length : 0;
}

/** Rule score for day i: rain that day + weight × previous 3 days. Null if the day is missing. */
export function ruleScore(days: Daily[], i: number): number | null {
  const today = days[i]?.mm;
  if (today == null) return null;
  let prev = 0;
  for (let k = 1; k <= 3; k++) prev += days[i - k]?.mm ?? 0;
  return today + RULE_ANTECEDENT_WEIGHT * prev;
}

export type EventCheck = {
  gridMax: number | null;
  gridDate: string | null;
  ruleMax: number | null;
  baselineHit: boolean | null;
  ruleHit: boolean | null;
};

/** Hindcast both methods over an event's rain window [start, end] (inclusive dates). */
export function checkWindow(days: Daily[], index: Map<string, number>, start: string, end: string): EventCheck {
  let gridMax: number | null = null, gridDate: string | null = null, ruleMax: number | null = null;
  const t0 = Date.parse(`${start}T00:00:00Z`), t1 = Date.parse(`${end}T00:00:00Z`);
  for (let t = t0; t <= t1; t += DAY) {
    const i = index.get(new Date(t).toISOString().slice(0, 10));
    if (i == null) continue;
    const mm = days[i]!.mm;
    if (mm != null && (gridMax == null || mm > gridMax)) { gridMax = mm; gridDate = days[i]!.date; }
    const s = ruleScore(days, i);
    if (s != null && (ruleMax == null || s > ruleMax)) ruleMax = s;
  }
  return {
    gridMax, gridDate, ruleMax,
    baselineHit: gridMax == null ? null : gridMax >= BASELINE_MM,
    ruleHit: ruleMax == null ? null : ruleMax >= RULE_THRESHOLD,
  };
}

/** How many monsoon days (complete seasons) each method flags — a false-alarm proxy. */
export function monsoonFlagCounts(days: Daily[], completeYears: Set<number>) {
  let seasonDays = 0, baseline = 0, rule = 0;
  days.forEach((d, i) => {
    const y = +d.date.slice(0, 4), m = +d.date.slice(5, 7);
    if (!completeYears.has(y) || m < 6 || m > 9 || d.mm == null) return;
    seasonDays++;
    if (d.mm >= BASELINE_MM) baseline++;
    if ((ruleScore(days, i) ?? 0) >= RULE_THRESHOLD) rule++;
  });
  return { seasonDays, baseline, rule };
}
