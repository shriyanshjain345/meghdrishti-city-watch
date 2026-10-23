import { useEffect, useRef, useState } from "react";

export type Level = "safe" | "warn" | "critical";
export type Zone = { name: string; level: Level; lat: number; lng: number; r: number; water: string; detail: string };
export type PointInfo = { name: string; level: Level; water: string; detail: string; lat: number; lng: number };

const COLORS: Record<Level, string> = { safe: "#22c55e", warn: "#eab308", critical: "#ef4444" };

declare global {
  interface Window {
    google?: any;
    __meghMapsReady?: () => void;
  }
}

let loader: Promise<void> | null = null;
function loadMaps() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__meghMapsReady = () => resolve();
    const env = import.meta.env as Record<string, string | undefined>;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&loading=async&callback=__meghMapsReady&channel=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"]}`;
    s.async = true;
    s.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(s);
  });
  return loader;
}

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (bLat - aLat) * toR, dLng = (bLng - aLng) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

type Blob = { lat: number; lng: number; r: number; level: Level };
const DESC: Record<Level, { water: string; detail: string }> = {
  safe: { water: "0–3 cm", detail: "Clear roads and area." },
  warn: { water: "15–30 cm", detail: "Underpass slow to drain." },
  critical: { water: "45–80 cm", detail: "Narrow lanes holding water." },
};
const RANK: Record<Level, number> = { safe: 1, warn: 2, critical: 3 };

function ring(z: Zone, count: number, spread: number, rr: number, level: Level, out: Blob[]) {
  const mPerLat = 111000, mPerLng = 111000 * Math.cos((z.lat * Math.PI) / 180);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (z.lat * 7) % 1;
    out.push({ lat: z.lat + (Math.sin(a) * spread) / mPerLat, lng: z.lng + (Math.cos(a) * spread) / mPerLng, r: rr, level });
  }
}

export function buildBlobs(center: { lat: number; lng: number }, zones: Zone[]): Blob[] {
  const out: Blob[] = [];
  // green base: overlapping circles over the whole city
  for (let la = -0.15; la <= 0.15; la += 0.035)
    for (let ln = -0.17; ln <= 0.17; ln += 0.035)
      out.push({ lat: center.lat + la, lng: center.lng + ln, r: 2800, level: "safe" });
  for (const z of zones) {
    if (z.level === "safe") continue;
    out.push({ lat: z.lat, lng: z.lng, r: z.r * 1.5, level: "warn" });
    ring(z, 6, z.r * 1.4, z.r * 0.9, "warn", out);
  }
  for (const z of zones) {
    if (z.level !== "critical") continue;
    out.push({ lat: z.lat, lng: z.lng, r: z.r * 0.8, level: "critical" });
    ring(z, 4, z.r * 0.6, z.r * 0.45, "critical", out);
  }
  return out;
}

export function infoAt(zones: Zone[], lat: number, lng: number, blobs: Blob[]): PointInfo {
  let level: Level = "safe";
  for (const b of blobs) if (RANK[b.level] > RANK[level] && dist(b.lat, b.lng, lat, lng) <= b.r) level = b.level;
  let near: Zone | undefined, nd = Infinity;
  for (const z of zones) { const d = dist(z.lat, z.lng, lat, lng); if (d < nd) { nd = d; near = z; } }
  return { name: near ? `Near ${near.name}` : "Selected location", level, ...DESC[level], lat, lng };
}

export default function FloodMap({ center, zones, onPick }: { center: { lat: number; lng: number }; zones: Zone[]; onPick: (p: PointInfo) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const shapes = useRef<any[]>([]);
  const marker = useRef<any>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const zonesRef = useRef(zones);
  zonesRef.current = zones;
  const blobsRef = useRef<Blob[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadMaps()
      .then(() => {
        if (!el.current || map.current) return;
        const g = window.google;
        map.current = new g.maps.Map(el.current, {
          center, zoom: 11, clickableIcons: false, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1d2c3a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#9fb3c8" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0f1a24" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1622" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b3f52" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
          ],
        });
        const handle = (lat: number, lng: number) => {
          if (marker.current) marker.current.setMap(null);
          marker.current = new g.maps.Marker({ position: { lat, lng }, map: map.current });
          pickRef.current(infoAt(zonesRef.current, lat, lng, blobsRef.current));
        };
        map.current.addListener("click", (e: any) => handle(e.latLng.lat(), e.latLng.lng()));
        (map.current as any).__handle = handle;
        setReady(true);
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const g = window.google;
    shapes.current.forEach((s) => s.setMap(null));
    if (marker.current) marker.current.setMap(null);
    map.current.setCenter(center);
    map.current.setZoom(11);
    const blobs = buildBlobs(center, zones);
    blobsRef.current = blobs;
    const cells = blobs.map((b) => {
      const c = new g.maps.Circle({
        map: map.current, center: { lat: b.lat, lng: b.lng }, radius: b.r,
        strokeColor: COLORS[b.level], strokeOpacity: 0.5, strokeWeight: 1,
        fillColor: COLORS[b.level], fillOpacity: b.level === "safe" ? 0.12 : b.level === "warn" ? 0.3 : 0.45,
        zIndex: RANK[b.level],
      });
      c.addListener("click", (e: any) => map.current.__handle(e.latLng.lat(), e.latLng.lng()));
      return c;
    });
    shapes.current = cells;
  }, [ready, center.lat, center.lng, zones]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary">
      <div ref={el} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {err ?? "Loading map…"}
        </div>
      )}
    </div>
  );
}
