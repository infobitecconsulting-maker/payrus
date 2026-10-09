import { describe, expect, it } from "vitest";
import { featureForPath } from "./feature-routes.ts";

describe("featureForPath", () => {
  it("maps feature pages, including sub-pages, to their switch", () => {
    expect(featureForPath("/en/travel")).toBe("travel");
    expect(featureForPath("/fr/modules/invoicing")).toBe("modules");
    expect(featureForPath("/pt/payment-links")).toBe("payment_links");
    expect(featureForPath("/es/plans")).toBe("plans");
    expect(featureForPath("/en/organisation")).toBe("organisation");
  });
  it("leaves ungated pages alone", () => {
    expect(featureForPath("/en")).toBeUndefined();
    expect(featureForPath("/en/wallet")).toBeUndefined();
    expect(featureForPath("/en/admin")).toBeUndefined();
    expect(featureForPath("/en/transactions/ABC")).toBeUndefined();
  });
});
