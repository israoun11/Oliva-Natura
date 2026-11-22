import { describe, it, expect } from "vitest";
import { computeTotals, whatsappLink, ShippingUnavailable } from "../src/lib/pricing";
import { can } from "../src/auth";

describe("computeTotals", () => {
  const lines = [{ unitPrice: 10000, quantity: 2 }, { unitPrice: 5000, quantity: 1 }];
  it("adds shipping fee", () => expect(computeTotals(lines, { enabled: true, fee: 7000 })).toEqual({ subtotal: 25000, shippingFee: 7000, total: 32000 }));
  it("applies free shipping threshold", () => expect(computeTotals(lines, { enabled: true, fee: 7000, freeOver: 20000 }).shippingFee).toBe(0));
  it("refuses unconfigured shipping", () => { expect(() => computeTotals(lines, undefined)).toThrow(ShippingUnavailable); expect(() => computeTotals(lines, { enabled: false, fee: 0 })).toThrow(ShippingUnavailable); });
});
describe("whatsappLink", () => {
  it("builds an encoded wa.me link", () => {
    const u = whatsappLink("+216 12 345 678", [{ name: "Original 500 ml", quantity: 2, price: "10.000" }], "TND", "20.000");
    expect(u.startsWith("https://wa.me/21612345678?text=")).toBe(true);
    expect(decodeURIComponent(u)).toContain("Original 500 ml x2");
  });
});
describe("RBAC", () => {
  it("restricts roles", () => { expect(can("CONTENT_EDITOR", "orders")).toBe(false); expect(can("ORDER_MANAGER", "orders")).toBe(true); expect(can("SUPER_ADMIN", "users")).toBe(true); expect(can("STORE_MANAGER", "users")).toBe(false); });
});

import { effectivePrice } from "../src/lib/pricing";
describe("effectivePrice", () => {
  const p = { priceTnd: 20000, priceEur: 800, salePriceTnd: 15000, salePriceEur: null };
  it("uses a real sale price", () => expect(effectivePrice(p, "TND")).toBe(15000));
  it("ignores missing sale price", () => expect(effectivePrice(p, "EUR")).toBe(800));
  it("ignores sale >= price", () => expect(effectivePrice({ ...p, salePriceTnd: 25000 }, "TND")).toBe(20000));
  it("null when currency price absent", () => expect(effectivePrice({ ...p, priceEur: null }, "EUR")).toBeNull());
});

describe("whatsappLink locales", () => {
  it("localises the greeting", () => {
    const l = [{ name: "X", quantity: 1, price: "1.000" }];
    expect(decodeURIComponent(whatsappLink("+21612345678", l, "TND", "1.000", "fr"))).toContain("Bonjour");
    expect(decodeURIComponent(whatsappLink("+21612345678", l, "TND", "1.000", "ar"))).toContain("مرحبا");
  });
});

describe("whatsappLink locales", () => {
  it("localises the greeting", () => {
    const l = [{ name: "X", quantity: 1, price: "1.000" }];
    expect(decodeURIComponent(whatsappLink("+21612345678", l, "TND", "1.000", "fr"))).toContain("Bonjour");
    expect(decodeURIComponent(whatsappLink("+21612345678", l, "TND", "1.000", "ar"))).toContain("مرحبا");
  });
});
