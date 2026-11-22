/// <reference types="node" />
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const n = (en: string, fr: string, ar = "") => ({ en, fr, ar });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL, pw = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !pw) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in apps/api/.env");
  if (pw.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
  await db.adminUser.upsert({ where: { email }, update: {}, create: { email, name: "Super Admin", role: "SUPER_ADMIN", passwordHash: await bcrypt.hash(pw, 12) } });

  const cols = [
    ["essential", n("Essential Collection", "Collection Essentielle")],
    ["signature", n("Signature Collection", "Collection Signature")],
    ["gift", n("Gift Collection", "Collection Cadeaux")],
  ] as const;
  const colId: Record<string, string> = {};
  for (const [i, [slug, name]] of cols.entries()) colId[slug] = (await db.collection.upsert({ where: { slug }, update: {}, create: { slug, name, sort: i } })).id;

  // PROVISIONAL concepts. Prices are 0 placeholders and products are UNPUBLISHED stock 0 until the owner sets real data in Admin.
  const items: [string, string, string, string, number | null, string][] = [
    ["original-500", "ON-ORIG-500", "Original Extra Virgin Olive Oil — 500 ml", "Huile d'olive vierge extra Original — 500 ml", 500, "essential"],
    ["original-750", "ON-ORIG-750", "Original Extra Virgin Olive Oil — 750 ml", "Huile d'olive vierge extra Original — 750 ml", 750, "essential"],
    ["family-1l", "ON-FAM-1000", "Family Selection — 1 L", "Sélection Famille — 1 L", 1000, "essential"],
    ["early-harvest-250", "ON-EH-250", "Early Harvest Selection — 250 ml", "Sélection Récolte Précoce — 250 ml", 250, "signature"],
    ["premium-500", "ON-PREM-500", "Premium Selection — 500 ml", "Sélection Premium — 500 ml", 500, "signature"],
    ["limited-500", "ON-LTD-500", "Limited Edition — 500 ml", "Édition Limitée — 500 ml", 500, "signature"],
    ["duo-collection", "ON-GIFT-DUO", "Duo Collection", "Collection Duo", null, "gift"],
    ["mediterranean-box", "ON-GIFT-MED", "Mediterranean Box", "Coffret Méditerranée", null, "gift"],
    ["signature-gift-box", "ON-GIFT-SIG", "Signature Gift Box", "Coffret Signature", null, "gift"],
  ];
  for (const [slug, sku, en, fr, volumeMl, col] of items)
    await db.product.upsert({ where: { slug }, update: {}, create: { slug, sku, name: n(en, fr), description: n("", ""), volumeMl, priceTnd: 0, stock: 0, published: false, collectionId: colId[col] } });

  await db.siteSetting.upsert({ where: { key: "site" }, update: {}, create: { key: "site", value: { brand: "OLIVA NATURA", whatsappNumber: "", email: "" } } });
  // Shipping DISABLED everywhere until real arrangements/fees are entered in Admin.
  await db.siteSetting.upsert({ where: { key: "shipping" }, update: {}, create: { key: "shipping", value: { TN: { enabled: false, fee: 0, freeOver: null } } } });
  for (const [slug, t] of [["our-story", n("Our Story", "Notre Histoire", "قصتنا")], ["from-our-land", n("From Our Land", "De Notre Terre", "من أرضنا")], ["our-philosophy", n("Our Philosophy", "Notre Philosophie", "فلسفتنا")],
    ["privacy", n("Privacy Policy", "Politique de confidentialité", "سياسة الخصوصية")], ["terms", n("Terms and Conditions", "Conditions générales", "الشروط والأحكام")], ["shipping", n("Shipping Policy", "Politique de livraison", "سياسة الشحن")], ["returns", n("Returns Policy", "Politique de retour", "سياسة الإرجاع")], ["cookies", n("Cookie Policy", "Politique des cookies", "سياسة ملفات تعريف الارتباط")], ["home", n("Homepage", "Accueil", "الرئيسية")]] as const)
    await db.page.upsert({ where: { slug }, update: {}, create: { slug, title: t, published: false } });
  await db.siteSetting.upsert({ where: { key: "payments" }, update: {}, create: { key: "payments", value: { cod: { enabled: true } } } });
  await db.siteSetting.upsert({ where: { key: "languages" }, update: {}, create: { key: "languages", value: { enabled: ["en", "fr", "ar"], default: "en" } } });
  console.log("Seed complete.");
}
main().finally(() => db.$disconnect());
