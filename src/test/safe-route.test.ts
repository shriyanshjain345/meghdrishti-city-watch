import { describe, expect, it } from "vitest";
import { findNearestSafeShelterRoute, pointInPolygon, type GeoPoint } from "@/lib/safe-route";
import type { ShelterCandidate } from "@/lib/shelters";

const obstacle: GeoPoint[] = [
  { lat: -0.005, lng: -0.005 },
  { lat: -0.005, lng: 0.005 },
  { lat: 0.005, lng: 0.005 },
  { lat: 0.005, lng: -0.005 },
];

const target: ShelterCandidate = {
  city: "Test city",
  name: "Public hospital",
  kind: "Hospital",
  lat: 0,
  lng: 0.02,
};

describe("illustrative safe corridors", () => {
  it("routes around a Deep Water polygon rather than crossing it", () => {
    const result = findNearestSafeShelterRoute({ lat: 0, lng: -0.02 }, [target], [obstacle]);
    expect(result.status).toBe("found");
    if (result.status !== "found") return;
    expect(result.shelter.name).toBe("Public hospital");
    expect(result.path.length).toBeGreaterThan(2);
    for (let segment = 1; segment < result.path.length; segment++) {
      const a = result.path[segment - 1];
      const b = result.path[segment];
      if (!a || !b) continue;
      for (let step = 1; step < 20; step++) {
        const t = step / 20;
        expect(pointInPolygon({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }, obstacle)).toBe(false);
      }
    }
  });

  it("does not draw a route when the selected point is inside Deep Water", () => {
    const result = findNearestSafeShelterRoute({ lat: 0, lng: 0 }, [target], [obstacle]);
    expect(result.status).toBe("blocked");
    if (result.status === "blocked") expect(result.nearest?.name).toBe("Public hospital");
  });
});