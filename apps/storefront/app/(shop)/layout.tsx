import Link from "next/link";
import { getLang } from "@/lib/lang";
import { tr, pick, LANGS, Lang } from "@/lib/i18n";
import { get } from "@/lib/api";
import { safeHref } from "@/lib/safe";
import LangSwitcher from "@/components/LangSwitcher";
import CartLink from "@/components/CartLink";
import Newsletter from "@/components/Newsletter";
import { LangProvider } from "@/lib/LangProvider";
export const dynamic = "force-dynamic";
export default async function Shop({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const s = await get<any>("/api/settings/public");
  const site = s?.site || {}, social = s?.social || {}, footer = s?.footer || {};
  const enabled: Lang[] = (s?.languages?.enabled || LANGS).filter((l: string) => (LANGS as readonly string[]).includes(l));
  const defaults: [string, string][] = [["/products", "collections"], ["/our-story", "story"], ["/from-our-land", "land"], ["/contact", "contact"]];
  const hidden = (h: string) => /^\/(our-philosophy|journal)(\/|$)/.test(h); // pages no longer linked publicly
  const custom: [string, string][] = (s?.navigation?.items || []).map((i: any) => [safeHref(i.href) || "/", pick(i.label, lang)] as [string, string]).filter(([h]: [string, string]) => !hidden(h));
  const items: [string, string][] = custom.length ? custom : defaults.map(([h, k]) => [h, tr(k, lang)] as [string, string]);
  return (<LangProvider lang={lang}><nav className="top" aria-label="Main"><Link className="brand" href="/">OLIVA NATURA</Link>
    <div className="links">{items.map(([h, l]) => <Link key={h + l} href={h}>{l}</Link>)}</div>
    <div className="right"><Link href="/wishlist" aria-label={tr("wishlist", lang)}>♡</Link><Link href="/account">{tr("account", lang)}</Link><CartLink label={tr("cart", lang)} /><LangSwitcher lang={lang} enabled={enabled} /></div></nav>
    {children}
    <footer className="site"><div><b style={{ letterSpacing: ".25em" }}>OLIVA NATURA</b><p className="muted" style={{ maxWidth: 280 }}>{pick(footer.tagline, lang)}</p>
      {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}{site.phone && <a href={`tel:${site.phone}`}>{site.phone}</a>}{site.address && <p>{site.address}</p>}
      {Object.entries(social).filter(([, v]) => safeHref(v)).map(([k, v]) => <a key={k} href={safeHref(v)} target="_blank" rel="noopener noreferrer">{k}</a>)}</div>
      <div><b>{tr("legal", lang)}</b><Link href="/privacy">{tr("privacy", lang)}</Link><Link href="/terms">{tr("terms", lang)}</Link><Link href="/shipping">{tr("shipping", lang)}</Link><Link href="/returns">{tr("returns", lang)}</Link><Link href="/cookies">{tr("cookies", lang)}</Link></div>
      <div><b>{tr("newsletter", lang)}</b><Newsletter lang={lang} /><p className="muted" style={{ fontSize: 12 }}>{pick(footer.copyright, lang)}</p></div></footer></LangProvider>);
}
