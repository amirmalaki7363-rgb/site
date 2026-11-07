import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || "banned" in session) {
      return NextResponse.json({ success: true, user: null });
    }
    return NextResponse.json({ success: true, user: session.user });
  } catch {
    return NextResponse.json({ success: true, user: null });
  }
}
