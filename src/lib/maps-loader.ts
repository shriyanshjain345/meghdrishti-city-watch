declare global {
  interface Window {
    google?: any;
    __meghMapsReady?: () => void;
  }
}

let loader: Promise<void> | null = null;

export function loadMaps() {
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

// Light, low-noise map style matching the bright theme (name kept for existing imports).
export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f4f7fb" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5b70" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe6f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dde4ee" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];
