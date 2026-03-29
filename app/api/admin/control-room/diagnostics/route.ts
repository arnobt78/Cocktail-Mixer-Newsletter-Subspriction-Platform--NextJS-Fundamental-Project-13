import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-api-auth";
import { SERVER_DIAGNOSTICS_PROBE_ROUTES } from "@/data/project-api-registry";

const cocktailBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://www.thecocktaildb.com/api/json/v1/1";

function cocktailDbHostname(): string {
  try {
    return new URL(cocktailBase).hostname;
  } catch {
    return "—";
  }
}

export async function GET(request: Request): Promise<
  NextResponse<
    | {
        ok: true;
        generatedAt: string;
        cocktailDb: { ok: boolean; ms: number; status: number };
        runtime: {
          nodeEnv: string;
          cocktailDbHost: string;
          integrations: {
            redis: boolean;
            resend: boolean;
            adminKey: boolean;
            groq: boolean;
            gemini: boolean;
            openrouter: boolean;
          };
        };
        serverProbes: Array<{
          label: string;
          path: string;
          method: string;
          ms: number;
          status: number;
        }>;
      }
    | { ok: false }
  >
> {
  if (!(await assertAdminSession())) {
    return NextResponse.json({ ok: false as const }, { status: 401 });
  }

  const started = Date.now();
  let cocktailDb = { ok: false, ms: 0, status: 0 };
  try {
    const r = await fetch(`${cocktailBase.replace(/\/$/, "")}/search.php?s=a`, {
      cache: "no-store",
    });
    cocktailDb = {
      ok: r.ok,
      ms: Date.now() - started,
      status: r.status,
    };
  } catch {
    cocktailDb = {
      ok: false,
      ms: Date.now() - started,
      status: 0,
    };
  }

  const origin = new URL(request.url).origin;
  const serverProbes: Array<{
    label: string;
    path: string;
    method: string;
    ms: number;
    status: number;
  }> = [];

  for (const probe of SERVER_DIAGNOSTICS_PROBE_ROUTES) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${origin}${probe.path}`, {
        method: probe.method,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
      });
      serverProbes.push({
        label: probe.label,
        path: probe.path,
        method: probe.method,
        ms: Date.now() - t0,
        status: res.status,
      });
    } catch {
      serverProbes.push({
        label: probe.label,
        path: probe.path,
        method: probe.method,
        ms: Date.now() - t0,
        status: 0,
      });
    }
  }

  return NextResponse.json({
    ok: true as const,
    generatedAt: new Date().toISOString(),
    cocktailDb,
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      cocktailDbHost: cocktailDbHostname(),
      integrations: {
        redis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
        resend: Boolean(process.env.RESEND_API_KEY),
        adminKey: Boolean(process.env.ADMIN_DASHBOARD_KEY),
        groq: Boolean(process.env.GROQ_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      },
    },
    serverProbes,
  });
}
