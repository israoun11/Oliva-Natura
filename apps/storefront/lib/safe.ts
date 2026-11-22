// Only allow safe link targets (blocks javascript: / data: URLs coming from CMS or settings).
export const safeHref = (v: unknown): string => { const s = typeof v === "string" ? v.trim() : ""; return /^(\/(?!\/)|https?:\/\/|mailto:|tel:|#)/i.test(s) ? s : ""; };
