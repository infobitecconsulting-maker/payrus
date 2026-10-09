import { describe, expect, it } from "vitest";
import { addDaysISO, bookingErrorKey, durationHours, nightsBetween, priceQuote } from "./travel-utils.ts";

describe("priceQuote (mirrors book_travel in migration 0062)", () => {
  it("applies the member discount to price x passengers", () => {
    const q = priceQuote(847, 2, 7, false);
    expect(q.base).toBe(1694);
    expect(q.discount).toBe(118.58);
    expect(q.total).toBe(1575.42);
    expect(q.chargedNow).toBe(1575.42);
  });

  it("splits pay-in-three 34/33/33 and charges instalment 1 plus the 2.5% fee now", () => {
    const q = priceQuote(185, 3, 15, true);
    expect(q.total).toBe(471.75);
    expect(q.term1).toBe(160.4);
    expect(q.fee).toBe(11.79);
    expect(q.chargedNow).toBe(172.19);
    expect(Math.round((q.term1 + q.term2 + q.term3) * 100) / 100).toBe(q.total);
  });
});

describe("dates", () => {
  it("adds days across a month boundary", () => {
    expect(addDaysISO("2026-10-30", 3)).toBe("2026-11-02");
  });
  it("counts nights between check-in and check-out", () => {
    expect(nightsBetween("2026-10-03", "2026-10-06")).toBe(3);
  });
});

describe("helpers", () => {
  it("reads flight durations", () => {
    expect(durationHours("10h 15m")).toBeCloseTo(10.25);
    expect(durationHours("3h")).toBe(3);
    expect(durationHours("n/a")).toBe(Infinity);
  });
  it("maps database refusals to translation keys", () => {
    expect(bookingErrorKey(new Error("book_travel: sold out (2 seat(s) left)"))).toBe("travel.error.soldOut");
    expect(bookingErrorKey(new Error("apply_wallet_transfer: insufficient balance (need 1, have 0)"))).toBe("travel.error.insufficient");
    expect(bookingErrorKey(new Error("something else"))).toBe("travel.bookingFailed");
  });
});
