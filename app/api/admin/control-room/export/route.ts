import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAdminSessionCookieName,
  verifyAdminSessionValue,
} from "@/lib/admin-session";
import { listAllSubscribers, listPendingSubscribers } from "@/lib/newsletter/repository";

function escapeCsv(value: string): string {
  const safe = value.replaceAll('"', '""');
  return `"${safe}"`;
}

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminSessionCookieName())?.value;
  const allowed = verifyAdminSessionValue(sessionValue);
  if (!allowed) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const [activeAndHistory, pending] = await Promise.all([
    listAllSubscribers(),
    listPendingSubscribers(),
  ]);

  const lines = [
    "bucket,email,first_name,last_name,full_name,created_at,confirmed_at,unsubscribed_at,unsubscribe_reason,unsubscribe_feedback",
    ...activeAndHistory.map((item) =>
      [
        "subscribers",
        item.email,
        item.firstName,
        item.lastName,
        item.fullName,
        item.createdAt,
        item.confirmedAt ?? "",
        item.unsubscribedAt ?? "",
        item.unsubscribeReason ?? "",
        item.unsubscribeFeedback ?? "",
      ]
        .map((value) => escapeCsv(value))
        .join(","),
    ),
    ...pending.map((item) =>
      [
        "pending",
        item.email,
        item.firstName,
        item.lastName,
        item.fullName,
        item.createdAt,
        item.confirmedAt ?? "",
        item.unsubscribedAt ?? "",
        item.unsubscribeReason ?? "",
        item.unsubscribeFeedback ?? "",
      ]
        .map((value) => escapeCsv(value))
        .join(","),
    ),
  ];

  const body = lines.join("\n");
  const dateTag = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mixmaster-control-room-${dateTag}.csv"`,
    },
  });
}
