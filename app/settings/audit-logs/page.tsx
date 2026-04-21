"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auditLogsApi, type AuditLogItem, type ListAuditLogsParams } from "@/lib/api/audit-logs";
import { PermissionGate } from "@/components/permission-gate";
import { toast } from "sonner";

export default function AuditLogsPage() {
  return (
    <PermissionGate requires={["admin"]}>
      <AuditLogsInner />
    </PermissionGate>
  );
}

function AuditLogsInner() {
  const [rows, setRows] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState<ListAuditLogsParams>({});
  const [draft, setDraft] = useState<ListAuditLogsParams>({});

  const [selected, setSelected] = useState<AuditLogItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditLogsApi.list({ ...filters, page, limit: 50 });
      setRows(data);
      setHasMore(data.length === 50);
    } catch {
      toast.error("โหลด audit log ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setPage(1);
    setFilters(draft);
  };

  const resetFilters = () => {
    setDraft({});
    setFilters({});
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <History className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              บันทึกการกระทำทั้งหมดในระบบ — สำหรับ admin เท่านั้น
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/settings">Back to Settings</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 py-4 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Actor ID</Label>
            <Input
              placeholder="UUID"
              value={draft.actor_id ?? ""}
              onChange={(e) => setDraft({ ...draft, actor_id: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Table</Label>
            <Input
              placeholder="e.g. tasks"
              value={draft.table_name ?? ""}
              onChange={(e) => setDraft({ ...draft, table_name: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Action</Label>
            <Input
              placeholder="e.g. CREATE, UPDATE"
              value={draft.action ?? ""}
              onChange={(e) => setDraft({ ...draft, action: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={draft.from ?? ""}
              onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={draft.to ?? ""}
              onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })}
            />
          </div>
          <div className="md:col-span-5 flex gap-2">
            <Button onClick={applyFilters} className="gap-2">
              <Search className="h-4 w-4" /> Apply
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              ไม่พบ audit log
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">When</th>
                    <th className="px-4 py-2 text-left">Actor</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">Table</th>
                    <th className="px-4 py-2 text-left">Record</th>
                    <th className="px-4 py-2 text-left">IP</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.actorName ?? <span className="text-muted-foreground">system</span>}
                        {r.actorCode && (
                          <span className="ml-1 font-mono text-xs text-muted-foreground">
                            ({r.actorCode})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {r.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{r.tableName ?? "—"}</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {r.recordId ? r.recordId.slice(0, 8) : "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {r.ipAddress ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelected(r)}
                          className="h-7"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Action" value={selected.action} />
                <Field label="Table" value={selected.tableName ?? "—"} />
                <Field label="Record ID" value={selected.recordId ?? "—"} mono />
                <Field label="IP" value={selected.ipAddress ?? "—"} mono />
                <Field label="Actor" value={selected.actorName ?? "system"} />
                <Field label="When" value={new Date(selected.createdAt).toLocaleString()} />
              </div>
              <DiffPanel title="Before" data={selected.beforeData} />
              <DiffPanel title="After" data={selected.afterData} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-sm" : "text-sm"}>{value}</div>
    </div>
  );
}

function DiffPanel({ title, data }: { title: string; data: unknown }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{title}</div>
      <pre className="max-h-[260px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
