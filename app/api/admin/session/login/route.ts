import { NextResponse } from "next/server";
import {
  createAdminSessionValue,
  getAdminSessionCookieName,
  verifyAdminPasskey,
} from "@/lib/admin-session";

export async function POST(request: Request): Promise<NextResponse<{ ok: boolean; message: string }>> {
  try {
    const payload = (await request.json()) as { passkey?: string };
    const passkey = payload.passkey ?? "";

    if (!verifyAdminPasskey(passkey)) {
      return NextResponse.json(
        { ok: false, message: "Invalid passkey." },
        { status: 401 },
      );
    }

    const response = NextResponse.json(
      { ok: true, message: "Access granted." },
      { status: 200 },
    );

    response.cookies.set({
      name: getAdminSessionCookieName(),
      value: createAdminSessionValue(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Login failed." },
      { status: 500 },
    );
  }
}
