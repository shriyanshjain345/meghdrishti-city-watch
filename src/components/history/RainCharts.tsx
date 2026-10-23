import { useState } from "react";
import { motion } from "framer-motion";
import { IMD, category, monthlyTotals, type Daily, type Season } from "@/lib/history-stats";
import { fmtDate, fmtMm, MONTHS } from "./format";

const CAT_FILL = { none: "fill-safe/55", heavy: "fill-safe", veryHeavy: "fill-warn", extreme: "fill-critical" } as const;
const CAT_TEXT = { none: "Below heavy", heavy: "Heavy (IMD)", veryHeavy: "Very heavy (IMD)", extreme: "Extremely heavy (IMD)" } as const;

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="relative flex rounded-full border border-border bg-secondary/60 p-0.5 text-xs">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className="relative z-10 rounded-full px-3 py-1 font-semibold">
          {value === o.v && (
            <motion.span layoutId={`tg-${options.map((x) => x.v).join("")}`} className="absolute inset-0 -z-10 rounded-full bg-primary/25 neon" />
          )}
          <span className={value === o.v ? "text-primary" : "text-muted-foreground"}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function RainTrendChart({
  groups, year, years, clim, eventDates,
}: { groups: Map<number, Daily[]>; year: number; years: number[]; clim: number[]; eventDates: Set<string> }) {
  const [mode, setMode] = useState<"daily" | "monthly">("daily");
  const [compare, setCompare] = useState<number | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const yearDays = groups.get(year) ?? [];

  const W = 640, H = 230, L = 40, R = 8, T = 12, B = 22;
  const iw = W - L - R, ih = H - T - B;

  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="font-bold">Rainfall trend — {year}</h3>
        <p className="text-xs text-muted-foreground">{mode === "daily" ? "Daily rainfall, June–September • tap a bar" : "Monthly totals vs average year • tap a month"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {mode === "monthly" && (
          <select
            aria-label="Compare with year"
            value={compare ?? ""}
            onChange={(e) => { setCompare(e.target.value ? +e.target.value : null); setPick(null); }}
            className="rounded-full border border-border bg-secondary px-2 py-1 text-xs"
          >
            <option value="">Compare: none</option>
            {years.filter((y) => y !== year).map((y) => <option key={y} value={y}>Compare: {y}</option>)}
          </select>
        )}
        <Toggle value={mode} onChange={(v) => { setMode(v); setPick(null); }} options={[{ v: "daily", label: "Daily" }, { v: "monthly", label: "Monthly" }]} />
      </div>
    </div>
  );

  if (!yearDays.length) return <div>{header}<p className="py-12 text-center text-sm text-muted-foreground">No rainfall data for {year}.</p></div>;

  if (mode === "daily") {
    const season = yearDays.filter((d) => { const m = +d.date.slice(5, 7); return m >= 6 && m <= 9; });
    const max = Math.max(140, ...season.map((d) => d.mm ?? 0)) * 1.08;
    const bw = iw / 122;
    const y = (v: number) => T + ih - (v / max) * ih;
    const sel = pick != null ? season[pick] : null;
    const missing = season.filter((d) => d.mm == null).length;
    return (
      <div>
        {header}
        <p className="mb-1 h-5 text-xs tabular-nums">
          {sel ? (
            <>
              <b>{fmtDate(sel.date)}</b> · {sel.mm == null ? "no data" : `${fmtMm(sel.mm, 1)} mm`} ·{" "}
              <span className={sel.mm != null && sel.mm >= IMD.veryHeavy ? "text-warn" : "text-safe"}>{CAT_TEXT[category(sel.mm)]}</span>
              {eventDates.has(sel.date) && <span className="ml-1 text-critical">· documented flood event</span>}
            </>
          ) : (
            <span className="text-muted-foreground">{season.length < 122 ? `Season data available up to ${fmtDate(season.at(-1)?.date ?? yearDays.at(-1)!.date)}` : "Tap any bar to read that day"}{missing ? ` · ${missing} days missing` : ""}</span>
          )}
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {[IMD.heavy, IMD.veryHeavy, IMD.extreme].filter((v) => v < max).map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={v === IMD.heavy ? "stroke-safe/50" : v === IMD.veryHeavy ? "stroke-warn/60" : "stroke-critical/60"} strokeDasharray="4 4" />
              <text x={L - 4} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{v}</text>
            </g>
          ))}
          <text x={L - 4} y={y(0) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">0</text>
          {season.map((d, i) => {
            const v = d.mm ?? 0;
            const h = Math.max(0.5, (v / max) * ih);
            return (
              <g key={d.date} onClick={() => setPick(i)} className="cursor-pointer">
                <rect x={L + i * bw} y={T} width={bw} height={ih} className={pick === i ? "fill-primary/15" : "fill-transparent"} />
                <motion.rect
                  key={`${year}-${d.date}`}
                  x={L + i * bw + bw * 0.12}
                  width={bw * 0.76}
                  rx={1}
                  initial={{ y: T + ih, height: 0 }}
                  animate={{ y: T + ih - h, height: h }}
                  transition={{ duration: 0.6, delay: i * 0.004, ease: "easeOut" }}
                  className={d.mm == null ? "fill-muted" : CAT_FILL[category(d.mm)]}
                />
                {eventDates.has(d.date) && (
                  <path d={`M${L + i * bw + bw / 2},${T + ih - h - 9} l4,5 l-4,5 l-4,-5 z`} className="fill-critical" />
                )}
              </g>
            );
          })}
          {[0, 30, 61, 92].map((off, k) => (
            <text key={k} x={L + off * bw + 2} y={H - 6} className="fill-muted-foreground text-[10px]">{["Jun", "Jul", "Aug", "Sep"][k]}</text>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-safe" />Heavy ≥ 64.5 mm</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-warn" />Very heavy ≥ 115.6 mm</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-critical" />Extremely heavy ≥ 204.5 mm</span>
          <span className="flex items-center gap-1"><span className="text-critical">◆</span>Documented flood event</span>
        </div>
      </div>
    );
  }

  const cur = monthlyTotals(yearDays);
  const cmp = compare != null ? monthlyTotals(groups.get(compare) ?? []) : null;
  const max = Math.max(100, ...cur.map((v) => v ?? 0), ...clim, ...(cmp ?? []).map((v) => v ?? 0)) * 1.1;
  const cw = iw / 12;
  const y = (v: number) => T + ih - (v / max) * ih;
  const cx = (i: number) => L + i * cw + cw / 2;
  const path = (arr: (number | null)[]) => {
    let d = "", pen = false;
    arr.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? "L" : "M"}${cx(i)},${y(v)} `; pen = true; });
    return d;
  };
  const step = max > 1500 ? 500 : max > 600 ? 200 : 100;
  return (
    <div>
      {header}
      <p className="mb-1 h-5 text-xs tabular-nums">
        {pick != null ? (
          <>
            <b>{MONTHS[pick]} {year}</b>: {cur[pick] == null ? "no data" : `${fmtMm(cur[pick]!)} mm`} · average {fmtMm(clim[pick] ?? 0)} mm
            {cmp && <> · <span className="text-warn">{compare}: {cmp[pick] == null ? "no data" : `${fmtMm(cmp[pick]!)} mm`}</span></>}
          </>
        ) : (
          <span className="text-muted-foreground">Tap a month to compare</span>
        )}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {Array.from({ length: Math.floor(max / step) }, (_, k) => (k + 1) * step).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-border" strokeDasharray="3 4" />
            <text x={L - 4} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{v}</text>
          </g>
        ))}
        {cur.map((v, i) => {
          const h = v == null ? 0 : (v / max) * ih;
          return (
            <g key={i} onClick={() => setPick(i)} className="cursor-pointer">
              <rect x={L + i * cw} y={T} width={cw} height={ih} className={pick === i ? "fill-primary/15" : "fill-transparent"} />
              <motion.rect
                key={`${year}-${i}`}
                x={L + i * cw + cw * 0.18}
                width={cw * 0.64}
                rx={3}
                initial={{ y: T + ih, height: 0 }}
                animate={{ y: T + ih - h, height: h }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                className={v != null && clim[i] && v > clim[i]! * 1.5 ? "fill-warn/80" : "fill-safe/80"}
              />
              <text x={cx(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">{MONTHS[i]}</text>
            </g>
          );
        })}
        <motion.path key={`clim-${year}`} d={path(clim)} fill="none" strokeWidth={2.5} className="stroke-primary" style={{ filter: "drop-shadow(0 0 4px var(--primary))" }} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
        {cmp && <motion.path key={`cmp-${compare}`} d={path(cmp)} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-warn" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-safe" />{year} total</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-warn" />Month above 150% of average</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-primary" />Average of complete years</span>
        {cmp && <span className="flex items-center gap-1"><span className="h-0.5 w-4 border-t-2 border-dashed border-warn" />{compare}</span>}
      </div>
    </div>
  );
}

export function MonsoonChart({ seasons, mean, year, onPick }: { seasons: Season[]; mean: number; year: number; onPick: (y: number) => void }) {
  const [mode, setMode] = useState<"total" | "anomaly">("total");
  const W = 420, H = 230, L = 36, R = 6, T = 12, B = 22;
  const iw = W - L - R, ih = H - T - B;
  const bw = iw / Math.max(1, seasons.length);
  const full = seasons.filter((s) => s.complete);
  const sel = seasons.find((s) => s.year === year);

  let bars: { s: Season; y0: number; y1: number }[] = [];
  let axis: { v: number; label: string }[] = [];
  let ref = 0;
  if (mode === "total") {
    const max = Math.max(...seasons.map((s) => s.total), mean) * 1.1 || 1;
    const y = (v: number) => T + ih - (v / max) * ih;
    bars = seasons.map((s) => ({ s, y0: y(0), y1: y(s.total) }));
    ref = y(mean);
    axis = [0, 1000, 2000, 3000, 4000].filter((v) => v < max).map((v) => ({ v: y(v), label: `${v / 1000}k` }));
  } else {
    const m = Math.max(20, ...full.map((s) => Math.abs(s.pct ?? 0))) * 1.15;
    const y = (v: number) => T + ih / 2 - (v / m) * (ih / 2);
    bars = seasons.map((s) => ({ s, y0: y(0), y1: y(s.pct ?? 0) }));
    ref = y(0);
    axis = [-50, -25, 25, 50].filter((v) => Math.abs(v) < m).map((v) => ({ v: y(v), label: `${v > 0 ? "+" : ""}${v}%` }));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold">Monsoon by year (Jun–Sep)</h3>
          <p className="text-xs text-muted-foreground">Tap a year to load it everywhere</p>
        </div>
        <Toggle value={mode} onChange={setMode} options={[{ v: "total", label: "Totals" }, { v: "anomaly", label: "Anomaly" }]} />
      </div>
      <p className="mb-1 h-5 text-xs tabular-nums">
        {sel ? (
          <>
            <b>{sel.year}</b>: {fmtMm(sel.total)} mm{" "}
            {sel.pct != null ? (
              <span className={sel.pct >= 0 ? "text-safe" : "text-warn"}>({sel.pct >= 0 ? "+" : ""}{sel.pct.toFixed(0)}% vs average)</span>
            ) : (
              <span className="text-muted-foreground">(season incomplete — anomaly not computed)</span>
            )}
          </>
        ) : <span className="text-muted-foreground">No monsoon data for {year}</span>}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {axis.map((a) => (
          <g key={a.label}>
            <line x1={L} x2={W - R} y1={a.v} y2={a.v} className="stroke-border" strokeDasharray="3 4" />
            <text x={L - 4} y={a.v + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{a.label}</text>
          </g>
        ))}
        {bars.map(({ s, y0, y1 }, i) => {
          const top = Math.min(y0, y1), h = Math.max(1, Math.abs(y1 - y0));
          const tone = !s.complete ? "fill-muted-foreground/40" : (s.pct ?? 0) >= 0 ? "fill-safe" : "fill-warn";
          return (
            <g key={s.year} onClick={() => onPick(s.year)} className="cursor-pointer">
              <rect x={L + i * bw} y={T} width={bw} height={ih} className={s.year === year ? "fill-primary/15" : "fill-transparent"} />
              <motion.rect
                key={`${mode}-${s.year}`}
                x={L + i * bw + bw * 0.15}
                width={bw * 0.7}
                rx={1.5}
                initial={{ y: y0, height: 0 }}
                animate={{ y: top, height: h }}
                transition={{ duration: 0.6, delay: i * 0.02 }}
                className={`${tone} ${s.year === year ? "stroke-primary" : ""}`}
                strokeWidth={s.year === year ? 1.5 : 0}
              />
              {s.year % 5 === 0 && <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">{s.year}</text>}
            </g>
          );
        })}
        <line x1={L} x2={W - R} y1={ref} y2={ref} className="stroke-primary" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 3px var(--primary))" }} />
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-safe" />Wetter than average</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-warn" />Drier than average</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-muted-foreground/40" />Incomplete season</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-primary" />{mode === "total" ? `Average ${fmtMm(mean)} mm` : "0% = average"} ({full.length} complete seasons)</span>
      </div>
    </div>
  );
}
