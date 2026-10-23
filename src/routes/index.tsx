import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Level, Zone, PointInfo } from "@/components/FloodMap";
import { getWeather, type Weather } from "@/lib/weather.functions";
import ActionGuide from "@/components/ActionGuide";
import WeatherFx from "@/components/WeatherFx";
import TrendChart from "@/components/TrendChart";

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
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
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
    {
      label: "Current Rainfall",
      value: wx ? `${rain}` : "…",
      unit: "mm/hr",
      pct: Math.min(100, rain * 5),
      tone: riskTone(rain * 8),
      info: "Live rainfall in millimetres per hour comes straight from Google's weather feed for your city. The bar and colour show how far that rate is from the level where city drains start to fall behind.",
    },
    {
      label: "Soil Saturation",
      value: wx ? `${soil}` : "…",
      unit: "%",
      pct: soil,
      tone: riskTone(soil - 20),
      info: "An estimate of how soaked the ground already is, combining current humidity with the rain that has fallen. Wetter soil soaks up less new rain, so more water stays on the streets.",
    },
    {
      label: "Drainage Capacity",
      value: wx ? `${drain}` : "…",
      unit: "% left",
      pct: drain,
      tone: riskTone(100 - drain),
      info: "How much of the city's drain network is still free, worked out by subtracting today's rainfall load from normal capacity. As it drops, water sits on roads longer before draining away.",
    },
    {
      label: "AI Risk Index",
      value: wx ? (maxRisk >= 70 ? "High" : maxRisk >= 40 ? "Moderate" : "Low") : "…",
      unit: `${(maxRisk / 10).toFixed(1)}/10`,
      pct: maxRisk,
      tone: riskTone(maxRisk),
      info: "For each of the next 24 hours the model takes Google's rain probability and expected rainfall, adds this city's flood tendency, and turns it into a 0–100 waterlogging score. The highest hourly score becomes the index.",
    },
    {
      label: "Humidity",
      value: wx ? `${wx.humidity}` : "…",
      unit: "%",
      pct: wx?.humidity ?? 0,
      tone: riskTone((wx?.humidity ?? 0) - 30),
      info: "Relative humidity reported live by Google's weather feed. Very humid air means clouds hold more moisture and rain spells last longer.",
    },
    {
      label: "Expected Rain (24h)",
      value: wx ? `${slots.reduce((a, b) => a + b.mm, 0).toFixed(1)}` : "…",
      unit: "mm",
      pct: Math.min(100, slots.reduce((a, b) => a + b.mm, 0) * 2),
      tone: riskTone(slots.reduce((a, b) => a + b.mm, 0) * 2),
      info: "The sum of Google's hour-by-hour rainfall forecast for the next 24 hours across the city.",
    },
    {
      label: "Peak Rain Chance",
      value: wx ? `${Math.max(0, ...slots.map((s) => s.rainChance))}` : "…",
      unit: "%",
      pct: Math.max(0, ...slots.map((s) => s.rainChance)),
      tone: riskTone(Math.max(0, ...slots.map((s) => s.rainChance))),
      info: "The highest hourly rain probability in Google's 24-hour forecast for this city.",
    },
    {
      label: "Peak Risk Time",
      value: peak ? peak.t : "…",
      unit: "IST",
      pct: maxRisk,
      tone: riskTone(maxRisk),
      info: "The clock time in the next 24 hours when the model's waterlogging score is at its highest.",
    },
    {
      label: "Waterlogged Areas",
      value: `${zones.filter((z) => z.level !== "safe").length}`,
      unit: `of ${zones.length}`,
      pct: (zones.filter((z) => z.level !== "safe").length / zones.length) * 100,
      tone: riskTone((zones.filter((z) => z.level !== "safe").length / zones.length) * 100),
      info: "How many of the tracked neighbourhoods currently report standing water (amber or red on the map).",
    },
  ];

  const hoursMm = slots.reduce((a, b) => a + b.mm, 0);
  const mult = sel.level === "critical" ? 1.6 : sel.level === "warn" ? 1.2 : 1;
  const expMm = (hoursMm * mult).toFixed(1);
  const logChance = Math.min(97, Math.round((peak?.risk ?? 10) * (sel.level === "critical" ? 1.1 : sel.level === "warn" ? 0.8 : 0.35)));
  const actions: Record<Level, string[]> = {
    safe: ["Normal travel is fine", "Keep phone charged and check back hourly"],
    warn: ["Avoid underpasses; use main roads", "Leave early — expect slow traffic", "Move vehicles off low ground"],
    critical: ["Do not walk or drive through this area", "Stay on higher floors if nearby", "Call 112 if stranded"],
  };

  return (
    <div className="min-h-screen">
      <div className="relative mx-auto max-w-7xl">
      {wx && <WeatherFx cond={wx.cond} mm={wx.mmNow} />}
      <header className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6">
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
      <section className="relative px-4 pb-6">
        <Carousel label="metrics">
          {metrics.map((m) => (
            <div key={m.label} className="relative shrink-0 basis-1/2 snap-start px-3 py-2 lg:basis-1/4 border-l border-border/50 first:border-l-0">
              <button
                type="button"
                aria-label={`How ${m.label} is predicted`}
                onClick={() => setInfoOpen(infoOpen === m.label ? null : m.label)}
                className="absolute right-3 top-2 z-10 grid h-5 w-5 place-items-center rounded-full border border-border text-[10px] font-bold italic text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                i
              </button>
              <p className="pr-6 text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className={`mt-2 font-display text-2xl font-bold md:text-3xl ${toneText[m.tone]}`}>
                {m.value} <span className="text-sm font-normal text-muted-foreground">{m.unit}</span>
              </p>
              {infoOpen === m.label && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1">{m.info}</p>
              )}
            </div>
          ))}
        </Carousel>
      </section>
      </div>
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12">
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
              {sel.water !== "—" && (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-foreground">
                    <div className="rounded-md bg-background/40 p-2"><div className="text-muted-foreground">🌧️ Expected rain (24h)</div><b className="text-base">{wx ? `${expMm} mm` : "…"}</b></div>
                    <div className="rounded-md bg-background/40 p-2"><div className="text-muted-foreground">🌊 Waterlogging chance</div><b className={`text-base ${toneText[riskTone(logChance)]}`}>{wx ? `${logChance}%` : "…"}</b></div>
                    <div className="rounded-md bg-background/40 p-2"><div className="text-muted-foreground">📏 Water depth</div><b className="text-base">{sel.water}</b></div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-foreground">Recommended action</p>
                  <ul className="mt-1 space-y-1 text-sm text-foreground/85">
                    {actions[sel.level].map((a) => <li key={a}>✔ {a}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-5 lg:col-span-2">
            <h2 className="mb-1 text-lg font-bold">AI Predictive Forecast</h2>
            <p className="mb-4 text-sm text-muted-foreground">Next 24 hours • swipe or use arrows • tap a time for details</p>
            {!wx && <p className="py-10 text-center text-sm text-muted-foreground">{wxErr ? "Weather data unavailable right now." : "Loading live weather…"}</p>}
            <Carousel label="forecast hours">
              {slots.map((f, i) => {
                const tone = riskTone(f.risk);
                const active = i === slotIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setSlotIdx(i)}
                    className={`m-1 flex shrink-0 basis-[calc(16.666%-0.5rem)] snap-start flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-all ${active ? "border-primary bg-primary/15 scale-[1.03]" : "border-border bg-secondary/60 hover:bg-secondary"}`}
                  >
                    <span className="text-xs font-semibold tabular-nums">{f.t}</span>
                    {f.icon.length > 4 ? <img src={f.icon} alt={f.cond} className="h-8 w-8" /> : <span className="text-2xl">{rainEmoji(f.rainChance)}</span>}
                    <span className="text-xs text-safe">💧 {f.rainChance}%</span>
                    <span className={`rounded-full px-1.5 text-[11px] font-bold ${toneBg[tone]}/20 ${toneText[tone]}`}>🌊 {f.risk}%</span>
                  </button>
                );
              })}
            </Carousel>
            <TrendChart data={slots} active={slotIdx} onPick={setSlotIdx} />
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

function Carousel({ children, label }: { children: import("react").ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth, behavior: "smooth" });
  const btn = "absolute top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/80 text-primary shadow transition-transform hover:scale-110";
  return (
    <div className="relative px-6">
      <button type="button" aria-label={`Previous ${label}`} onClick={() => go(-1)} className={`${btn} left-0`}>‹</button>
      <div ref={ref} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth" style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
      <button type="button" aria-label={`Next ${label}`} onClick={() => go(1)} className={`${btn} right-0`}>›</button>
    </div>
  );
}
