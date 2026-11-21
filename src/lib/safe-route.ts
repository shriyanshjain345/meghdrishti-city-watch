import type { ShelterCandidate } from "./shelters";

export type GeoPoint = { lat: number; lng: number };

export type ShelterRouteResult =
  | { status: "found"; shelter: ShelterCandidate; path: GeoPoint[]; distanceMeters: number }
  | { status: "blocked"; nearest: ShelterCandidate | null; reason: string };

const EARTH_RADIUS_METERS = 6_371_000;
const LATITUDE_METERS = 111_320;

export function pointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) continue;
    if (a.lat > point.lat !== b.lat > point.lat) {
      const crossingLng = ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
      if (point.lng < crossingLng) inside = !inside;
    }
  }
  return inside;
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRadians = Math.PI / 180;
  const lat1 = a.lat * toRadians;
  const lat2 = b.lat * toRadians;
  const dLat = (b.lat - a.lat) * toRadians;
  const dLng = (b.lng - a.lng) * toRadians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function expandedPolygon(polygon: GeoPoint[], clearanceMeters: number): GeoPoint[] {
  if (polygon.length < 3) return polygon;
  const center = polygon.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat / polygon.length, lng: sum.lng + point.lng / polygon.length }),
    { lat: 0, lng: 0 },
  );
  const longitudeMeters = LATITUDE_METERS * Math.max(0.1, Math.cos((center.lat * Math.PI) / 180));
  return polygon.map((point) => {
    const north = (point.lat - center.lat) * LATITUDE_METERS;
    const east = (point.lng - center.lng) * longitudeMeters;
    const radius = Math.hypot(north, east);
    const factor = radius > 0 ? (radius + clearanceMeters) / radius : 1;
    return {
      lat: center.lat + (north * factor) / LATITUDE_METERS,
      lng: center.lng + (east * factor) / longitudeMeters,
    };
  });
}

function orientation(a: GeoPoint, b: GeoPoint, c: GeoPoint): number {
  return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
}

function segmentsCross(a: GeoPoint, b: GeoPoint, c: GeoPoint, d: GeoPoint): boolean {
  const epsilon = 1e-12;
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return ((abC > epsilon && abD < -epsilon) || (abC < -epsilon && abD > epsilon))
    && ((cdA > epsilon && cdB < -epsilon) || (cdA < -epsilon && cdB > epsilon));
}

function segmentIsClear(a: GeoPoint, b: GeoPoint, polygons: GeoPoint[][]): boolean {
  for (const polygon of polygons) {
    if (pointInPolygon(a, polygon) || pointInPolygon(b, polygon)) return false;
    for (let i = 0; i < polygon.length; i++) {
      const c = polygon[i];
      const d = polygon[(i + 1) % polygon.length];
      if (c && d && segmentsCross(a, b, c, d)) return false;
    }
    const samples = Math.min(80, Math.ceil(distanceMeters(a, b) / 80));
    for (let i = 1; i < samples; i++) {
      const ratio = i / samples;
      const sample = { lat: a.lat + (b.lat - a.lat) * ratio, lng: a.lng + (b.lng - a.lng) * ratio };
      if (pointInPolygon(sample, polygon)) return false;
    }
  }
  return true;
}

function shortestClearPath(start: GeoPoint, end: GeoPoint, blocked: GeoPoint[][]): GeoPoint[] | null {
  if (blocked.some((polygon) => pointInPolygon(start, polygon) || pointInPolygon(end, polygon))) return null;
  if (distanceMeters(start, end) < 1) return [start, end];

  const expanded = blocked.map((polygon) => expandedPolygon(polygon, 75));
  const nodes = [start, end, ...expanded.flat()];
  const graph: { to: number; distance: number }[][] = nodes.map(() => []);
  for (let from = 0; from < nodes.length; from++) {
    const a = nodes[from];
    if (!a) continue;
    for (let to = from + 1; to < nodes.length; to++) {
      const b = nodes[to];
      if (!b || !segmentIsClear(a, b, expanded)) continue;
      const distance = distanceMeters(a, b);
      graph[from]?.push({ to, distance });
      graph[to]?.push({ to: from, distance });
    }
  }

  const distances = nodes.map(() => Number.POSITIVE_INFINITY);
  const previous: (number | null)[] = nodes.map(() => null);
  const visited = new Set<number>();
  distances[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < distances.length; i++) {
      const candidate = distances[i];
      if (!visited.has(i) && candidate != null && candidate < best) {
        best = candidate;
        current = i;
      }
    }
    if (current < 0 || current === 1) break;
    visited.add(current);
    for (const edge of graph[current] ?? []) {
      if (visited.has(edge.to)) continue;
      const nextDistance = best + edge.distance;
      if (nextDistance < (distances[edge.to] ?? Number.POSITIVE_INFINITY)) {
        distances[edge.to] = nextDistance;
        previous[edge.to] = current;
      }
    }
  }

  if (!Number.isFinite(distances[1])) return null;
  const indexes = [1];
  let cursor = previous[1];
  while (cursor != null) {
    indexes.push(cursor);
    cursor = previous[cursor] ?? null;
  }
  indexes.reverse();
  return indexes.flatMap((index) => {
    const point = nodes[index];
    return point ? [point] : [];
  });
}

export function findNearestSafeShelterRoute(
  start: GeoPoint,
  shelters: ShelterCandidate[],
  deepWaterPolygons: GeoPoint[][],
): ShelterRouteResult {
  const sorted = shelters.slice().sort((a, b) => distanceMeters(start, a) - distanceMeters(start, b));
  const nearest = sorted[0] ?? null;
  if (deepWaterPolygons.some((polygon) => pointInPolygon(start, polygon))) {
    return {
      status: "blocked",
      nearest,
      reason: "The selected point is inside a displayed Deep Water area. Choose a point outside the red area to draw a corridor.",
    };
  }
  for (const shelter of sorted) {
    if (deepWaterPolygons.some((polygon) => pointInPolygon(shelter, polygon))) continue;
    const path = shortestClearPath(start, shelter, deepWaterPolygons);
    if (!path) continue;
    const distance = path.slice(1).reduce((sum, point, index) => {
      const previous = path[index];
      return previous ? sum + distanceMeters(previous, point) : sum;
    }, 0);
    return { status: "found", shelter, path, distanceMeters: distance };
  }
  return {
    status: "blocked",
    nearest,
    reason: "No candidate facility has a clear corridor around the displayed Deep Water areas.",
  };
}