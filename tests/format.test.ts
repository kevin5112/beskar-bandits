import { describe, expect, it } from "vitest";
import { formatGameDay, formatGameTime, formatRecord } from "../src/lib/format";

// 2026-08-07T23:30:00Z == Aug 7 2026, 7:30 PM EDT
const iso = "2026-08-07T23:30:00.000Z";

describe("formatGameDay/Time", () => {
  it("renders Eastern time regardless of machine TZ", () => {
    expect(formatGameDay(iso)).toBe("Fri, Aug 7");
    expect(formatGameTime(iso)).toBe("7:30 PM");
  });
  it("handles winter (EST) dates", () => {
    // 2026-01-10T00:30:00Z == Jan 9 2026, 7:30 PM EST
    expect(formatGameDay("2026-01-10T00:30:00.000Z")).toBe("Fri, Jan 9");
    expect(formatGameTime("2026-01-10T00:30:00.000Z")).toBe("7:30 PM");
  });
});

describe("formatRecord", () => {
  it("omits ties when zero", () => expect(formatRecord(12, 3, 0)).toBe("12-3"));
  it("includes ties when present", () => expect(formatRecord(12, 3, 1)).toBe("12-3-1"));
});
