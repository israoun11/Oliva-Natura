import { NextRequest, NextResponse } from "next/server";
// First visit: set the language cookie to the default chosen in Admin > Settings > Languages.
export async function middleware(req: NextRequest) {
  if (req.cookies.get("lang")) return NextResponse.next();
  let def = "en";
  try {
    const r = await fetch((process.env.API_URL || "http://localhost:4000") + "/api/settings/public", { next: { revalidate: 60 } });
    const d = r.ok ? (await r.json())?.languages?.default : null;
    if (["en", "fr", "ar"].includes(d)) def = d;
  } catch { /* API unreachable: fall back to English */ }
  const headers = new Headers(req.headers);
  headers.set("cookie", (req.headers.get("cookie") ? req.headers.get("cookie") + "; " : "") + `lang=${def}`); // visible to this very request's server components
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("lang", def, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}
export const config = { matcher: ["/((?!_next/|api/|admin|homepage\.html|.*\..*).*)"] };
