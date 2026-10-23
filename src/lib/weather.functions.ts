import { createServerFn } from "@tanstack/react-start";

const COORDS: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.07, lng: 72.88 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
};

export type WeatherHour = { time: string; icon: string; cond: string; rainChance: number; mm: number; temp: number };
export type Weather = { temp: number; cond: string; icon: string; mmNow: number; humidity: number; hours: WeatherHour[] };

const cache = new Map<string, { at: number; data: Weather }>();
const GATEWAY = "https://connector-gateway.lovable.dev/google_maps/weather/v1";

async function call(path: string) {
  const r = await fetch(`${GATEWAY}/${path}`, {
    headers: {
      Authorization: `Bearer ${process.env['LOVABLE_API_KEY']}`,
      "X-Connection-Api-Key": process.env['GOOGLE_MAPS_API_KEY']!,
    },
  });
  if (!r.ok) throw new Error(`Weather request failed [${r.status}]: ${await r.text()}`);
  return r.json();
}

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((d: { city: string }) => {
    if (!COORDS[d.city]) throw new Error("Unknown city");
    return d;
  })
  .handler(async ({ data }): Promise<Weather> => {
    const hit = cache.get(data.city);
    if (hit && Date.now() - hit.at < 10 * 60_000) return hit.data;
    const { lat, lng } = COORDS[data.city]!;
    const q = `location.latitude=${lat}&location.longitude=${lng}`;
    const [cur, fc] = await Promise.all([
      call(`currentConditions:lookup?${q}`),
      call(`forecast/hours:lookup?${q}&hours=6`),
    ]);
    const out: Weather = {
      temp: Math.round(cur.temperature?.degrees ?? 0),
      cond: cur.weatherCondition?.description?.text ?? "—",
      icon: `${cur.weatherCondition?.iconBaseUri ?? ""}.svg`,
      mmNow: cur.precipitation?.qpf?.quantity ?? 0,
      humidity: cur.relativeHumidity ?? 0,
      hours: (fc.forecastHours ?? []).slice(0, 6).map((h: any) => ({
        time: h.interval?.startTime ?? "",
        icon: `${h.weatherCondition?.iconBaseUri ?? ""}.svg`,
        cond: h.weatherCondition?.description?.text ?? "—",
        rainChance: h.precipitation?.probability?.percent ?? 0,
        mm: h.precipitation?.qpf?.quantity ?? 0,
        temp: Math.round(h.temperature?.degrees ?? 0),
      })),
    };
    cache.set(data.city, { at: Date.now(), data: out });
    return out;
  });
