import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 6 * 1024 * 1024;

const mimeToExt: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function uploadsRoot(): string {
  return path.join(process.cwd(), "uploads", "designs");
}

export function storedFilePath(designId: string, storedName: string): string {
  return path.join(uploadsRoot(), designId, storedName);
}

export function sniffImageMime(bytes: Uint8Array): keyof typeof mimeToExt | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 6) {
    const header = String.fromCharCode(...bytes.slice(0, 6));
    if (header === "GIF87a" || header === "GIF89a") {
      return "image/gif";
    }
  }
  return null;
}

export async function saveDesignImageFile(options: {
  designId: string;
  imageId: string;
  file: File;
}): Promise<{ storedName: string; mimeType: string } | { error: string }> {
  if (options.file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (options.file.size > MAX_BYTES) {
    return { error: "Keep images under 6 MB." };
  }

  const buffer = new Uint8Array(await options.file.arrayBuffer());
  const mimeType = sniffImageMime(buffer);
  if (!mimeType) {
    return { error: "Use a JPEG, PNG, WebP, or GIF." };
  }

  const storedName = `${options.imageId}${mimeToExt[mimeType]}`;
  const directory = path.join(uploadsRoot(), options.designId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedName), buffer);
  return { storedName, mimeType };
}

export async function removeDesignImageFile(designId: string, storedName: string) {
  try {
    await unlink(storedFilePath(designId, storedName));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
