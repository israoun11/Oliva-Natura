import type { Metadata } from "next";
import { get } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import EditorialPage from "@/components/editorial/EditorialPage";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const lang = getLang(), p = await get<any>("/api/pages/our-story");
  return p ? { title: pick(p.seo?.title, lang) || pick(p.title, lang), description: pick(p.seo?.description, lang) } : {};
}
export default async function OurStory() {
  const lang = getLang(), page = await get<any>("/api/pages/our-story");
  return <EditorialPage variant="story" lang={lang} page={page} />;
}
