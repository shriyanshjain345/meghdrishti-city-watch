import archive from "./mumbai-rainfall-fallback.json";
import type { RainHistory } from "./history.functions";

export const HISTORY_ARCHIVE_TIMEOUT_MS = 12_000;

export function getMumbaiRainHistoryFallback(): RainHistory {
  return {
    start: archive.coverageStart,
    end: archive.coverageEnd,
    mm: archive.dailyPrecipitationMm,
    fetchedAt: archive.retrievedAt,
    lat: archive.latitude,
    lng: archive.longitude,
    elevation: archive.elevationMeters,
  };
}