import type { Metadata } from "next";
import Link from "next/link";
import HomepageFrame from "@/components/HomepageFrame";
import { get } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = getLang(), p = await get<any>("/api/pages/home");
  return {
    title: pick(p?.seo?.title, lang) || "OLIVA NATURA",
    description: pick(p?.seo?.description, lang) || undefined,
  };
}

export default async function Home() {
  const lang = getLang();
  const [products, page] = await Promise.all([
    get<any[]>("/api/products"),
    get<any>("/api/pages/home"),
  ]);

  return (
    <>
      <HomepageFrame />
      <main className="sr-only">
        <h1>OLIVA NATURA</h1>
        {page?.sections?.map((s: any) => (
          <section key={s.id}>
            <h2>{pick(s.content.heading, lang)}</h2>
            <p>{pick(s.content.body, lang)}</p>
          </section>
        ))}
        <ul>
          {products?.map((p: any) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`}>{pick(p.name, lang)}</Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
