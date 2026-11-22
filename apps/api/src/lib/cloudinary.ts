import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

// All configuration comes from environment variables (see .env.example). No credentials live in code.
export const cloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
const prefix = () => process.env.CLOUDINARY_FOLDER || "oliva-natura";
function configure() {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
}
export class StorageNotConfigured extends Error { status = 503; constructor() { super("Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in apps/api/.env"); } }

// Stable URL: no version segment and no extension, so replacing an asset (same public_id, overwrite) keeps every stored URL valid.
export const stableUrl = (secureUrl: string) => secureUrl.replace(/\/v\d+\//, "/").replace(/\.[a-z0-9]+$/i, "");

export function uploadBuffer(buf: Buffer, folder: string, publicId?: string): Promise<UploadApiResponse> {
  if (!cloudinaryConfigured()) throw new StorageNotConfigured();
  configure();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      publicId ? { public_id: publicId, overwrite: true, invalidate: true, resource_type: "image" } : { folder: `${prefix()}/${folder}`, resource_type: "image" },
      (err, res) => (err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res)));
    stream.end(buf);
  });
}
export async function destroyAsset(publicId: string) {
  if (!cloudinaryConfigured()) throw new StorageNotConfigured();
  configure();
  return cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
}

// Magic-byte sniffing: never trust the client-declared MIME type.
export function sniffImage(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (b.subarray(4, 8).toString() === "ftyp" && ["avif", "avis"].includes(b.subarray(8, 12).toString())) return "image/avif";
  return null;
}
