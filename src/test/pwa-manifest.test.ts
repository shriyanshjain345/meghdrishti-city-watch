import { describe, expect, it } from "vitest";
import manifest from "../../public/manifest.json";

describe("install manifest", () => {
  it("uses the requested MeghDrishti app identity and colors", () => {
    expect(manifest.name).toBe("MeghDrishti City Watch");
    expect(manifest.short_name).toBe("MeghDrishti");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#0ea5e9");
    expect(manifest.background_color).toBe("#f8fafc");
  });

  it("references standard 192 and 512 pixel icons", () => {
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);
  });
});