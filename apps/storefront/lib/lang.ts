import { cookies } from "next/headers";
import { LANGS, Lang } from "./i18n";
// Server-side language from the "lang" cookie (set by the switcher). Default English.
export const getLang = (): Lang => { const c = cookies().get("lang")?.value as Lang; return LANGS.includes(c) ? c : "en"; };
