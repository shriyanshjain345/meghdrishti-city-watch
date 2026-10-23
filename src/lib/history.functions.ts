import { createServerFn } from "@tanstack/react-start";

// Google Weather only keeps the last 24 hours of history, so multi-year daily
// rainfall comes from the Open-Meteo archive (ERA5 reanalysis, Copernicus/ECMWF).
export type RainHistory = {
  start: string;
  end: string;
  mm: (number | null)[];
  fetchedAt: string;
  lat: number;
  lng: number;
  elevation: number | null;
};

const START = "2000-01-01";
const LAT = 19.09;
const LNG = 72.85;
let cache: { at: number; data: RainHistory } | null = null;

export const getMumbaiRainHistory = createServerFn({ method: "GET" }).handler(async (): Promise<RainHistory> => {
  if (cache && Date.now() - cache.at < 12 * 3_600_000) return cache.data;
  // Archive lags real time by ~5 days; stop a week back (IST).
  const end = new Date(Date.now() + 5.5 * 3_600_000 - 7 * 86_400_000).toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LNG}` +
    `&start_date=${START}&end_date=${end}&daily=precipitation_sum&timezone=Asia%2FKolkata`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Rainfall archive request failed [${r.status}]: ${await r.text()}`);
  const j = (await r.json()) as {
    latitude: number;
    longitude: number;
    elevation?: number;
    daily?: { time: string[]; precipitation_sum: (number | null)[] };
  };
  const times = j.daily?.time ?? [];
  const mm = j.daily?.precipitation_sum ?? [];
  // Trim trailing days the archive has not filled yet.
  let n = mm.length;
  while (n > 0 && mm[n - 1] == null) n--;
  const data: RainHistory = {
    start: times[0] ?? START,
    end: times[n - 1] ?? end,
    mm: mm.slice(0, n).map((v) => (v == null ? null : Math.round(v * 10) / 10)),
    fetchedAt: new Date().toISOString(),
    lat: j.latitude,
    lng: j.longitude,
    elevation: j.elevation ?? null,
  };
  cache = { at: Date.now(), data };
  return data;
});
