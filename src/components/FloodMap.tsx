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

export function infoAt(zones: Zone[], lat: number, lng: number): PointInfo {
  const rank: Record<Level, number> = { critical: 3, warn: 2, safe: 1 };
  const hits = zones.filter((z) => dist(z.lat, z.lng, lat, lng) <= z.r).sort((a, b) => rank[b.level] - rank[a.level]);
  const z = hits[0];
  if (z) return { name: z.name, level: z.level, water: z.water, detail: z.detail, lat, lng };
  return { name: "Selected location", level: "safe", water: "0–3 cm", detail: "No standing water reported here.", lat, lng };
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
    shapes.current = zones.map((z) => {
      const c = new g.maps.Circle({
        map: map.current, center: { lat: z.lat, lng: z.lng }, radius: z.r,
        strokeColor: COLORS[z.level], strokeWeight: 2, fillColor: COLORS[z.level], fillOpacity: 0.3,
        zIndex: z.level === "critical" ? 3 : z.level === "warn" ? 2 : 1,
      });
      c.addListener("click", (e: any) => map.current.__handle(e.latLng.lat(), e.latLng.lng()));
      return c;
    });
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
