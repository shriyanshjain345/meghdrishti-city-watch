import { motion } from "framer-motion";
import { BASELINE_MM, RULE_THRESHOLD, RULE_ANTECEDENT_WEIGHT, type EventCheck } from "@/lib/history-stats";
import type { FloodEvent } from "@/lib/flood-events";
import { fmtDate, fmtMm } from "./format";

function Mark({ v }: { v: boolean | null }) {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  return v ? <span className="font-bold text-safe">✓ flagged</span> : <span className="font-bold text-warn">✗ missed</span>;
}

function Meter({ label, hits, total, tone }: { label: string; hits: number; total: number; tone: string }) {
  const pct = total ? (hits / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs"><span>{label}</span><b className="tabular-nums">{hits} / {total}</b></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div className={`h-full rounded-full ${tone}`} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1.1 }} />
      </div>
    </div>
  );
}

export default function ValidationPanel({
  events, checks, flags, seasons,
}: { events: FloodEvent[]; checks: Map<string, EventCheck> | null; flags: { seasonDays: number; baseline: number; rule: number } | null; seasons: number }) {
  const rows = events.map((e) => ({ e, c: checks?.get(e.id) ?? null }));
  const scored = rows.filter((r) => r.c?.gridMax != null);
  const bHits = scored.filter((r) => r.c!.baselineHit).length;
  const rHits = scored.filter((r) => r.c!.ruleHit).length;
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl bg-background/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documented events caught</p>
          {checks ? (
            <>
              <Meter label={`Baseline: day rain ≥ ${BASELINE_MM} mm`} hits={bHits} total={scored.length} tone="bg-safe" />
              <Meter label={`MeghDrishti rule: score ≥ ${RULE_THRESHOLD}`} hits={rHits} total={scored.length} tone="bg-primary" />
            </>
          ) : <p className="text-sm text-muted-foreground">Not computed — rainfall history unavailable.</p>}
        </div>
        <div className="space-y-2 rounded-xl bg-background/40 p-4 text-xs">
          <p className="font-semibold uppercase tracking-wider text-muted-foreground">Monsoon days flagged</p>
          {flags ? (
            <>
              <p><b className="text-base tabular-nums">{fmtMm(flags.baseline / Math.max(1, seasons), 1)}</b> days per season — baseline</p>
              <p><b className="text-base tabular-nums">{fmtMm(flags.rule / Math.max(1, seasons), 1)}</b> days per season — MeghDrishti rule</p>
              <p className="text-muted-foreground">Across {fmtMm(flags.seasonDays)} monsoon days in {seasons} complete seasons. Not every flagged day flooded, but there is no complete record of non-flood days, so precision and false-alarm rate can't be measured.</p>
            </>
          ) : <p className="text-muted-foreground">Not computed.</p>}
        </div>
        <div className="space-y-2 rounded-xl bg-background/40 p-4 text-xs">
          <p className="font-semibold uppercase tracking-wider text-muted-foreground">What is being compared</p>
          <p><b>MeghDrishti rule</b> = that day's rain + {RULE_ANTECEDENT_WEIGHT} × rain of the previous 3 days (wet ground holds less), flagged at ≥ {RULE_THRESHOLD}.</p>
          <p><b>Baseline</b> = IMD "heavy rain" threshold on the day alone.</p>
          <p className="text-muted-foreground">Live 24-hour forecasts are not archived yet, so past forecast-vs-outcome accuracy can't be scored. This is a hindcast on reanalysis rainfall over {events.length} events — too few for a reliable accuracy figure.</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-semibold">Event</th>
              <th className="py-2 pr-3 font-semibold">Station record</th>
              <th className="py-2 pr-3 font-semibold">ERA5 grid (max day)</th>
              <th className="py-2 pr-3 font-semibold">Rule score</th>
              <th className="py-2 pr-3 font-semibold">Baseline</th>
              <th className="py-2 font-semibold">MeghDrishti rule</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, c }) => (
              <tr key={e.id} className="border-b border-border/50">
                <td className="py-2 pr-3">{fmtDate(e.date)}</td>
                <td className="py-2 pr-3 tabular-nums">{fmtMm(e.rainfall[0]!.mm, 1)} mm <span className="text-muted-foreground">({e.rainfall[0]!.station})</span></td>
                <td className="py-2 pr-3 tabular-nums">{c?.gridMax != null ? `${fmtMm(c.gridMax, 1)} mm` : "—"}</td>
                <td className="py-2 pr-3 tabular-nums">{c?.ruleMax != null ? fmtMm(c.ruleMax, 0) : "—"}</td>
                <td className="py-2 pr-3"><Mark v={c?.baselineHit ?? null} /></td>
                <td className="py-2"><Mark v={c?.ruleHit ?? null} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
