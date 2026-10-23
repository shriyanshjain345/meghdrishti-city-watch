import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import type { Level, Zone, PointInfo } from "@/components/FloodMap";

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

const FloodMap = lazy(() => import("@/components/FloodMap"));

const levelText: Record<Level, string> = { safe: "Normal", warn: "Waterlogging", critical: "Deep Water" };
const levelCls: Record<Level, string> = {
  safe: "bg-safe/20 border-safe text-safe",
  warn: "bg-warn/20 border-warn text-warn",
  critical: "bg-critical/25 border-critical text-critical",
};

const CITY_MAP: Record<string, { center: { lat: number; lng: number }; zones: Zone[] }> = {
  Mumbai: {
    center: { lat: 19.07, lng: 72.88 },
    zones: [
      { name: "Andheri Subway", level: "critical", lat: 19.1197, lng: 72.8464, r: 1500, water: "72 cm", detail: "Subway closed; pumps running at full capacity." },
      { name: "Sion – King's Circle", level: "critical", lat: 19.03, lng: 72.86, r: 1600, water: "65 cm", detail: "Relief camps open nearby." },
      { name: "Dadar – Parel", level: "warn", lat: 19.012, lng: 72.84, r: 1800, water: "28 cm", detail: "Outflows running slowly." },
      { name: "Kurla", level: "warn", lat: 19.07, lng: 72.88, r: 1700, water: "31 cm", detail: "Pooling near station roads." },
      { name: "Borivali", level: "safe", lat: 19.23, lng: 72.86, r: 2500, water: "3 cm", detail: "Drains flowing normally." },
      { name: "Powai", level: "safe", lat: 19.118, lng: 72.906, r: 2000, water: "5 cm", detail: "Minor pooling only." },
    ],
  },
  Jaipur: {
    center: { lat: 26.9124, lng: 75.7873 },
    zones: [
      { name: "Walled City", level: "critical", lat: 26.9239, lng: 75.8267, r: 1500, water: "55 cm", detail: "Narrow lanes holding water." },
      { name: "Sanganer", level: "warn", lat: 26.82, lng: 75.79, r: 2200, water: "26 cm", detail: "Low-lying colonies filling." },
      { name: "Mansarovar", level: "warn", lat: 26.86, lng: 75.76, r: 2000, water: "22 cm", detail: "Underpass slow to drain." },
      { name: "Malviya Nagar", level: "safe", lat: 26.855, lng: 75.815, r: 1800, water: "4 cm", detail: "Drains flowing normally." },
      { name: "Vaishali Nagar", level: "safe", lat: 26.91, lng: 75.74, r: 2000, water: "2 cm", detail: "Roads clear." },
    ],
  },
  Delhi: {
    center: { lat: 28.6139, lng: 77.209 },
    zones: [
      { name: "Minto Bridge", level: "critical", lat: 28.6328, lng: 77.2265, r: 1000, water: "80 cm", detail: "Underpass closed to traffic." },
      { name: "Yamuna Bank", level: "critical", lat: 28.62, lng: 77.28, r: 2200, water: "60 cm", detail: "River level rising; camps open." },
      { name: "ITO", level: "warn", lat: 28.628, lng: 77.241, r: 1300, water: "30 cm", detail: "Slow traffic, pooling on main road." },
      { name: "Rohini", level: "safe", lat: 28.74, lng: 77.11, r: 3000, water: "3 cm", detail: "Drains flowing normally." },
      { name: "Dwarka", level: "safe", lat: 28.59, lng: 77.05, r: 3000, water: "4 cm", detail: "Roads clear." },
      { name: "Lajpat Nagar", level: "warn", lat: 28.567, lng: 77.243, r: 1500, water: "24 cm", detail: "Market lanes holding water." },
    ],
  },
  Bengaluru: {
    center: { lat: 12.9716, lng: 77.5946 },
    zones: [
      { name: "Silk Board", level: "critical", lat: 12.9177, lng: 77.6238, r: 1300, water: "50 cm", detail: "Junction flooded; diversions active." },
      { name: "Bellandur", level: "warn", lat: 12.926, lng: 77.676, r: 2000, water: "30 cm", detail: "Lake outflow high." },
      { name: "Koramangala", level: "warn", lat: 12.935, lng: 77.624, r: 1400, water: "20 cm", detail: "Some streets pooling." },
      { name: "Malleshwaram", level: "safe", lat: 13.003, lng: 77.57, r: 1800, water: "2 cm", detail: "Drains flowing normally." },
      { name: "Whitefield", level: "safe", lat: 12.97, lng: 77.75, r: 2500, water: "5 cm", detail: "Minor pooling only." },
    ],
  },
};

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
  const [rain, setRain] = useState<number>(CITIES.Mumbai.base);
  const [now, setNow] = useState<Date | null>(null);
  const firstZone = (c: City): PointInfo => {
    const z = CITY_MAP[c]!.zones[0]!;
    return { name: z.name, level: z.level, water: z.water, detail: z.detail, lat: z.lat, lng: z.lng };
  };
  const [sel, setSel] = useState<PointInfo>(() => firstZone("Mumbai"));

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
    setSel(firstZone(c));
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
            <p className="mb-2 text-sm text-muted-foreground">Click anywhere on the map for water status at that spot</p>
            <div className="mb-3 flex gap-4 text-xs">
              {(["safe", "warn", "critical"] as Level[]).map((l) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-full ${l === "safe" ? "bg-safe" : l === "warn" ? "bg-warn" : "bg-critical"}`} />
                  {levelText[l]}
                </span>
              ))}
            </div>
            <ClientOnly fallback={<div className="aspect-[4/3] w-full rounded-lg bg-secondary" />}>
              <Suspense fallback={<div className="aspect-[4/3] w-full rounded-lg bg-secondary" />}>
                <FloodMap center={CITY_MAP[city]!.center} zones={CITY_MAP[city]!.zones} onPick={setSel} />
              </Suspense>
            </ClientOnly>
            <div className={`mt-4 rounded-lg border p-4 ${levelCls[sel.level]}`}>
              <div className="flex justify-between">
                <b className="text-foreground">{sel.name}</b>
                <span>{levelText[sel.level]}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/80">Water level: {sel.water} • {sel.detail}</p>
              {sel.lat !== 0 && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{sel.lat.toFixed(4)}, {sel.lng.toFixed(4)}</p>}
            </div>
          </div>

          <div className="glass rounded-xl p-5 lg:col-span-2">
            <h2 className="mb-1 text-lg font-bold">AI Predictive Forecast</h2>
            <p className="mb-5 text-sm text-muted-foreground">Next 6 hours • rainfall & flood risk</p>
            <div className="flex h-44 items-end gap-2">
              {slots.map((f, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{f.mm}</span>
                  <div className="w-full rounded-t-md bg-primary/80 transition-all" style={{ height: `${f.mm * 1.6}px` }} />
                  <span className="text-[10px] tabular-nums md:text-xs">{f.t}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">Rainfall (mm/hr)</p>
            <div className="mt-5 space-y-2.5">
              {slots.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
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
              { title: "🏛 For Local Authorities", tips: ["Pre-deploy dewatering pumps at known flood hotspots.", "Clear stormwater drains and nullahs before peak rainfall.", "Send SMS/loudspeaker messages to low-lying wards early.", "Activate relief camps with food, water and medical teams.", "Coordinate with NDRF, traffic police and railways for closures."] },
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
