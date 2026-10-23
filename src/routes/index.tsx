import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import type { Level, Zone, PointInfo } from "@/components/FloodMap";
import { getWeather, type Weather } from "@/lib/weather.functions";
import ActionGuide from "@/components/ActionGuide";

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

const CITIES = {
  Mumbai: { temp: 26, cond: "Heavy Thunderstorm", base: 18 },
  Jaipur: { temp: 29, cond: "Intense Rain Spells", base: 10 },
  Delhi: { temp: 24, cond: "Thunderstorm with Dust", base: 14 },
  Bengaluru: { temp: 22, cond: "Drizzle & Overcast", base: 8 },
} as const;
type City = keyof typeof CITIES;

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kolkata",
});

type Slot = { t: string; icon: string; cond: string; rainChance: number; mm: number; temp: number; risk: number };

function floodRisk(rainChance: number, mm: number, base: number) {
  return Math.round(Math.min(98, Math.max(3, base + rainChance * 0.45 + mm * 9)));
}
function riskTone(r: number): Level {
  return r >= 70 ? "critical" : r >= 40 ? "warn" : "safe";
}
const toneText: Record<Level, string> = { safe: "text-safe", warn: "text-warn", critical: "text-critical" };
const toneBg: Record<Level, string> = { safe: "bg-safe", warn: "bg-warn", critical: "bg-critical" };

function rainEmoji(chance: number) {
  return chance >= 70 ? "⛈️" : chance >= 40 ? "🌧️" : chance >= 15 ? "🌦️" : "☁️";
}

function Dashboard() {
  const [city, setCity] = useState<City>("Mumbai");
  const [now, setNow] = useState<Date | null>(null);
  const [wx, setWx] = useState<Weather | null>(null);
  const [wxErr, setWxErr] = useState(false);
  const [slotIdx, setSlotIdx] = useState(0);
  const firstZone = (c: City): PointInfo => {
    const z = CITY_MAP[c]!.zones[0]!;
    return { name: z.name, level: z.level, water: z.water, detail: z.detail, lat: z.lat, lng: z.lng };
  };
  const [sel, setSel] = useState<PointInfo>(() => firstZone("Mumbai"));

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let live = true;
    setWx(null);
    setWxErr(false);
    getWeather({ data: { city } })
      .then((w) => live && setWx(w))
      .catch(() => live && setWxErr(true));
    return () => { live = false; };
  }, [city]);

  const pickCity = (c: City) => {
    setCity(c);
    setSlotIdx(0);
    setSel(firstZone(c));
  };

  const clock = now ? timeFmt.format(now) : "--:--";
  const base = CITIES[city].base;
  const slots: Slot[] = (wx?.hours ?? []).map((h) => ({
    ...h,
    t: h.time ? timeFmt.format(new Date(h.time)) : "--:--",
    risk: floodRisk(h.rainChance, h.mm, base),
  }));
  const slot = slots[slotIdx];
  const peak = slots.length ? slots.reduce((a, b) => (b.risk > a.risk ? b : a)) : null;
  const zones = CITY_MAP[city]!.zones;
  const affected = slot
    ? slot.risk >= 70
      ? zones.filter((z) => z.level !== "safe")
      : slot.risk >= 40
        ? zones.filter((z) => z.level === "critical")
        : []
    : [];
  const outlook = (s: Slot) =>
    s.risk >= 70
      ? "Narrow lanes and underpasses likely to hold water; expect slow traffic around low-lying spots."
      : s.risk >= 40
        ? "Some pooling possible at underpasses that drain slowly."
        : "Roads expected to stay clear.";

  const rain = wx ? +wx.mmNow.toFixed(1) : 0;
  const soil = wx ? Math.round(Math.min(99, wx.humidity * 0.9 + rain * 2)) : 0;
  const drain = Math.max(5, Math.round(100 - rain * 6 - base));
  const maxRisk = peak?.risk ?? 0;
  const metrics = [
    { label: "Current Rainfall", value: wx ? `${rain}` : "…", unit: "mm/hr", pct: Math.min(100, rain * 5), tone: riskTone(rain * 8) },
    { label: "Soil Saturation", value: wx ? `${soil}` : "…", unit: "%", pct: soil, tone: riskTone(soil - 20) },
    { label: "Drainage Capacity", value: wx ? `${drain}` : "…", unit: "% left", pct: drain, tone: riskTone(100 - drain) },
    { label: "AI Risk Index", value: wx ? (maxRisk >= 70 ? "High" : maxRisk >= 40 ? "Moderate" : "Low") : "…", unit: `${(maxRisk / 10).toFixed(1)}/10`, pct: maxRisk, tone: riskTone(maxRisk) },
  ];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Megh<span className="text-primary">Drishti</span>
          </h1>
          <p className="text-sm text-muted-foreground">Urban Flood Intelligence for India • Live weather</p>
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
          <div className="text-3xl font-bold font-display">{wx ? wx.temp : CITIES[city].temp}°C</div>
          <div className="text-sm">
            <div className="flex items-center gap-1">{wx && <img src={wx.icon} alt="" className="h-5 w-5" />}{wx ? wx.cond : "Loading…"}</div>
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
              <p className={`mt-2 font-display text-2xl font-bold md:text-3xl ${toneText[m.tone]}`}>
                {m.value} <span className="text-sm font-normal text-muted-foreground">{m.unit}</span>
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all duration-700 ${toneBg[m.tone]}`} style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="glass rounded-xl p-5 lg:col-span-3">
            <h2 className="mb-1 text-lg font-bold">City Flood Map — {city}</h2>
            <p className="mb-2 text-sm text-muted-foreground">Click anywhere on the map for water status at that spot</p>
            <div className="mb-3 flex flex-wrap gap-4 text-xs">
              {(["safe", "warn", "critical"] as Level[]).map((l) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-full ${l === "safe" ? "bg-safe" : l === "warn" ? "bg-warn" : "bg-critical"}`} />
                  {levelText[l]} — {l === "safe" ? "clear roads" : l === "warn" ? "underpass slow to drain" : "narrow lanes holding water"}
                </span>
              ))}
            </div>
            <ClientOnly fallback={<div className="aspect-[4/3] w-full rounded-lg bg-secondary" />}>
              <Suspense fallback={<div className="aspect-[4/3] w-full rounded-lg bg-secondary" />}>
                <FloodMap city={city} center={CITY_MAP[city]!.center} zones={CITY_MAP[city]!.zones} onPick={setSel} />
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
            <p className="mb-4 text-sm text-muted-foreground">Next 6 hours • tap a time for details</p>
            {!wx && <p className="py-10 text-center text-sm text-muted-foreground">{wxErr ? "Weather data unavailable right now." : "Loading live weather…"}</p>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {slots.map((f, i) => {
                const tone = riskTone(f.risk);
                const active = i === slotIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setSlotIdx(i)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${active ? "border-primary bg-primary/15 scale-[1.03]" : "border-border bg-secondary/60 hover:bg-secondary"}`}
                  >
                    <span className="text-xs font-semibold tabular-nums">{f.t}</span>
                    {f.icon.length > 4 ? <img src={f.icon} alt={f.cond} className="h-8 w-8" /> : <span className="text-2xl">{rainEmoji(f.rainChance)}</span>}
                    <span className="text-xs text-primary">💧 {f.rainChance}%</span>
                    <span className={`rounded-full px-1.5 text-[11px] font-bold ${toneBg[tone]}/20 ${toneText[tone]}`}>🌊 {f.risk}%</span>
                  </button>
                );
              })}
            </div>
            {slot && (
              <div className={`mt-4 rounded-lg border p-4 ${levelCls[riskTone(slot.risk)]}`}>
                <div className="flex items-center justify-between">
                  <b className="text-foreground">{slot.t} IST • {slot.cond}</b>
                  <span className="text-sm">{slot.temp}°C</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-foreground">
                  <div className="rounded-md bg-background/40 p-2"><div className="text-muted-foreground">Rain chance</div><b className="text-base">{slot.rainChance}%</b></div>
                  <div className="rounded-md bg-background/40 p-2"><div className="text-muted-foreground">Rainfall</div><b className="text-base">{slot.mm.toFixed(1)} mm</b></div>
                  <div className="rounded-md bg-background/40 p-2"><div className="text-muted-foreground">Flood risk</div><b className={`text-base ${toneText[riskTone(slot.risk)]}`}>{slot.risk}%</b></div>
                </div>
                <p className="mt-3 text-sm text-foreground/90">{outlook(slot)}</p>
                <p className="mt-2 text-xs font-semibold text-foreground">Where:</p>
                {affected.length ? (
                  <ul className="mt-1 space-y-1 text-xs text-foreground/80">
                    {affected.map((z) => (
                      <li key={z.name} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${toneBg[z.level]}`} />
                        {z.name} — {z.level === "critical" ? "narrow lanes holding water" : "underpass slow to drain"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-foreground/80">All areas of {city} expected clear.</p>
                )}
              </div>
            )}
            {peak && <p className="mt-3 rounded-lg bg-accent p-3 text-xs">🤖 Highest flood risk at {peak.t} ({peak.risk}%). Live data from Google Weather.</p>}
          </div>
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="mb-4 text-lg font-bold">Emergency Preparedness & Action Guide</h2>
          <ActionGuide />
        </section>
      </main>
    </div>
  );
}
