/** Admin subscriber directory: GET combined lists, PATCH names, DELETE records. */
import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-api-auth";
import {
  adminDeleteSubscriberRecord,
  adminUpdatePendingSubscriberNames,
  adminUpdateSubscriberNames,
  deletePendingSubscriber,
  listAllSubscribers,
  listPendingSubscribers,
} from "@/lib/newsletter/repository";

export async function GET(): Promise<
  NextResponse<
    | { ok: true; subscribers: Awaited<ReturnType<typeof listAllSubscribers>>; pending: Awaited<ReturnType<typeof listPendingSubscribers>> }
    | { ok: false; message: string }
  >
> {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const [subscribers, pending] = await Promise.all([listAllSubscribers(), listPendingSubscribers()]);
  return NextResponse.json({ ok: true, subscribers, pending });
}

export async function PATCH(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message: string }>> {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const body = (await request.json()) as {
    email?: string;
    kind?: "subscriber" | "pending";
    firstName?: string;
    lastName?: string;
  };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.kind) {
    return NextResponse.json({ ok: false, message: "email and kind are required." }, { status: 400 });
  }
  const fn = body.firstName?.trim() ?? "";
  const ln = body.lastName?.trim() ?? "";
  if (!fn || !ln) {
    return NextResponse.json({ ok: false, message: "firstName and lastName are required." }, { status: 400 });
  }
  if (body.kind === "pending") {
    const updated = await adminUpdatePendingSubscriberNames(email, fn, ln);
    if (!updated) {
      return NextResponse.json({ ok: false, message: "Pending subscriber not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, message: "Pending subscriber updated." });
  }
  const updated = await adminUpdateSubscriberNames(email, fn, ln);
  if (!updated) {
    return NextResponse.json({ ok: false, message: "Subscriber not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, message: "Subscriber updated." });
}

export async function DELETE(
  request: Request,
): Promise<NextResponse<{ ok: boolean; message: string }>> {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const body = (await request.json()) as { email?: string; kind?: "subscriber" | "pending" };
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.kind) {
    return NextResponse.json({ ok: false, message: "email and kind are required." }, { status: 400 });
  }
  if (body.kind === "pending") {
    await deletePendingSubscriber(email);
    return NextResponse.json({ ok: true, message: "Pending entry removed." });
  }
  await adminDeleteSubscriberRecord(email);
  return NextResponse.json({ ok: true, message: "Subscriber record removed." });
}
