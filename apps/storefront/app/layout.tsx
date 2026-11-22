import "./globals.css";
import { getLang } from "@/lib/lang";
import { isRtl } from "@/lib/i18n";
export const metadata = { metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"), title: { default: "OLIVA NATURA", template: "%s — OLIVA NATURA" }, description: "OLIVA NATURA" };
export default function Root({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (<html lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"}><head><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Jost:wght@300;400;500&family=Noto+Naskh+Arabic:wght@400;500&display=swap" rel="stylesheet" /></head><body>{children}</body></html>);
}
