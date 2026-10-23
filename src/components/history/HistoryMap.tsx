import { useEffect, useRef, useState } from "react";
import { loadMaps, DARK_MAP_STYLE } from "@/lib/maps-loader";
import type { FloodEvent } from "@/lib/flood-events";
import OUTLINES from "../city-outlines.json";

export default function HistoryMap({ events, selectedId, onSelect }: { events: FloodEvent[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const pick = useRef(onSelect);
  pick.current = onSelect;
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadMaps()
      .then(() => {
        if (!el.current || map.current) return;
        const g = window.google;
        map.current = new g.maps.Map(el.current, {
          center: { lat: 19.07, lng: 72.87 }, zoom: 11, clickableIcons: false, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy", styles: DARK_MAP_STYLE,
        });
        const rings = ((OUTLINES as Record<string, number[][][]>)["Mumbai"] ?? []).map((r) => r.map(([lat, lng]) => ({ lat: lat!, lng: lng! })));
        if (rings.length) {
          new g.maps.Polygon({ map: map.current, paths: rings, strokeColor: "#2dd4bf", strokeOpacity: 0.8, strokeWeight: 1.5, fillColor: "#2dd4bf", fillOpacity: 0.05, clickable: false });
          const b = new g.maps.LatLngBounds();
          rings.flat().forEach((p) => b.extend(p));
          map.current.fitBounds(b, 8);
        }
        setReady(true);
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const g = window.google;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    class Pulse extends g.maps.OverlayView {
      pos: { lat: number; lng: number };
      node: HTMLDivElement;
      constructor(pos: { lat: number; lng: number }, node: HTMLDivElement) {
        super();
        this.pos = pos;
        this.node = node;
      }
      onAdd() {
        g.maps.OverlayView.preventMapHitsAndGesturesFrom(this.node);
        this.getPanes().overlayMouseTarget.appendChild(this.node);
      }
      draw() {
        const p = this.getProjection()?.fromLatLngToDivPixel(new g.maps.LatLng(this.pos.lat, this.pos.lng));
        if (p) { this.node.style.left = `${p.x}px`; this.node.style.top = `${p.y}px`; }
      }
      onRemove() { this.node.remove(); }
    }
    for (const e of events) {
      const on = e.id === selectedId;
      for (const p of e.places) {
        const node = document.createElement("div");
        node.className = `absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer grid place-items-center ${on ? "h-5 w-5 z-10" : "h-3.5 w-3.5"}`;
        node.title = `${p.name} — ${e.title}`;
        node.innerHTML = `<span class="ping-ring absolute inset-0 rounded-full ${on ? "bg-critical/70" : "bg-warn/50"}"></span><span class="relative block h-full w-full rounded-full border-2 border-background ${on ? "bg-critical" : "bg-warn"}"></span>`;
        node.addEventListener("click", () => pick.current(e.id));
        const o = new Pulse({ lat: p.lat, lng: p.lng }, node);
        o.setMap(map.current);
        overlays.current.push(o);
      }
    }
    const sel = events.find((e) => e.id === selectedId);
    if (sel?.places[0]) map.current.panTo({ lat: sel.places[0].lat, lng: sel.places[0].lng });
  }, [ready, events, selectedId]);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-secondary sm:aspect-[4/3] lg:aspect-[4/5]">
      <div ref={el} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-primary/40">
            <div className="radar-sweep absolute inset-0 rounded-full" />
          </div>
          <span className="absolute bottom-4">{err ?? "Loading map…"}</span>
        </div>
      )}
    </div>
  );
}
