import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EVENT_TYPE_LABEL, type EventType, type FloodEvent } from "@/lib/flood-events";
import type { EventCheck } from "@/lib/history-stats";
import { fmtDate, fmtMm } from "./format";

export type Decade = "all" | "2000s" | "2010s" | "2020s";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? "border-primary bg-primary/20 text-primary neon" : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

export function EventFilters({
  decade, setDecade, type, setType,
}: { decade: Decade; setDecade: (d: Decade) => void; type: EventType | "all"; setType: (t: EventType | "all") => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["all", "2000s", "2010s", "2020s"] as Decade[]).map((d) => (
        <Chip key={d} on={decade === d} onClick={() => setDecade(d)}>{d === "all" ? "All years" : d}</Chip>
      ))}
      <span className="mx-1 h-4 w-px bg-border" />
      <Chip on={type === "all"} onClick={() => setType("all")}>Any impact</Chip>
      {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map((t) => (
        <Chip key={t} on={type === t} onClick={() => setType(t)}>{EVENT_TYPE_LABEL[t]}</Chip>
      ))}
    </div>
  );
}

export function TimelineTrack({ events, selectedId, onSelect }: { events: FloodEvent[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (!events.length) return <p className="py-8 text-center text-sm text-muted-foreground">No documented events match these filters.</p>;
  return (
    <div className="relative overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
      <div className="relative flex min-w-max gap-2 px-2 pt-2">
        <div className="absolute left-4 right-4 top-[38px] h-0.5 overflow-hidden rounded bg-border">
          <motion.div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        </div>
        {events.map((e, i) => {
          const on = e.id === selectedId;
          return (
            <motion.button
              key={e.id}
              type="button"
              onClick={() => onSelect(e.id)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="relative flex w-36 flex-col items-center gap-1 rounded-xl px-2 pb-3 pt-1 text-center"
            >
              {on && <motion.span layoutId="tl-on" className="absolute inset-0 -z-0 rounded-xl bg-primary/10 neon" />}
              <span className={`relative z-10 font-display text-sm font-bold ${on ? "text-primary text-glow" : ""}`}>{e.date.slice(0, 4)}</span>
              <span className="relative z-10 mt-1 grid h-5 w-5 place-items-center">
                {on && <span className="ping-ring absolute inset-0 rounded-full bg-critical/60" />}
                <span className={`relative h-3.5 w-3.5 rounded-full ring-2 ring-background ${on ? "bg-critical" : "bg-warn"}`} />
              </span>
              <span className="relative z-10 text-[11px] text-muted-foreground">{fmtDate(e.date)}</span>
              <span className="relative z-10 line-clamp-2 text-xs font-semibold leading-tight">{e.title.replace(/^\S+ \S+ \d{4} /, "")}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function EventDetail({ event, check }: { event: FloodEvent | undefined; check: EventCheck | null }) {
  return (
    <AnimatePresence mode="wait">
      {event ? (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.3 }}
          className="glass-hi neon rounded-xl p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary">{fmtDate(event.date)}</p>
              <h3 className="text-lg font-bold">{event.title}</h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {event.types.map((t) => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{EVENT_TYPE_LABEL[t]}</span>)}
            </div>
          </div>
          <p className="mt-2 text-sm text-foreground/85">{event.impact}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recorded rainfall</p>
          <div className="mt-2 space-y-2">
            {event.rainfall.map((r) => (
              <div key={r.station + r.period}>
                <div className="flex justify-between text-xs">
                  <span>{r.station} <span className="text-muted-foreground">· {r.period}</span></span>
                  <b className="tabular-nums">{fmtMm(r.mm, r.mm % 1 ? 1 : 0)} mm</b>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div className={`h-full rounded-full ${r.mm >= 204.5 ? "bg-critical" : r.mm >= 115.6 ? "bg-warn" : "bg-safe"}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (r.mm / 944) * 100)}%` }} transition={{ duration: 0.9 }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between rounded-md bg-background/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Reanalysis grid (ERA5), wettest day in window</span>
              <b className="tabular-nums">{check?.gridMax != null ? `${fmtMm(check.gridMax, 1)} mm` : "not available"}</b>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted-foreground">Locations</p>
              <ul className="mt-1 space-y-0.5">{event.places.map((p) => <li key={p.name}>📍 {p.name}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted-foreground">Deaths reported</p>
              <p className="mt-1">{event.deaths ?? <span className="text-muted-foreground">Not reported in the cited sources</span>}</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {event.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">↗ {s.label}</a></li>
            ))}
          </ul>
        </motion.div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">Select an event on the timeline.</p>
      )}
    </AnimatePresence>
  );
}
