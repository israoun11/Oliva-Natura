"use client";
import { createContext, useContext } from "react";
import { Lang } from "./i18n";
// The language is resolved once on the server (cookie / site default) and provided to client components,
// so client pages render in the right language on first paint (no English flash, no hydration mismatch).
const Ctx = createContext<Lang>("en");
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) { return <Ctx.Provider value={lang}>{children}</Ctx.Provider>; }
export const useLang = (): Lang => useContext(Ctx);
