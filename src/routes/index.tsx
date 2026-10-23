import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MeghDrishti — Rainfall & Urban Flood Risk Dashboard" },
      { name: "description", content: "Live simulated rainfall, drainage and AI flood-risk tracking for Indian cities." },
      { property: "og:title", content: "MeghDrishti" },
      { property: "og:description", content: "Track heavy rainfall and urban flood risks with AI forecasts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Level = "safe" | "warn" | "critical";
const levelText: Record<Level, string> = { safe: "Normal", warn: "Waterlogging", critical: "Deep Water" };
const levelCls: Record<Level, string> = {
  safe: "bg-safe/20 border-safe text-safe",
  warn: "bg-warn/20 border-warn text-warn",
  critical: "bg-critical/25 border-critical text-critical",
};

const zones: { id: string; name: string; level: Level; x: number; y: number; w: number; h: number; water: string; detail: string }[] = [
  { id: "n", name: "North District", level: "safe", x: 5, y: 5, w: 55, h: 28, water: "2 cm", detail: "Drains flowing normally." },
  { id: "e", name: "Eastern Suburbs", level: "safe", x: 63, y: 5, w: 32, h: 40, water: "5 cm", detail: "Minor pooling on arterial roads." },
  { id: "c", name: "Central Zone", level: "warn", x: 5, y: 36, w: 55, h: 30, water: "28 cm", detail: "Underpasses filling; outflows running slowly." },
  { id: "l", name: "Low-lying Area", level: "critical", x: 5, y: 69, w: 45, h: 26, water: "72 cm", detail: "Relief camps open; pumps running at full capacity." },
  { id: "c2", name: "Coastal Belt", level: "warn", x: 53, y: 48, w: 42, h: 47, water: "34 cm", detail: "High tide at 16:40 may block outfalls." },
];

const FORECAST = [
  { mm: 42, risk: 58 },
  { mm: 61, risk: 70 },
  { mm: 78, risk: 84 },
  { mm: 66, risk: 79 },
  { mm: 39, risk: 62 },
  { mm: 22, risk: 45 },
];

const CITIES = {
  Mumbai: { temp: 26, cond: "Heavy Thunderstorm", base: 48 },
  Jaipur: { temp: 29, cond: "Intense Rain Spells", base: 34 },
  Delhi: { temp: 24, cond: "Thunderstorm with Dust", base: 41 },
  Bengaluru: { temp: 22, cond: "Drizzle & Overcast", base: 19 },
} as const;
type City = keyof typeof CITIES;

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kolkata",
});

function slotTimes(now: Date) {
  return FORECAST.map((f, i) => ({ ...f, t: timeFmt.format(new Date(now.getTime() + (i + 1) * 3_600_000)) }));
}

function riskColor(r: number) {
  return r >= 75 ? "bg-critical" : r >= 55 ? "bg-warn" : "bg-safe";
}

function Dashboard() {
  const [city, setCity] = useState<City>("Mumbai");
  const [rain, setRain] = useState(CITIES.Mumbai.base);
  const [now, setNow] = useState<Date | null>(null);
  const [sel, setSel] = useState(zones[3]!);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setRain((r) => Math.max(8, Math.min(90, +(r + (Math.random() - 0.45) * 4).toFixed(1))));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const pickCity = (c: City) => {
    setCity(c);
    setRain(CITIES[c].base);
  };

  const clock = now ? timeFmt.format(now) : "--:--";
  const slots = now ? slotTimes(now) : FORECAST.map((f) => ({ ...f, t: "--:--" }));
  const peak = slots.reduce((a, b) => (b.risk > a.risk ? b : a));

  const riskIdx = rain > 55 ? "High" : "Moderate";
  const metrics = [
    { label: "Current Rainfall", value: `${rain}`, unit: "mm/hr", pct: rain, tone: rain > 55 ? "critical" : "warn" },
    { label: "Soil Saturation", value: "87", unit: "%", pct: 87, tone: "warn" },
    { label: "Drainage Capacity", value: "34", unit: "% left", pct: 34, tone: "critical" },
    { label: "AI Risk Index", value: riskIdx, unit: rain > 55 ? "8.1/10" : "6.2/10", pct: rain > 55 ? 81 : 62, tone: rain > 55 ? "critical" : "warn" },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Megh<span className="text-primary">Drishti</span>
          </h1>
          <p className="text-sm text-muted-foreground">Urban Flood Intelligence for India • Live simulation</p>
        </div>
        <div className="glass flex items-center gap-4 rounded-xl px-4 py-3">
          <select
            value={city}
            onChange={(e) => pickCity(e.target.value as City)}
            className="rounded-md bg-secondary px-2 py-1 text-sm"
          >
            {Object.keys(CITIES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="text-3xl font-bold font-display">{CITIES[city].temp}°C</div>
          <div className="text-sm">
            <div>🌧 {CITIES[city].cond}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-safe animate-pulse" />LIVE {clock} IST
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="glass rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className={`mt-2 font-display text-2xl font-bold md:text-3xl ${m.tone === "critical" ? "text-critical" : "text-warn"}`}>
                {m.value} <span className="text-sm font-normal text-muted-foreground">{m.unit}</span>
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all duration-700 ${m.tone === "critical" ? "bg-critical" : "bg-warn"}`} style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="glass rounded-xl p-5 lg:col-span-3">
            <h2 className="mb-1 text-lg font-bold">City Flood Map — {city}</h2>
            <p className="mb-4 text-sm text-muted-foreground">Tap a zone for details</p>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary">
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSel(z)}
                  className={`absolute flex flex-col items-start justify-end rounded-lg border-2 p-2 text-left transition hover:scale-[1.02] ${levelCls[z.level]} ${sel.id === z.id ? "ring-2 ring-foreground" : ""}`}
                  style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                >
                  {z.level === "critical" && <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-critical animate-ping" />}
                  <span className="text-xs font-bold text-foreground md:text-sm">{z.name}</span>
                  <span className="text-[10px] md:text-xs">{levelText[z.level]}</span>
                </button>
              ))}
            </div>
            <div className={`mt-4 rounded-lg border p-4 ${levelCls[sel.level]}`}>
              <div className="flex justify-between">
                <b className="text-foreground">{sel.name}</b>
                <span>{levelText[sel.level]}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/80">Water level: {sel.water} • {sel.detail}</p>
            </div>
          </div>

          <div className="glass rounded-xl p-5 lg:col-span-2">
            <h2 className="mb-1 text-lg font-bold">AI Predictive Forecast</h2>
            <p className="mb-5 text-sm text-muted-foreground">Next 6 hours • rainfall & flood risk</p>
            <div className="flex h-44 items-end gap-2">
              {slots.map((f) => (
                <div key={f.t} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{f.mm}</span>
                  <div className="w-full rounded-t-md bg-primary/80 transition-all" style={{ height: `${f.mm * 1.6}px` }} />
                  <span className="text-[10px] tabular-nums md:text-xs">{f.t}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">Rainfall (mm/hr)</p>
            <div className="mt-5 space-y-2.5">
              {slots.map((f) => (
                <div key={f.t} className="flex items-center gap-3 text-sm">
                  <span className="w-12 tabular-nums text-muted-foreground">{f.t}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${riskColor(f.risk)}`} style={{ width: `${f.risk}%` }} />
                  </div>
                  <span className="w-10 text-right">{f.risk}%</span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-accent p-3 text-xs">🤖 Peak risk expected at {peak.t}. Model confidence 89%.</p>
          </div>
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="mb-4 text-lg font-bold">Emergency Preparedness & Action Guide</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "👨‍👩‍👧 For Citizens", tips: ["Keep an emergency kit: torch, power bank, medicines, documents in a waterproof bag.", "Never walk or drive through flooded roads — 15 cm of moving water can knock you down.", "Switch off main electricity if water enters your home.", "Move to higher floors; avoid basements and underpasses.", "Save helplines: 112 (Emergency), 1916 (BMC), 1078 (NDMA)."] },
              { title: "🏛 For Local Authorities", tips: ["Pre-deploy dewatering pumps at known flood hotspots.", "Clear stormwater drains and nullahs before peak rainfall.", "Issue SMS/loudspeaker alerts to low-lying wards early.", "Activate relief camps with food, water and medical teams.", "Coordinate with NDRF, traffic police and railways for closures."] },
            ].map((g) => (
              <div key={g.title}>
                <h3 className="mb-3 font-semibold text-primary">{g.title}</h3>
                <ul className="space-y-2">
                  {g.tips.map((t, i) => (
                    <li key={i} className="flex gap-3 rounded-lg bg-secondary p-3 text-sm">
                      <span className="font-display font-bold text-primary">{i + 1}</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
