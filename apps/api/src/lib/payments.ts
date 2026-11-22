// Extensible payment architecture. Only COD is implemented. Card/local providers
// REQUIRE merchant accounts + credentials and are intentionally NOT simulated.
export interface PaymentProvider {
  id: string;
  isConfigured(): boolean;
  // Must verify provider signature server-side; never trust client-reported success.
  handleWebhook(rawBody: Buffer, headers: Record<string, string | undefined>): Promise<{ orderNumber: string; paid: boolean }>;
}
export const providers: Record<string, PaymentProvider> = {};
export function requireProvider(id: string): PaymentProvider {
  const p = providers[id];
  if (!p || !p.isConfigured()) throw new Error(`Payment provider "${id}" is not configured`);
  return p;
}
