import type { Metadata } from "next";
import { get } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import EditorialPage from "@/components/editorial/EditorialPage";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const lang = getLang(), p = await get<any>("/api/pages/from-our-land");
  return p ? { title: pick(p.seo?.title, lang) || pick(p.title, lang), description: pick(p.seo?.description, lang) } : {};
}
export default async function FromOurLand() {
  const lang = getLang(), page = await get<any>("/api/pages/from-our-land");
  return <EditorialPage variant="land" lang={lang} page={page} />;
}
