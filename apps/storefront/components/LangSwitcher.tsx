"use client";
import { useRouter } from "next/navigation";
import { Lang } from "@/lib/i18n";
const LABEL: Record<Lang, string> = { en: "EN", fr: "FR", ar: "عربي" };
export default function LangSwitcher({ lang, enabled }: { lang: Lang; enabled: Lang[] }) {
  const r = useRouter();
  if (enabled.length < 2) return null;
  return <span role="group" aria-label="Language">{enabled.map(l => <button key={l} className={"lang" + (l === lang ? " on" : "")} aria-pressed={l === lang} onClick={() => { document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`; r.refresh(); }}>{LABEL[l]}</button>)}</span>;
}
