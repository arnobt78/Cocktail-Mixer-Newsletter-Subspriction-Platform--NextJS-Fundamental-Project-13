"use client";

/**
 * Ops-style dashboard: GET /diagnostics for server probes + integration flags; browser fetch loop for listed routes.
 */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BROWSER_PROBE_ROUTES } from "@/data/project-api-registry";
import { cn } from "@/lib/utils";
import { formatAdminDateTime } from "@/lib/admin-datetime";

type ProbeRow = {
  id: string;
  label: string;
  path: string;
  method: string;
  httpStatus: number;
  ms: number;
  error?: string;
};

type DiagnosticsPayload = {
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
};

const INTEGRATION_LABELS: Record<
  keyof DiagnosticsPayload["runtime"]["integrations"],
  string
> = {
  redis: "Upstash Redis",
  resend: "Resend",
  adminKey: "Admin dashboard key",
  groq: "Groq",
  gemini: "Gemini",
  openrouter: "OpenRouter",
};

function statusBadgeClass(httpStatus: number, error?: boolean) {
  if (error || httpStatus === 0) {
    return "border border-rose-300/35 bg-rose-500/15 text-rose-100";
  }
  if (httpStatus >= 200 && httpStatus < 300) {
    return "border border-emerald-300/35 bg-emerald-500/15 text-emerald-100";
  }
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 405) {
    return "border border-amber-300/35 bg-amber-500/15 text-amber-100";
  }
  return "border border-rose-300/35 bg-rose-500/15 text-rose-100";
}

export function AdminApiStatusPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsPayload | null>(
    null,
  );
  const [diagError, setDiagError] = useState<string | null>(null);
  const [rows, setRows] = useState<ProbeRow[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runProbes = useCallback(async () => {
    setRunning(true);
    setDiagError(null);
    const next: ProbeRow[] = [];
    try {
      const tDiag = performance.now();
      try {
        const dr = await fetch("/api/admin/control-room/diagnostics", {
          credentials: "include",
          cache: "no-store",
        });
        const diagMs = Math.round(performance.now() - tDiag);
        if (dr.ok) {
          const body = (await dr.json()) as DiagnosticsPayload | { ok: false };
          if (body.ok === true && body.runtime && body.serverProbes) {
            setDiagnostics(body);
          } else {
            setDiagnostics(null);
            setDiagError(`Diagnostics ${dr.status} (${diagMs} ms)`);
          }
        } else {
          setDiagnostics(null);
          setDiagError(`Diagnostics ${dr.status} (${diagMs} ms)`);
        }
      } catch {
        setDiagnostics(null);
        setDiagError("Diagnostics request failed");
      }

      for (const route of BROWSER_PROBE_ROUTES) {
        const id = `${route.method}:${route.path}`;
        const t0 = performance.now();
        try {
          const r = await fetch(route.path, {
            method: route.method,
            credentials: "include",
            cache: "no-store",
          });
          const ms = Math.round(performance.now() - t0);
          next.push({
            id,
            label: route.label,
            path: route.path,
            method: route.method,
            httpStatus: r.status,
            ms,
          });
        } catch (e) {
          next.push({
            id,
            label: route.label,
            path: route.path,
            method: route.method,
            httpStatus: 0,
            ms: Math.round(performance.now() - t0),
            error: e instanceof Error ? e.message : "Failed",
          });
        }
      }

      setRows(next);
      setCheckedAt(new Date().toISOString());
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    void runProbes();
    const id = window.setInterval(() => void runProbes(), 30_000);
    return () => window.clearInterval(id);
  }, [runProbes]);

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading sm:text-3xl">
            API status
          </h1>
          <p className="mt-1 text-sm text-slate-400 sm:text-base">
            Live checks: browser probes (with your session), server-side probes
            from the app origin (no session), TheCocktailDB latency, and
            configured integrations. Refreshes every 30 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runProbes()}
          disabled={running}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-500/20 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-50"
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4 shrink-0", running && "animate-spin")}
            aria-hidden
          />
          {running ? "Refreshing…" : "Refresh now"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            TheCocktailDB (server)
          </h2>
          {diagError ? (
            <p className="mt-2 text-sm text-rose-300">{diagError}</p>
          ) : diagnostics ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Badge
                className={
                  diagnostics.cocktailDb.ok
                    ? "border border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                    : "border border-rose-300/35 bg-rose-500/20 text-rose-100"
                }
              >
                {diagnostics.cocktailDb.ok ? "Reachable" : "Issue"}
              </Badge>
              <span className="text-sm tabular-nums text-slate-300">
                {diagnostics.cocktailDb.ms} ms · HTTP{" "}
                {diagnostics.cocktailDb.status || "—"}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Waiting…</p>
          )}
          {diagnostics ? (
            <p className="mt-2 text-xs text-slate-500">
              Host {diagnostics.runtime.cocktailDbHost} · server time{" "}
              {formatAdminDateTime(diagnostics.generatedAt)}
            </p>
          ) : null}
        </Card>

        <Card className="glass-panel border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Probe schedule
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {checkedAt
              ? `Last run ${formatAdminDateTime(checkedAt)} · auto every 30s`
              : "Running first check…"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            401 / 405 often mean the handler is reachable (auth or method
            mismatch). 0 = network error or timeout.
          </p>
        </Card>
      </div>

      {diagnostics ? (
        <Card className="mt-4 glass-panel border-white/10 bg-white/[0.03] p-4 sm:mt-5 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Runtime & integrations
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            <span className="font-medium text-slate-300">NODE_ENV</span>{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-cyan-200/90">
              {diagnostics.runtime.nodeEnv}
            </code>
            <span className="mx-2 text-slate-600">·</span>
            Flags show env presence only (no secret values).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              Object.keys(diagnostics.runtime.integrations) as Array<
                keyof DiagnosticsPayload["runtime"]["integrations"]
              >
            ).map((key) => {
              const on = diagnostics.runtime.integrations[key];
              return (
                <Badge
                  key={key}
                  className={
                    on
                      ? "border border-emerald-300/35 bg-emerald-500/15 text-emerald-100"
                      : "border border-slate-500/35 bg-slate-500/10 text-slate-400"
                  }
                >
                  {INTEGRATION_LABELS[key]} · {on ? "on" : "off"}
                </Badge>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card className="mt-4 glass-panel border-white/10 bg-white/[0.03] p-0 overflow-hidden sm:mt-5">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 className="text-lg font-semibold text-white">
            Server-side routes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Fetched from this deployment using the diagnostics handler (no
            browser cookies).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold sm:px-5">Endpoint</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Method</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Status</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Latency</th>
              </tr>
            </thead>
            <tbody>
              {!diagnostics?.serverProbes?.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500 sm:px-5"
                  >
                    {running ? "Refreshing…" : "No server probe data yet."}
                  </td>
                </tr>
              ) : (
                diagnostics.serverProbes.map((row) => (
                  <tr
                    key={`${row.method}:${row.path}`}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <div className="font-medium text-slate-200">
                        {row.label}
                      </div>
                      <code className="mt-0.5 block break-all text-xs text-cyan-200/80">
                        {row.path}
                      </code>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-slate-400 sm:px-3">
                      {row.method}
                    </td>
                    <td className="px-2 py-3 sm:px-3">
                      <Badge className={statusBadgeClass(row.status)}>
                        {row.status || "—"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 tabular-nums text-slate-300 sm:px-3">
                      {row.ms} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4 glass-panel border-white/10 bg-white/[0.03] p-0 overflow-hidden sm:mt-5">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 className="text-lg font-semibold text-white">Browser probes</h2>
          <p className="mt-1 text-xs text-slate-500">
            Same-origin requests from your browser with credentials (admin
            session on API routes).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold sm:px-5">Endpoint</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Method</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Status</th>
                <th className="px-2 py-3 font-semibold sm:px-3">Latency</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500 sm:px-5"
                  >
                    {running ? "Refreshing…" : "No results yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <div className="font-medium text-slate-200">
                        {row.label}
                      </div>
                      <code className="mt-0.5 block break-all text-xs text-cyan-200/80">
                        {row.path}
                      </code>
                      {row.error ? (
                        <span className="mt-1 block text-xs text-rose-300">
                          {row.error}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-slate-400 sm:px-3">
                      {row.method}
                    </td>
                    <td className="px-2 py-3 sm:px-3">
                      <Badge
                        className={cn(
                          statusBadgeClass(row.httpStatus, Boolean(row.error)),
                        )}
                      >
                        {row.httpStatus || "—"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 tabular-nums text-slate-300 sm:px-3">
                      {row.ms} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
