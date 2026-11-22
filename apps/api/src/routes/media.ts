import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { db } from "../db";
import { requireAdminAny } from "../auth";
import { audit } from "../lib/audit";
import { uploadBuffer, destroyAsset, sniffImage, stableUrl, cloudinaryConfigured } from "../lib/cloudinary";

export const mediaRoutes = Router();
const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 8);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MB * 1024 * 1024, files: 10 } });
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);
const FOLDERS = ["products", "journal", "home", "cms", "general"] as const;
const guard = requireAdminAny("content", "catalog");
const bad = (m: string) => Object.assign(new Error(m), { status: 400 });

function check(f: Express.Multer.File) {
  const mime = sniffImage(f.buffer);
  if (!mime) throw bad(`${f.originalname}: not a valid JPEG, PNG, WebP or AVIF image`);
  return mime;
}
const toRow = (r: any, mime: string, folder: string, adminId: string) => ({ publicId: r.public_id, url: stableUrl(r.secure_url), folder, width: r.width, height: r.height, bytes: r.bytes, mime, uploadedById: adminId });

mediaRoutes.get("/status", guard, (_q, r) => r.json({ configured: cloudinaryConfigured(), maxMb: MAX_MB, folders: FOLDERS }));
mediaRoutes.get("/", guard, wrap(async (q: any, r: any) => {
  const folder = FOLDERS.includes(q.query.folder) ? q.query.folder : undefined;
  r.json(await db.mediaAsset.findMany({ where: folder ? { folder } : {}, orderBy: { createdAt: "desc" }, take: 500 }));
}));
mediaRoutes.post("/", guard, upload.array("files", 10), wrap(async (q: any, r: any) => {
  const folder = z.enum(FOLDERS).default("general").parse(q.query.folder || "general");
  const files = (q.files || []) as Express.Multer.File[];
  if (!files.length) throw bad("No files received (field name: files)");
  const mimes = files.map(check); // validate all before uploading any
  const out = [];
  for (const [i, f] of files.entries()) {
    const res = await uploadBuffer(f.buffer, folder);
    out.push(await db.mediaAsset.create({ data: toRow(res, mimes[i], folder, q.admin.sub) }));
  }
  await audit(q.admin.sub, "media.upload", "MediaAsset", undefined, { count: out.length, folder });
  r.status(201).json(out);
}));
mediaRoutes.put("/:id/replace", guard, upload.single("file"), wrap(async (q: any, r: any) => {
  if (!q.file) throw bad("No file received (field name: file)");
  const mime = check(q.file);
  const old = await db.mediaAsset.findUniqueOrThrow({ where: { id: q.params.id } });
  const res = await uploadBuffer(q.file.buffer, old.folder, old.publicId); // same public_id => URL unchanged
  const row = await db.mediaAsset.update({ where: { id: old.id }, data: { ...toRow(res, mime, old.folder, q.admin.sub), publicId: old.publicId } });
  await db.productImage.updateMany({ where: { mediaId: old.id }, data: { url: row.url } });
  await audit(q.admin.sub, "media.replace", "MediaAsset", old.id); r.json(row);
}));
mediaRoutes.patch("/:id", guard, wrap(async (q: any, r: any) => {
  const alt = z.object({ en: z.string().default(""), fr: z.string().default(""), ar: z.string().default("") }).parse(q.body.alt || {});
  r.json(await db.mediaAsset.update({ where: { id: q.params.id }, data: { alt } }));
}));
mediaRoutes.delete("/:id", guard, wrap(async (q: any, r: any) => {
  const m = await db.mediaAsset.findUniqueOrThrow({ where: { id: q.params.id } });
  await destroyAsset(m.publicId); // remote first: if it fails the DB row stays and the admin can retry
  await db.$transaction([db.productImage.deleteMany({ where: { mediaId: m.id } }), db.mediaAsset.delete({ where: { id: m.id } })]);
  await audit(q.admin.sub, "media.delete", "MediaAsset", m.id); r.json({ deleted: true });
}));
