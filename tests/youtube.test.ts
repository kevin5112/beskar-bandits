import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "../src/lib/youtube";

describe("parseYouTubeId", () => {
  it("parses watch URLs", () => expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("parses short links", () => expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=5")).toBe("dQw4w9WgXcQ"));
  it("parses shorts", () => expect(parseYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("accepts a raw 11-char id", () => expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ"));
  it("rejects garbage", () => expect(parseYouTubeId("not a video")).toBeNull());
});
