/** Resend history rows: DELETE by id or clear all. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import {
  clearBroadcastHistory,
  deleteBroadcastHistoryItem,
} from "@/lib/newsletter/repository";

async function ensureAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  return verifyAdminSessionValue(sessionValue);
}

export async function DELETE(request: Request): Promise<NextResponse<{ ok: boolean; message: string }>> {
  if (!(await ensureAuth())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await deleteBroadcastHistoryItem(id);
    return NextResponse.json({ ok: true, message: "History item deleted." }, { status: 200 });
  }

  await clearBroadcastHistory();
  return NextResponse.json({ ok: true, message: "All history deleted." }, { status: 200 });
}
