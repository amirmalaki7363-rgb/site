import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serve an uploaded image from the DB (persistent storage). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  try {
    const img = await db.uploadedImage.findUnique({
      where: { id },
      select: { data: true, mime: true, size: true },
    });
    if (!img) {
      return new NextResponse("Not found", { status: 404 });
    }
    const body = Buffer.from(img.data);
    return new NextResponse(body, {
      status: 200,
      headers: {
        // defense-in-depth: only raster image types are ever served; everything is locked down against script execution
        "Content-Type": ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(img.mime) ? img.mime : "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Disposition": "inline",
        "Content-Length": String(body.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Server error", { status: 500 });
  }
}
