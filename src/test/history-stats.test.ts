import { describe, expect, it } from "vitest";
import { category, checkWindow, expand, monsoonSeasons, byYear, ruleScore, IMD } from "@/lib/history-stats";
import { FLOOD_EVENTS } from "@/lib/flood-events";

describe("IMD rain categories", () => {
  it("64.5 mm is heavy", () => expect(category(64.5)).toBe("heavy"));
  it("115.6 mm is very heavy", () => expect(category(115.6)).toBe("veryHeavy"));
  it("204.5 mm is extremely heavy", () => expect(category(204.5)).toBe("extreme"));
  it("missing day stays uncategorised", () => expect(category(null)).toBe("none"));
});

describe("hindcast rules", () => {
  const days = expand("2021-07-13", [10, 20, 30, 60, 5]);
  const index = new Map(days.map((d, i) => [d.date, i]));
  it("rule adds half of the previous 3 days", () => expect(ruleScore(days, 3)).toBe(60 + 0.5 * (10 + 20 + 30)));
  it("baseline misses 60 mm but the rule flags it after wet days", () => {
    const c = checkWindow(days, index, "2021-07-16", "2021-07-16");
    expect(c.baselineHit).toBe(false);
    expect(c.ruleHit).toBe(true);
  });
  it("missing rainfall is not scored", () => {
    const gap = expand("2021-07-13", [null, null]);
    const c = checkWindow(gap, new Map(gap.map((d, i) => [d.date, i])), "2021-07-13", "2021-07-14");
    expect(c.gridMax).toBeNull();
    expect(c.baselineHit).toBeNull();
  });
});

describe("monsoon seasons", () => {
  it("an incomplete season gets no anomaly", () => {
    const s = monsoonSeasons(byYear(expand("2024-06-01", Array(30).fill(IMD.heavy))));
    expect(s[0]!.complete).toBe(false);
    expect(s[0]!.pct).toBeNull();
  });
});

describe("documented events", () => {
  it("every event cites at least one source", () => {
    for (const e of FLOOD_EVENTS) expect(e.sources.length).toBeGreaterThan(0);
  });
  it("26 July 2005 records 944 mm at Santacruz", () => {
    expect(FLOOD_EVENTS.find((e) => e.id === "2005-07-26")!.rainfall[0]).toMatchObject({ mm: 944, station: "IMD Santacruz" });
  });
});
