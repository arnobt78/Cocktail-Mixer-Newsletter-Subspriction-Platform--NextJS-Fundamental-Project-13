"use client";

/** Renders PROJECT_API_DOC_GROUPS in Radix tabs—keep registry in sync when APIs change. */
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_API_DOC_GROUPS } from "@/data/project-api-registry";

export function AdminApiDocumentationPage() {
  const defaultTab = PROJECT_API_DOC_GROUPS[0]?.id ?? "public-newsletter";

  return (
    <section className="mx-auto w-full max-w-9xl px-4 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-heading sm:text-3xl">
          API documentation
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400 sm:text-base">
          Project HTTP routes grouped by area. Auth shows whether a valid admin session cookie
          is required.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-1 h-auto min-h-10 w-full justify-start gap-1 py-1 sm:min-h-11">
          {PROJECT_API_DOC_GROUPS.map((g) => (
            <TabsTrigger key={g.id} value={g.id} className="flex-1 sm:flex-none">
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PROJECT_API_DOC_GROUPS.map((group) => (
          <TabsContent key={group.id} value={group.id} className="mt-4">
            <div className="grid gap-4 sm:gap-5">
              {group.endpoints.map((ep) => (
                <Card
                  key={`${group.id}-${ep.path}-${ep.methods.join(",")}`}
                  className="glass-panel border-white/10 bg-white/[0.03] p-4 text-slate-200 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <code className="block break-all text-sm text-cyan-200/95 sm:text-base">
                        {ep.path}
                      </code>
                      <p className="text-sm leading-relaxed text-slate-300">{ep.summary}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {ep.methods.map((m) => (
                        <Badge
                          key={m}
                          className="border border-violet-300/35 bg-violet-500/20 text-violet-100"
                        >
                          {m}
                        </Badge>
                      ))}
                      <Badge
                        className={
                          ep.auth === "admin-session"
                            ? "border border-amber-300/35 bg-amber-500/20 text-amber-100"
                            : "border border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                        }
                      >
                        {ep.auth === "admin-session" ? "Admin session" : "Public"}
                      </Badge>
                    </div>
                  </div>
                  {ep.request ? (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                        Request
                      </p>
                      <p className="mt-1 text-sm text-slate-400">{ep.request}</p>
                    </div>
                  ) : null}
                  {ep.response ? (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                        Response
                      </p>
                      <p className="mt-1 text-sm text-slate-400">{ep.response}</p>
                    </div>
                  ) : null}
                  {ep.notes ? (
                    <div className="mt-3 rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2">
                      <p className="text-xs text-slate-500">{ep.notes}</p>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
