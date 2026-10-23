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

const STEP = 0.012, SPAN_LAT = 0.15, SPAN_LNG = 0.17;

export function levelAt(zones: Zone[], lat: number, lng: number): { level: Level; near?: Zone | undefined } {
  let best: { level: Level; near?: Zone | undefined } = { level: "safe" };
  let nearest: Zone | undefined, nd = Infinity;
  for (const z of zones) {
    const d = dist(z.lat, z.lng, lat, lng);
    if (d < nd) { nd = d; nearest = z; }
    if (z.level === "critical" && d <= z.r * 1.4) return { level: "critical", near: z };
    if (z.level !== "safe" && d <= z.r * 2.4) best = { level: "warn", near: z };
  }
  return best.near ? best : { level: "safe", near: nearest };
}

export function infoAt(zones: Zone[], lat: number, lng: number): PointInfo {
  const { level, near } = levelAt(zones, lat, lng);
  const area = near ? `Near ${near.name}` : "Selected location";
  if (near && near.level === level && dist(near.lat, near.lng, lat, lng) <= near.r)
    return { name: near.name, level, water: near.water, detail: near.detail, lat, lng };
  if (level === "critical") return { name: area, level, water: "45–60 cm", detail: "Deep water spreading from nearby hotspot.", lat, lng };
  if (level === "warn") return { name: area, level, water: "15–25 cm", detail: "Roads pooling; drains running slowly.", lat, lng };
  return { name: area, level, water: "0–5 cm", detail: "Drains flowing normally.", lat, lng };
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
          pickRef.current(infoAt(zonesRef.current, lat, lng));
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
    const cells: any[] = [];
    for (let la = center.lat - SPAN_LAT; la < center.lat + SPAN_LAT; la += STEP) {
      for (let ln = center.lng - SPAN_LNG; ln < center.lng + SPAN_LNG; ln += STEP) {
        const { level } = levelAt(zones, la + STEP / 2, ln + STEP / 2);
        const p = new g.maps.Polygon({
          map: map.current,
          paths: [
            { lat: la, lng: ln }, { lat: la + STEP, lng: ln },
            { lat: la + STEP, lng: ln + STEP }, { lat: la, lng: ln + STEP },
          ],
          strokeColor: COLORS[level], strokeOpacity: 0.35, strokeWeight: 0.5,
          fillColor: COLORS[level], fillOpacity: level === "safe" ? 0.18 : 0.38,
        });
        p.addListener("click", (e: any) => map.current.__handle(e.latLng.lat(), e.latLng.lng()));
        cells.push(p);
      }
    }
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
