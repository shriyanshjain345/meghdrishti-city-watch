import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { motion, AnimatePresence, animate } from "framer-motion";
import { getMumbaiRainHistory, type RainHistory } from "@/lib/history.functions";
import {
  expand, byYear, yearStats, monsoonSeasons, seasonMean, monthlyClimatology, isCompleteYear,
  checkWindow, monsoonFlagCounts, IMD, type EventCheck,
} from "@/lib/history-stats";
import { FLOOD_EVENTS, type EventType } from "@/lib/flood-events";
import { RainTrendChart, MonsoonChart } from "./RainCharts";
import { EventFilters, TimelineTrack, EventDetail, type Decade } from "./EventTimeline";
import ValidationPanel from "./ValidationPanel";
import { fmtDate, fmtStamp, fmtMm } from "./format";

const HistoryMap = lazy(() => import("./HistoryMap"));

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1.2, ease: "easeOut", onUpdate: setV });
    return () => c.stop();
  }, [value]);
  return <>{fmtMm(v, decimals)}</>;
}

function StatCard({ label, children, sub, i }: { label: string; children: ReactNode; sub: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.08, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="glass-hi neon relative overflow-hidden rounded-2xl p-4"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-glow md:text-3xl">{children}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

const FLOW = [
  { icon: "🌧️", title: "Historical rainfall", body: "Daily rainfall for Mumbai since 2000 from the ERA5 reanalysis — shows what a normal and an extreme monsoon look like." },
  { icon: "🌊", title: "Flood patterns", body: "Documented floods cluster on days of very heavy rain, often after several wet days and during high tide. Those patterns set the thresholds." },
  { icon: "🤖", title: "Risk prediction", body: "The live forecast above turns Google's hourly rain chance and amount into a 0–100 waterlogging score for the next 24 hours." },
  { icon: "🛟", title: "Preparedness", body: "When the score climbs, the Action Guide tells you what to keep ready, what to do and what never to do." },
];

export default function HistorySection() {
  const [data, setData] = useState<RainHistory | null>(null);
  const [err, setErr] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [eventId, setEventId] = useState<string>(FLOOD_EVENTS.at(-1)!.id);
  const [decade, setDecade] = useState<Decade>("all");
  const [type, setType] = useState<EventType | "all">("all");
  const [flow, setFlow] = useState(0);

  useEffect(() => {
    let live = true;
    getMumbaiRainHistory()
      .then((d) => live && setData(d))
      .catch(() => live && setErr(true));
    return () => { live = false; };
  }, []);

  const model = useMemo(() => {
    if (!data) return null;
    const days = expand(data.start, data.mm);
    const index = new Map(days.map((d, i) => [d.date, i]));
    const groups = byYear(days);
    const years = [...groups.keys()].sort((a, b) => a - b);
    const complete = new Set(years.filter((y) => isCompleteYear(y, groups.get(y))));
    const seasons = monsoonSeasons(groups);
    const checks = new Map<string, EventCheck>(FLOOD_EVENTS.map((e) => [e.id, checkWindow(days, index, e.window[0], e.window[1])]));
    const completeSeasonYears = new Set(seasons.filter((s) => s.complete).map((s) => s.year));
    return {
      days, groups, years, complete, seasons, checks,
      mean: seasonMean(seasons),
      clim: monthlyClimatology(groups),
      flags: monsoonFlagCounts(days, completeSeasonYears),
      completeSeasons: completeSeasonYears.size,
      missing: days.filter((d) => d.mm == null).length,
    };
  }, [data]);

  useEffect(() => {
    if (model && year == null) setYear([...model.complete].at(-1) ?? model.years.at(-1)!);
  }, [model, year]);

  const events = FLOOD_EVENTS.filter((e) => {
    const y = +e.date.slice(0, 4);
    const okD = decade === "all" || (decade === "2000s" ? y < 2010 : decade === "2010s" ? y >= 2010 && y < 2020 : y >= 2020);
    return okD && (type === "all" || e.types.includes(type));
  });
  const selected = events.find((e) => e.id === eventId) ?? events[0];
  const eventDates = useMemo(() => {
    const s = new Set<string>();
    FLOOD_EVENTS.forEach((e) => { s.add(e.window[0]); s.add(e.window[1]); });
    return s;
  }, []);

  const y = year ?? 0;
  const ys = model && year != null ? yearStats(model.groups.get(year) ?? []) : null;
  const yearEvents = FLOOD_EVENTS.filter((e) => +e.date.slice(0, 4) === y).length;
  const partial = model && year != null && !model.complete.has(year);

  return (
    <section id="history" className="relative space-y-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/40 to-background p-4 md:p-6">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <Reveal className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div aria-hidden className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-primary/50 neon">
            <div className="radar-sweep absolute inset-0 rounded-full" />
            <div className="absolute inset-3 rounded-full border border-primary/30" />
            <div className="absolute inset-6 rounded-full border border-primary/30" />
            <span className="ping-ring absolute left-[60%] top-[30%] h-2 w-2 rounded-full bg-critical" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Page 5 · Mumbai</p>
            <h2 className="text-xl font-bold md:text-2xl">Historical Rainfall & Flood Event Analysis</h2>
            <p className="text-xs text-muted-foreground">
              {data ? <>Daily rainfall {fmtDate(data.start)} – {fmtDate(data.end)} · fetched {fmtStamp(data.fetchedAt)}</> : err ? "Rainfall history unavailable right now" : "Loading rainfall history…"}
            </p>
          </div>
        </div>
        {model && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Year</span>
            <select value={y} onChange={(e) => setYear(+e.target.value)} className="neon rounded-full bg-secondary px-3 py-1.5 font-semibold">
              {model.years.slice().reverse().map((yy) => <option key={yy} value={yy}>{yy}{model.complete.has(yy) ? "" : " (partial)"}</option>)}
            </select>
          </label>
        )}
      </Reveal>

      {err && (
        <p className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
          The rainfall archive couldn't be reached, so charts, totals and validation are left empty rather than estimated. The documented flood events below come from published sources and still work.
        </p>
      )}

      {model && ys && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard i={0} label={`Total rainfall ${y}`} sub={partial ? `Partial year · ${ys.days} days of data` : ys.missing ? `${ys.missing} days missing` : "Full year, ERA5 grid"}>
            <CountUp value={ys.total} /> <span className="text-sm font-normal text-muted-foreground">mm</span>
          </StatCard>
          <StatCard i={1} label="Peak daily rainfall" sub={ys.peak ? fmtDate(ys.peak.date) : "No data"}>
            {ys.peak ? <><CountUp value={ys.peak.mm} decimals={1} /> <span className="text-sm font-normal text-muted-foreground">mm/day</span></> : "—"}
          </StatCard>
          <StatCard i={2} label="Very heavy rain days" sub={`≥ ${IMD.veryHeavy} mm · plus ${ys.heavyDays - ys.veryHeavyDays} heavy days (≥ ${IMD.heavy})`}>
            <CountUp value={ys.veryHeavyDays} />
          </StatCard>
          <StatCard i={3} label="Documented flood events" sub={`in ${y} · ${FLOOD_EVENTS.length} sourced events listed since 2005`}>
            <CountUp value={yearEvents} />
          </StatCard>
        </div>
      )}

      {model && year != null && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Reveal className="glass neon rounded-2xl p-4 lg:col-span-3">
            <RainTrendChart groups={model.groups} year={year} years={model.years} clim={model.clim} eventDates={eventDates} />
          </Reveal>
          <Reveal delay={0.1} className="glass neon rounded-2xl p-4 lg:col-span-2">
            <MonsoonChart seasons={model.seasons} mean={model.mean} year={year} onPick={setYear} />
          </Reveal>
        </div>
      )}
      {!model && !err && (
        <div className="grid h-64 place-items-center rounded-2xl border border-border/60">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-primary/40"><div className="radar-sweep absolute inset-0 rounded-full" /></div>
        </div>
      )}

      <Reveal className="glass neon rounded-2xl p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-bold">Documented Mumbai flood events</h3>
            <p className="text-xs text-muted-foreground">Every figure is quoted from the linked sources · tap an event</p>
          </div>
          <EventFilters decade={decade} setDecade={setDecade} type={type} setType={setType} />
        </div>
        <TimelineTrack events={events} selectedId={selected?.id ?? null} onSelect={setEventId} />
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EventDetail event={selected} check={selected && model ? model.checks.get(selected.id) ?? null : null} />
          </div>
          <div className="lg:col-span-2">
            <ClientOnly fallback={<div className="aspect-[4/5] w-full rounded-xl bg-secondary" />}>
              <Suspense fallback={<div className="aspect-[4/5] w-full rounded-xl bg-secondary" />}>
                <HistoryMap events={events} selectedId={selected?.id ?? null} onSelect={setEventId} />
              </Suspense>
            </ClientOnly>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {events.flatMap((e) => e.places.map((p) => ({ e, p }))).map(({ e, p }) => (
                <button
                  key={e.id + p.name}
                  type="button"
                  onClick={() => setEventId(e.id)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition ${e.id === selected?.id ? "border-critical bg-critical/15 text-critical" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  📍 {p.name} · {e.date.slice(0, 4)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Pins mark approximate neighbourhood centres named in the sources, not exact incident points.</p>
          </div>
        </div>
      </Reveal>


      <Reveal className="glass neon rounded-2xl p-4">
        <h3 className="font-bold">Model validation</h3>
        <p className="mb-4 text-xs text-muted-foreground">Would each method have flagged the documented events, using only rainfall data from that day and the days before?</p>
        <ValidationPanel events={FLOOD_EVENTS} checks={model?.checks ?? null} flags={model?.flags ?? null} seasons={model?.completeSeasons ?? 0} />
      </Reveal>

      <Reveal className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-4 text-sm">
          <h3 className="mb-2 font-bold">Methodology & limitations</h3>
          <ul className="list-disc space-y-1.5 pl-4 text-xs text-foreground/85">
            <li>Charts use one ERA5 reanalysis grid cell{data ? ` (${data.lat.toFixed(2)}°N, ${data.lng.toFixed(2)}°E)` : ""} near Santacruz, about 25 km wide. Gridded data smooths out local cloudbursts: on 26 July 2005 the IMD station logged 944 mm while the grid shows {model?.checks.get("2005-07-26")?.gridMax != null ? `${fmtMm(model.checks.get("2005-07-26")!.gridMax!, 1)} mm` : "far less"}.</li>
            <li>Days are calendar days in IST; IMD's rain day runs 08:30–08:30, so each event is checked over a two-day window.</li>
            <li>Rain intensity is daily (mm/day); hourly peaks are not in this archive.</li>
            <li>The event list covers {FLOOD_EVENTS.length} well-documented floods only — it is not a complete catalogue, so missed events and non-events can't be fully scored.</li>
            <li>Death tolls are as reported by the cited outlet at the time; later official totals may differ.</li>
            <li>The archive runs about a week behind today{model ? ` · ${model.missing} missing days in the record` : ""}.</li>
            <li>Live readings (pages 1–3) come from Google Weather; flood-map zones there are estimates, not measurements.</li>
          </ul>
        </div>
        <div className="glass rounded-2xl p-4 text-sm">
          <h3 className="mb-2 font-bold">Data sources</h3>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noreferrer" className="text-primary hover:underline">↗ Open-Meteo Historical Weather API</a>
              <span className="text-muted-foreground"> — ERA5 reanalysis (Copernicus / ECMWF), daily precipitation{data ? ` · fetched ${fmtStamp(data.fetchedAt)}` : ""}</span>
            </li>
            <li>
              <span className="font-semibold">India Meteorological Department</span>
              <span className="text-muted-foreground"> — station rainfall (Santacruz, Colaba) and rain categories, as quoted in the event sources</span>
            </li>
            <li>
              <span className="font-semibold">BMC automatic weather stations</span>
              <span className="text-muted-foreground"> — local gauge readings quoted in news reports</span>
            </li>
            <li>
              <span className="font-semibold">Event sources</span>
              <span className="text-muted-foreground"> — NIDM, The Hindu, Indian Express, Times of India, BusinessLine, Frontline, mid-day, Wikipedia; links on each event</span>
            </li>
            <li>
              <span className="font-semibold">Google Weather</span>
              <span className="text-muted-foreground"> — live conditions and 24-hour forecast on pages 1–3</span>
            </li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
