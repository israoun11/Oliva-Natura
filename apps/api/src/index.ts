import "dotenv/config";
import { createApp } from "./app";
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is not set (copy .env.example to apps/api/.env)"); process.exit(1); }
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) { console.error("JWT_SECRET must be set and at least 16 characters"); process.exit(1); }
const port = Number(process.env.PORT || 4000);
createApp().listen(port, () => console.log(`API listening on :${port}`));
