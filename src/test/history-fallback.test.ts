import { describe, expect, it } from "vitest";
import { getMumbaiRainHistoryFallback } from "@/lib/history-fallback";
import { byYear, expand, monsoonSeasons } from "@/lib/history-stats";

describe("Mumbai offline rainfall archive", () => {
  const fallback = getMumbaiRainHistoryFallback();

  it("covers daily data from 2000 through September 2025", () => {
    expect(fallback.start).toBe("2000-01-01");
    expect(fallback.end).toBe("2025-09-30");
    expect(fallback.mm).toHaveLength(9405);
  });

  it("contains all 26 June–September monsoon seasons without missing days", () => {
    const days = expand(fallback.start, fallback.mm);
    const seasons = monsoonSeasons(byYear(days)).filter((season) => season.year >= 2000 && season.year <= 2025);
    expect(seasons).toHaveLength(26);
    expect(seasons.every((season) => season.complete)).toBe(true);
    expect(seasons.reduce((sum, season) => sum + days.filter((day) => day.date.startsWith(`${season.year}-`) && Number(day.date.slice(5, 7)) >= 6 && Number(day.date.slice(5, 7)) <= 9).length, 0)).toBe(3172);
  });
});