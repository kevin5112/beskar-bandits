import { describe, expect, it } from "vitest";
import { battingAvg, computeSeasonStats, computeTeamRecord, type StatLineInput } from "../src/lib/stats";

const line = (over: Partial<StatLineInput>): StatLineInput => ({
  player_id: "p1", player_name: "Alex", jersey_number: 7,
  ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, ...over,
});

describe("battingAvg", () => {
  it("formats sub-1 without leading zero", () => expect(battingAvg(1, 2)).toBe(".500"));
  it("formats perfect", () => expect(battingAvg(3, 3)).toBe("1.000"));
  it("dashes zero at-bats", () => expect(battingAvg(0, 0)).toBe("—"));
  it("rounds to 3 places", () => expect(battingAvg(1, 3)).toBe(".333"));
  it("rounds a non-trivial repeating decimal", () => expect(battingAvg(2, 7)).toBe(".286"));
});

describe("computeSeasonStats", () => {
  it("aggregates across games and counts games played", () => {
    const rows = computeSeasonStats([
      line({ ab: 3, h: 2, hr: 1, rbi: 2 }),
      line({ ab: 4, h: 1, bb: 1 }),
      line({ player_id: "p2", player_name: "Sam", jersey_number: 23, ab: 4, h: 4 }),
    ]);
    const alex = rows.find((r) => r.player_id === "p1")!;
    expect(alex.games).toBe(2);
    expect(alex.ab).toBe(7);
    expect(alex.h).toBe(3);
    expect(alex.avg).toBeCloseTo(3 / 7);
  });
  it("sorts by avg desc, no-AB players last", () => {
    const rows = computeSeasonStats([
      line({ player_id: "a", player_name: "A", ab: 4, h: 1 }),
      line({ player_id: "b", player_name: "B", ab: 4, h: 4 }),
      line({ player_id: "c", player_name: "C", ab: 0, bb: 2 }),
    ]);
    expect(rows.map((r) => r.player_id)).toEqual(["b", "a", "c"]);
  });
  it("breaks equal-avg ties by higher hits", () => {
    const rows = computeSeasonStats([
      line({ player_id: "p1", player_name: "P1", ab: 4, h: 2 }),
      line({ player_id: "p2", player_name: "P2", ab: 8, h: 4 }),
    ]);
    expect(rows[0].avg).toBe(rows[1].avg);
    expect(rows.map((r) => r.player_id)).toEqual(["p2", "p1"]);
  });
  it("sums every field across games without transposing accumulators", () => {
    const rows = computeSeasonStats([
      line({ r: 1, doubles: 2, triples: 3, hr: 4, rbi: 5, bb: 6, k: 7 }),
      line({ r: 1, doubles: 1, triples: 1, hr: 1, rbi: 1, bb: 1, k: 1 }),
    ]);
    const p1 = rows.find((r) => r.player_id === "p1")!;
    expect(p1.r).toBe(2);
    expect(p1.doubles).toBe(3);
    expect(p1.triples).toBe(4);
    expect(p1.hr).toBe(5);
    expect(p1.rbi).toBe(6);
    expect(p1.bb).toBe(7);
    expect(p1.k).toBe(8);
  });
});

describe("computeTeamRecord", () => {
  it("counts only finals", () => {
    expect(computeTeamRecord([
      { status: "final", our_score: 10, their_score: 5 },
      { status: "final", our_score: 4, their_score: 9 },
      { status: "final", our_score: 7, their_score: 7 },
      { status: "upcoming", our_score: null, their_score: null },
      { status: "canceled", our_score: null, their_score: null },
    ])).toEqual({ w: 1, l: 1, t: 1 });
  });
  it("ignores finals with null scores", () => {
    expect(computeTeamRecord([
      { status: "final", our_score: 10, their_score: 5 },
      { status: "final", our_score: 4, their_score: 9 },
      { status: "final", our_score: null, their_score: null },
    ])).toEqual({ w: 1, l: 1, t: 0 });
  });
});
