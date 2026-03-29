/** Clears admin cookie and redirects home (303). */
import { NextResponse } from "next/server";
import { getAdminSessionCookieName } from "@/lib/admin-session";

export async function POST(request: Request): Promise<Response> {
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
  response.cookies.set({
    name: getAdminSessionCookieName(),
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
