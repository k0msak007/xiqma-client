"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { th } from "date-fns/locale";
import {
  CalendarIcon, Download, Sparkles, RefreshCw, Loader2,
  TrendingUp, AlertCircle, CheckCircle2, RotateCcw, Clock, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reportsApi, type EmployeeReport } from "@/lib/api/reports";
import { employeesApi, type Employee } from "@/lib/api/employees";
import { useAuthStore } from "@/lib/auth-store";

const fmtMin = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const canAccess  = user?.role === "admin" || user?.role === "manager";
  const canUseAi   = user?.role === "admin";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [from, setFrom] = useState<Date>(subDays(new Date(), 14));
  const [to, setTo] = useState<Date>(new Date());

  const [report, setReport] = useState<EmployeeReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [aiText, setAiText] = useState<string>("");
  const [aiCached, setAiCached] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Team-wide
  const [exportingTeam, setExportingTeam]   = useState(false);
  const [teamAiText, setTeamAiText]         = useState<string>("");
  const [teamAiCached, setTeamAiCached]     = useState<boolean>(false);
  const [teamAiLoading, setTeamAiLoading]   = useState(false);
  const [teamAiMemberCount, setTeamAiCount] = useState<number>(0);

  // Load employees once
  useEffect(() => {
    if (!canAccess) return;
    employeesApi.listAll()
      .then((emps) => {
        const active = emps.filter((e) => (e as any).isActive ?? true);
        setEmployees(active);
        if (active[0]) setEmployeeId(active[0].id);
      })
      .catch(() => toast.error("โหลดรายชื่อพนักงานไม่สำเร็จ"));
  }, [canAccess]);

  const loadReport = async () => {
    if (!employeeId) return;
    setLoadingReport(true);
    setAiText("");
    setAiCached(false);
    try {
      const data = await reportsApi.employee(
        employeeId,
        format(from, "yyyy-MM-dd"),
        format(to, "yyyy-MM-dd"),
      );
      setReport(data);
    } catch (err: any) {
      toast.error(err?.message ?? "โหลดรายงานไม่สำเร็จ");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExport = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const blob = await reportsApi.exportEmployee(
        report.employee.id,
        report.range.from,
        report.range.to,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${report.employee.code ?? report.employee.id.slice(0, 8)}-${report.range.from}-to-${report.range.to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลด Excel สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  };

  const handleExportTeam = async () => {
    setExportingTeam(true);
    try {
      const blob = await reportsApi.exportTeam(format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-report-${format(from, "yyyy-MM-dd")}-to-${format(to, "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("ดาวน์โหลด Excel ทีมสำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "Export ทีมไม่สำเร็จ");
    } finally {
      setExportingTeam(false);
    }
  };

  const handleTeamAiSummary = async (refresh = false) => {
    setTeamAiLoading(true);
    try {
      const result = await reportsApi.teamAiSummary({
        from:     format(from, "yyyy-MM-dd"),
        to:       format(to, "yyyy-MM-dd"),
        language: "th",
        refresh,
      });
      setTeamAiText(result.text);
      setTeamAiCached(result.cached);
      setTeamAiCount(result.memberCount ?? 0);
      toast.success(result.cached ? "ใช้สรุปทีมจาก cache" : "สรุปทีมด้วย AI สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "สรุปทีมไม่สำเร็จ");
    } finally {
      setTeamAiLoading(false);
    }
  };

  const handleAiSummary = async (refresh = false) => {
    if (!report) return;
    setAiLoading(true);
    try {
      const result = await reportsApi.aiSummary(report.employee.id, {
        from:     report.range.from,
        to:       report.range.to,
        language: "th",
        refresh,
      });
      setAiText(result.text);
      setAiCached(result.cached);
      toast.success(result.cached ? "ใช้สรุปจาก cache" : "สร้างสรุปด้วย AI สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "สร้างสรุป AI ไม่สำเร็จ");
    } finally {
      setAiLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              เฉพาะ admin หรือ manager เท่านั้นที่เข้าหน้านี้ได้
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Reports
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            สรุปผลงานรายพนักงาน · Export Excel · AI summary
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">พนักงาน</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกพนักงาน..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={(e as any).avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">{e.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {e.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">ตั้งแต่</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(from, "d MMM yyyy", { locale: th })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={from} onSelect={(d) => d && setFrom(d)} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">ถึง</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(to, "d MMM yyyy", { locale: th })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={to} onSelect={(d) => d && setTo(d)} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium opacity-0">ดูรายงาน</Label>
            <Button
              onClick={loadReport}
              disabled={!employeeId || loadingReport}
              className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
            >
              {loadingReport ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังโหลด...</>
              ) : (
                <>ดูรายงาน</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team-wide actions — one click for everyone in scope */}
      <Card className="relative overflow-hidden border-violet-200/60 bg-gradient-to-br from-violet-50/40 via-fuchsia-50/30 to-rose-50/30 dark:from-violet-950/15 dark:via-fuchsia-950/10 dark:to-rose-950/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500" />
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-violet-600" />
              สรุปทีมในคลิกเดียว
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user?.role === "admin"
                ? "ครอบคลุมพนักงานทุกคน · ใช้ช่วงวันที่ด้านบน"
                : "ครอบคลุมลูกน้องในทีมของคุณ · ใช้ช่วงวันที่ด้านบน"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportTeam}
              disabled={exportingTeam}
            >
              {exportingTeam ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลัง export...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" />Export ทุกคน (Excel)</>
              )}
            </Button>
            {canUseAi && (
              <Button
                onClick={() => handleTeamAiSummary(false)}
                disabled={teamAiLoading}
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white hover:from-violet-600 hover:via-fuchsia-600 hover:to-rose-600"
              >
                {teamAiLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังวิเคราะห์...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />สรุปทีมด้วย AI</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team AI summary panel */}
      {teamAiText && (
        <Card className="relative overflow-hidden border-violet-200/60 bg-gradient-to-br from-violet-50/30 to-fuchsia-50/20 dark:from-violet-950/10 dark:to-fuchsia-950/5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-violet-600" />
              สรุปทีมจาก AI
              {teamAiCached && <Badge variant="secondary" className="text-[10px]">cached</Badge>}
              {teamAiMemberCount > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {teamAiMemberCount} คน
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTeamAiSummary(true)}
              disabled={teamAiLoading}
            >
              <RefreshCw className={cn("mr-1 h-3.5 w-3.5", teamAiLoading && "animate-spin")} />
              วิเคราะห์ใหม่
            </Button>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{teamAiText}</div>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          {/* Employee header card */}
          <Card className="relative overflow-hidden border-border/60">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={report.employee.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-white">
                    {report.employee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold">{report.employee.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {report.employee.code && <span className="font-mono">{report.employee.code}</span>}
                    {report.employee.role && <span>· {report.employee.role}</span>}
                    {report.employee.workSchedule && <span>· {report.employee.workSchedule}</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {report.range.from} ถึง {report.range.to}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลัง export...</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" />Excel</>
                  )}
                </Button>
                {canUseAi && (
                  <Button
                    onClick={() => handleAiSummary(false)}
                    disabled={aiLoading}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    {aiLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />กำลังสร้าง...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" />สรุปด้วย AI</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI summary */}
          {aiText && (
            <Card className="relative overflow-hidden border-violet-200/60 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/30 dark:from-violet-950/15 dark:to-fuchsia-950/10">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  สรุปจาก AI
                  {aiCached && (
                    <Badge variant="secondary" className="text-[10px]">cached</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAiSummary(true)}
                  disabled={aiLoading}
                >
                  <RefreshCw className={cn("mr-1 h-3.5 w-3.5", aiLoading && "animate-spin")} />
                  สร้างใหม่
                </Button>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiText}</div>
              </CardContent>
            </Card>
          )}

          {/* Stats grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="งานทั้งหมด"
              value={report.tasks.total}
              sub={`เสร็จ ${report.tasks.completed} · ค้าง ${report.tasks.inProgress}`}
              accent="from-rose-400 to-pink-500"
              tile="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <StatCard
              label="On-time rate"
              value={`${report.tasks.onTimeRate}%`}
              sub={`เสร็จล่าช้า ${report.tasks.completedLate} · เฉลี่ย ${report.tasks.avgLateDays} วัน`}
              accent="from-emerald-400 to-teal-500"
              tile="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="เกินกำหนด (active)"
              value={report.tasks.overdue}
              sub={report.tasks.overdue === 0 ? "ดีเยี่ยม" : "ต้องตามด่วน"}
              accent="from-red-400 to-rose-500"
              tile="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
              icon={<AlertCircle className="h-4 w-4" />}
            />
            <StatCard
              label="ตีกลับแก้ไข (rework)"
              value={report.tasks.reworkTotal}
              sub={`Story Points เสร็จ ${report.tasks.storyPointsCompleted}`}
              accent="from-amber-400 to-orange-500"
              tile="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
              icon={<RotateCcw className="h-4 w-4" />}
            />
          </div>

          {/* Time tracking */}
          <Card className="relative overflow-hidden border-border/60">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                เวลาทำงานรายวัน
                <Badge variant="secondary" className="ml-auto">
                  รวม {fmtMin(report.time.totalMinutes)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.time.perDay.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  ไม่มีข้อมูลการจับเวลาในช่วงนี้
                </p>
              ) : (
                <div className="space-y-1">
                  {(() => {
                    const max = Math.max(...report.time.perDay.map((d) => d.minutes));
                    return report.time.perDay.map((d) => (
                      <div key={d.day} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-muted-foreground tabular-nums">{d.day}</div>
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                              style={{ width: `${max > 0 ? (d.minutes / max) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-right text-xs font-mono tabular-nums">
                          {fmtMin(d.minutes)}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top tasks */}
          <Card className="relative overflow-hidden border-border/60">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 to-purple-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
                งานที่ใช้เวลามากที่สุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.topTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {report.topTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/40"
                      >
                        {t.displayId && (
                          <span className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {t.displayId}
                          </span>
                        )}
                        <span className="flex-1 truncate text-sm">{t.title}</span>
                        {t.statusName && (
                          <Badge
                            variant="outline"
                            className="border-0 text-[10px]"
                            style={{
                              backgroundColor: `${t.statusColor || "#6b7280"}20`,
                              color: t.statusColor || "#6b7280",
                            }}
                          >
                            {t.statusName}
                          </Badge>
                        )}
                        {t.reworkCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            <RotateCcw className="mr-1 h-2.5 w-2.5" />
                            {t.reworkCount}
                          </Badge>
                        )}
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {fmtMin(t.durationMin)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label, value, sub, accent, tile, icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  tile: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", accent)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tile)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
