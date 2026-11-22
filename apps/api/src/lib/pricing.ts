export type Line = { unitPrice: number; quantity: number };
export type ShippingRule = { fee: number; freeOver?: number | null; enabled: boolean };
export class ShippingUnavailable extends Error {}

export function computeTotals(lines: Line[], rule: ShippingRule | undefined) {
  if (!rule || !rule.enabled) throw new ShippingUnavailable("Shipping is not configured for this country");
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const free = rule.freeOver != null && subtotal >= rule.freeOver;
  const shippingFee = free ? 0 : rule.fee;
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}

const WA = { en: ["Hello OLIVA NATURA, I would like to order:", "Total"], fr: ["Bonjour OLIVA NATURA, je souhaite commander :", "Total"], ar: ["مرحبا OLIVA NATURA، أود طلب:", "الإجمالي"] } as const;
export function whatsappLink(number: string, lines: { name: string; quantity: number; price: string }[], currency: string, total: string, locale: "en" | "fr" | "ar" = "en") {
  const digits = number.replace(/[^0-9]/g, "");
  const [hello, totalLabel] = WA[locale] ?? WA.en;
  const body = [hello, ...lines.map(l => `- ${l.name} x${l.quantity} (${l.price})`), `${totalLabel}: ${total} ${currency}`].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

type Priced = { priceTnd: number; priceEur: number | null; salePriceTnd: number | null; salePriceEur: number | null };
// Server-side effective unit price: sale price only counts when it is a real discount.
export function effectivePrice(p: Priced, cur: "TND" | "EUR"): number | null {
  const base = cur === "TND" ? p.priceTnd : p.priceEur;
  const sale = cur === "TND" ? p.salePriceTnd : p.salePriceEur;
  if (base == null) return null;
  return sale != null && sale > 0 && sale < base ? sale : base;
}
