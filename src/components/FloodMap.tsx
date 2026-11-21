import { useEffect, useRef, useState } from "react";
import { loadMaps, DARK_MAP_STYLE } from "@/lib/maps-loader";
import { findNearestSafeShelterRoute, pointInPolygon, type ShelterRouteResult } from "@/lib/safe-route";
import { sheltersForCity } from "@/lib/shelters";

export type Level = "safe" | "warn" | "critical";
export type Zone = { name: string; level: Level; lat: number; lng: number; r: number; water: string; detail: string };
export type PointInfo = { name: string; level: Level; water: string; detail: string; lat: number; lng: number };

const COLORS: Record<Level, string> = { safe: "#3b82f6", warn: "#f59e0b", critical: "#ef4444" };

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (bLat - aLat) * toR, dLng = (bLng - aLng) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

import OUTLINES from "./city-outlines.json";

type LL = { lat: number; lng: number };
type Blob = { path: LL[]; level: Level };
const DESC: Record<Level, { water: string; detail: string }> = {
  safe: { water: "0–3 cm", detail: "Clear roads and area." },
  warn: { water: "15–30 cm", detail: "Underpass slow to drain." },
  critical: { water: "45–80 cm", detail: "Narrow lanes holding water." },
};
const RANK: Record<Level, number> = { safe: 1, warn: 2, critical: 3 };

function seeded(n: number) {
  let x = Math.sin(n) * 10000;
  return () => { x = Math.sin(x) * 10000; return x - Math.floor(x); };
}

// irregular, smooth-ish blob around a point
function blob(lat: number, lng: number, r: number, seed: number): LL[] {
  const rnd = seeded(seed);
  const n = 18, mLat = 111000, mLng = 111000 * Math.cos((lat * Math.PI) / 180);
  const k = Array.from({ length: n }, () => 0.6 + rnd() * 0.8);
  return k.map((_, i) => {
    const rr = r * (k[i]! * 0.5 + (k[(i + 1) % n]! + k[(i + n - 1) % n]!) * 0.25);
    const a = (i / n) * Math.PI * 2;
    return { lat: lat + (Math.sin(a) * rr) / mLat, lng: lng + (Math.cos(a) * rr * 1.25) / mLng };
  });
}

export function outlineOf(city: string): LL[][] {
  const rings = (OUTLINES as Record<string, number[][][]>)[city] ?? [];
  return rings.map((r) => r.map(([lat, lng]) => ({ lat: lat!, lng: lng! })));
}

export function buildBlobs(zones: Zone[]): Blob[] {
  const out: Blob[] = [];
  zones.forEach((z, i) => {
    if (z.level === "safe") return;
    out.push({ level: "warn", path: blob(z.lat, z.lng, z.r * 1.9, i * 13 + 1) });
  });
  zones.forEach((z, i) => {
    if (z.level !== "critical") return;
    out.push({ level: "critical", path: blob(z.lat, z.lng, z.r * 0.9, i * 29 + 7) });
  });
  return out;
}

export function infoAt(zones: Zone[], lat: number, lng: number, blobs: Blob[], outline: LL[][]): PointInfo {
  let near: Zone | undefined, nd = Infinity;
  for (const z of zones) { const d = dist(z.lat, z.lng, lat, lng); if (d < nd) { nd = d; near = z; } }
  const name = near ? `Near ${near.name}` : "Selected location";
  let level: Level = "safe";
  for (const b of blobs) if (RANK[b.level] > RANK[level] && pointInPolygon({ lat, lng }, b.path)) level = b.level;
  if (level === "safe" && !outline.some((r) => pointInPolygon({ lat, lng }, r)))
    return { name: "Outside city limits", level: "safe", water: "—", detail: "Not covered by this city's report.", lat, lng };
  return { name, level, ...DESC[level], lat, lng };
}

export default function FloodMap({ city, center, zones, selected, onPick, shelterMode, onShelterRoute }: {
  city: string;
  center: { lat: number; lng: number };
  zones: Zone[];
  selected: PointInfo;
  onPick: (p: PointInfo) => void;
  shelterMode: boolean;
  onShelterRoute: (result: ShelterRouteResult | null) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const shapes = useRef<any[]>([]);
  const marker = useRef<any>(null);
  const shelterMarkers = useRef<any[]>([]);
  const routeLine = useRef<any>(null);
  const infoWindow = useRef<any>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const routeRef = useRef(onShelterRoute);
  routeRef.current = onShelterRoute;
  const zonesRef = useRef(zones);
  zonesRef.current = zones;
  const blobsRef = useRef<Blob[]>([]);
  const outlineRef = useRef<LL[][]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadMaps()
      .then(() => {
        if (!el.current || map.current) return;
        const g = window.google;
        map.current = new g.maps.Map(el.current, {
          center, zoom: 11, clickableIcons: false, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
          styles: DARK_MAP_STYLE,
        });
        infoWindow.current = new g.maps.InfoWindow();
        const handle = (lat: number, lng: number) => {
          if (marker.current) marker.current.setMap(null);
          marker.current = new g.maps.Marker({ position: { lat, lng }, map: map.current });
          pickRef.current(infoAt(zonesRef.current, lat, lng, blobsRef.current, outlineRef.current));
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
    const outline = outlineOf(city);
    const blobs = buildBlobs(zones);
    blobsRef.current = blobs;
    outlineRef.current = outline;
    const click = (e: any) => map.current.__handle(e.latLng.lat(), e.latLng.lng());
    const cells: any[] = [];
    const base = new g.maps.Polygon({
      map: map.current, paths: outline, strokeColor: COLORS.safe, strokeWeight: 2.5, strokeOpacity: 0.95,
      fillColor: COLORS.safe, fillOpacity: 0.16, zIndex: 1,
    });
    base.addListener("click", click);
    cells.push(base);
    for (const b of blobs) {
      const p = new g.maps.Polygon({
        map: map.current, paths: b.path, strokeColor: COLORS[b.level], strokeWeight: 2, strokeOpacity: 0.95,
        fillColor: COLORS[b.level], fillOpacity: b.level === "warn" ? 0.32 : 0.5, zIndex: RANK[b.level],
      });
      p.addListener("click", click);
      cells.push(p);
    }
    if (outline.length) {
      const bounds = new g.maps.LatLngBounds();
      outline.flat().forEach((pt) => bounds.extend(pt));
      map.current.fitBounds(bounds, 10);
    }
    shapes.current = cells;
  }, [ready, city, center.lat, center.lng, zones]);

  useEffect(() => {
    if (!ready) return;
    const g = window.google;
    shelterMarkers.current.forEach((item) => item.setMap(null));
    shelterMarkers.current = [];
    routeLine.current?.setMap(null);
    routeLine.current = null;
    infoWindow.current?.close();
    if (!shelterMode) {
      routeRef.current(null);
      return;
    }

    const candidates = sheltersForCity(city);
    const deepWater = buildBlobs(zones).filter((area) => area.level === "critical").map((area) => area.path);
    const result = findNearestSafeShelterRoute({ lat: selected.lat, lng: selected.lng }, candidates, deepWater);
    routeRef.current(result);
    const nearestName = result.status === "found" ? result.shelter.name : result.nearest?.name;

    candidates.forEach((candidate) => {
      const isNearest = candidate.name === nearestName;
      const shelterMarker = new g.maps.Marker({
        position: { lat: candidate.lat, lng: candidate.lng },
        map: map.current,
        title: `${candidate.name} — candidate facility, verify locally`,
        label: { text: isNearest ? "★" : "R", color: "#ffffff", fontSize: "12px", fontWeight: "700" },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: isNearest ? 10 : 8,
          fillColor: isNearest ? "#0f766e" : "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        zIndex: isNearest ? 100 : 50,
      });
      shelterMarker.addListener("click", () => {
        const content = document.createElement("div");
        const title = document.createElement("strong");
        const detail = document.createElement("div");
        title.textContent = candidate.name;
        detail.textContent = `${candidate.kind} · candidate only; confirm availability locally`;
        content.append(title, detail);
        infoWindow.current?.setContent(content);
        infoWindow.current?.open({ map: map.current, anchor: shelterMarker });
      });
      shelterMarkers.current.push(shelterMarker);
    });

    if (result.status === "found") {
      routeLine.current = new g.maps.Polyline({
        map: map.current,
        path: result.path,
        geodesic: true,
        strokeColor: "#0f766e",
        strokeOpacity: 0.95,
        strokeWeight: 5,
        zIndex: 90,
      });
    }

    return () => {
      shelterMarkers.current.forEach((item) => item.setMap(null));
      shelterMarkers.current = [];
      routeLine.current?.setMap(null);
      routeLine.current = null;
      infoWindow.current?.close();
    };
  }, [ready, city, zones, selected.lat, selected.lng, shelterMode]);

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
