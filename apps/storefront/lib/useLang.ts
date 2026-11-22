"use client";
import { useEffect, useState } from "react";
import { LANGS, Lang } from "./i18n";
export function readLang(): Lang { const m = document.cookie.match(/(?:^|; )lang=(\w+)/); return (m && (LANGS as readonly string[]).includes(m[1]) ? m[1] : "en") as Lang; }
export function useLang(): Lang { const [l, setL] = useState<Lang>("en"); useEffect(() => setL(readLang()), []); return l; }
