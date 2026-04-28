"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Sparkles, Loader2, RefreshCw, Send, SkipForward, Edit3,
  Sun, Users, Clock, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  standupsApi,
  type MyStandupResponse,
  type StandupRow,
} from "@/lib/api/standups";
import { useAuthStore } from "@/lib/auth-store";

const fmtMin = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

export default function StandupsPage() {
  const { user } = useAuthStore();
  const canSeeTeam = user?.role === "admin" || user?.role === "manager";

  const [mine, setMine]       = useState<MyStandupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [busy, setBusy]       = useState(false);

  const [team, setTeam]       = useState<StandupRow[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // Load mine
  useEffect(() => {
    setLoading(true);
    standupsApi.today()
      .then((row) => { setMine(row); setDraftText(row.draftText); })
      .catch((err) => toast.error(err?.message ?? "โหลด standup ไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  // Load team if manager/admin
  useEffect(() => {
    if (!canSeeTeam) return;
    setTeamLoading(true);
    standupsApi.team()
      .then(setTeam)
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, [canSeeTeam]);

  const regenerate = async () => {
    if (!mine) return;
    setBusy(true);
    try {
      const updated = await standupsApi.regenerate();
      setMine({ ...(mine as MyStandupResponse), ...updated });
      setDraftText(updated.draftText);
      toast.success("สร้างใหม่สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "สร้างไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!mine) return;
    setBusy(true);
    try {
      const updated = await standupsApi.update(mine.id, draftText);
      setMine({ ...(mine as MyStandupResponse), ...updated });
      setEditing(false);
      toast.success("บันทึกสำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const sendIt = async () => {
    if (!mine) return;
    setBusy(true);
    try {
      const updated = await standupsApi.send(mine.id);
      setMine({ ...(mine as MyStandupResponse), ...updated });
      toast.success("ส่ง standup สำเร็จ");
      // Refresh team list to reflect status change
      if (canSeeTeam) {
        standupsApi.team().then(setTeam).catch(() => {});
      }
    } catch (err: any) {
      toast.error(err?.message ?? "ส่งไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const skipIt = async () => {
    if (!mine) return;
    setBusy(true);
    try {
      const updated = await standupsApi.skip(mine.id);
      setMine({ ...(mine as MyStandupResponse), ...updated });
      toast.success("ข้ามวันนี้");
    } catch (err: any) {
      toast.error(err?.message ?? "ข้ามไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Sun className="h-7 w-7 text-orange-500" />
          <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
            Daily Standup
          </span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          AI สรุปงานเมื่อวานและวางแผนวันนี้ — ตรวจ → ส่งให้ทีม
        </p>
      </div>

      {loading ? (
        <Card className="border-border/60">
          <CardContent className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !mine ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</CardContent></Card>
      ) : (
        <>
          {/* My standup card */}
          <Card className="relative overflow-hidden border-border/60">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-pink-500 to-rose-500" />
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  Standup ของวันนี้
                  <StatusBadge status={mine.status} />
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {format(new Date(mine.context.today.date), "EEEEที่ d MMMM yyyy", { locale: th })}
                  {mine.model && <span className="ml-2 text-[10px] opacity-70">· {mine.model}</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerate}
                  disabled={busy || mine.status === "sent"}
                  title="สร้างใหม่ด้วย AI"
                >
                  <RefreshCw className={cn("mr-1 h-3.5 w-3.5", busy && "animate-spin")} />
                  สร้างใหม่
                </Button>
                {mine.status !== "sent" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing((v) => !v); setDraftText(mine.draftText); }}
                    disabled={busy}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    {editing ? "ยกเลิก" : "แก้ไข"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  <Textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={12}
                    className="font-mono text-sm leading-relaxed"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDraftText(mine.draftText); }}>
                      ยกเลิก
                    </Button>
                    <Button size="sm" onClick={saveEdit} disabled={busy}>
                      บันทึก
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{mine.draftText}</div>
              )}
            </CardContent>

            {!editing && mine.status !== "sent" && (
              <div className="border-t bg-muted/30 px-6 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    หลังส่งแล้ว ทีมจะเห็นใน team view
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={skipIt} disabled={busy}>
                      <SkipForward className="mr-1 h-3.5 w-3.5" />
                      ข้ามวันนี้
                    </Button>
                    <Button
                      onClick={sendIt}
                      disabled={busy}
                      className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
                    >
                      {busy ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังส่ง...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" />ส่งให้ทีม</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {mine.status === "sent" && mine.sentAt && (
              <div className="border-t bg-emerald-50/50 px-6 py-2 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                ส่งเมื่อ {format(new Date(mine.sentAt), "HH:mm", { locale: th })} น.
              </div>
            )}
          </Card>

          {/* Context (data the AI used) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ข้อมูลที่ AI ใช้
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              <ContextStat
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="งานปิดเมื่อวาน"
                value={mine.context.yesterday.completedTasks.length}
                accent="emerald"
              />
              <ContextStat
                icon={<Clock className="h-3.5 w-3.5" />}
                label="เวลาเมื่อวาน"
                value={fmtMin(mine.context.yesterday.timeMinutes)}
                accent="sky"
              />
              <ContextStat
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                label="Overdue"
                value={mine.context.blockers.overdueCount}
                accent={mine.context.blockers.overdueCount > 0 ? "red" : "muted"}
              />
            </CardContent>
          </Card>

          {/* Team view */}
          {canSeeTeam && (
            <Card className="relative overflow-hidden border-border/60">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  Standup ของทีม วันนี้
                  <Badge variant="secondary" className="ml-auto">{team.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {teamLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : team.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                    ยังไม่มี standup ของวันนี้
                  </p>
                ) : (
                  <div className="divide-y">
                    {team.map((s) => (
                      <details key={s.id} className="group">
                        <summary className="flex cursor-pointer items-center gap-3 px-6 py-3 hover:bg-muted/40">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-[10px] text-white">
                              {(s.employeeName ?? "?").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm font-medium">{s.employeeName ?? "—"}</span>
                          <StatusBadge status={s.status} />
                        </summary>
                        <div className="border-t bg-muted/20 px-6 py-3">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{s.draftText}</div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "sent" | "skipped" }) {
  if (status === "sent") {
    return (
      <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        ส่งแล้ว
      </Badge>
    );
  }
  if (status === "skipped") {
    return <Badge variant="secondary" className="text-[10px]">ข้าม</Badge>;
  }
  return (
    <Badge className="border-0 bg-amber-100 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      รอส่ง
    </Badge>
  );
}

function ContextStat({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: "emerald" | "sky" | "red" | "muted";
}) {
  const tile = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    sky:     "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
    red:     "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
    muted:   "bg-muted text-muted-foreground",
  }[accent];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tile)}>{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
