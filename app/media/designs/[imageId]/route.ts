import { readFile } from "node:fs/promises";

import { getDesignImageForViewer } from "@/lib/designs/queries";
import { storedFilePath } from "@/lib/designs/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await context.params;
  if (!imageId) {
    return new Response("Not found", { status: 404 });
  }

  const image = await getDesignImageForViewer(imageId);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(storedFilePath(image.designId, image.storedName));
    return new Response(bytes, {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
