# Admin guide (/admin)
Sign in at `/admin/login` with the seeded Super Admin. Roles limit what you see in the sidebar: Super Admin (all) · Store Manager (shop, settings, customers) · Content Editor (pages, journal, media, messages) · Order Manager (orders, customers).

**First-time setup:** Settings → Site (email, phone), Payments & WhatsApp (WhatsApp number), Shipping (enable Tunisia with your real fee; add other countries only when you really ship there), Languages. Media → upload photos (needs Cloudinary env vars).
**Add a product:** Products → edit a draft (or + New) → General (EN/FR/AR name + description, collection) → Pricing (TND, optional sale/EUR) → Images (upload/choose, first = main) → Variants (optional) → Stock → tick Published → Save. Use Preview to check it first.
**Orders:** Orders → click an order → move through Confirmed → Processing → Shipped → Delivered; add carrier/tracking; internal notes. Cancelling returns stock. Delivered COD orders are marked paid.
**Content:** Pages & homepage → pick a page → edit title/SEO → add/reorder/hide sections (heading, text, image, button) → tick Published → Save. Journal → articles in 3 languages. Settings → Navigation & footer.
**Traceability:** Suppliers → Product batches; only batches ticked *Verified* appear on the public product page.

**Homepage:** Pages & homepage → "Homepage" → first *Hero* section: heading = circling text, text = footer note, button = bottom-right button. Bottles shown are your first 12 *published* products (names, volumes). Until at least one product is published, provisional demo bottles are shown.
**Rules enforced by the server:** a product cannot be published without a name and a price > 0; a sale price must be lower than the regular price; shipping only works for countries enabled in Settings → Shipping; cash on delivery is Tunisia-only.
**Accounts:** disabling an admin (Admin users → Active off) blocks them immediately, even if they are signed in.
