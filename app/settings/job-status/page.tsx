"use client";

import Link from "next/link";
import { ArrowLeft, CircleDot, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";

/** Standard status types used across all lists in Xiqma */
const STATUS_TYPES = [
  {
    type:        "open",
    label:       "Open",
    labelTh:     "เปิด",
    color:       "#6b7280",
    description: "Task has not been started yet",
    descTh:      "งานยังไม่ได้เริ่มต้น",
    pointCount:  "not_counted",
    pointLabel:  "Not Counted",
    pointLabelTh:"ยังไม่นับ",
    badgeClass:  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    type:        "in_progress",
    label:       "In Progress",
    labelTh:     "กำลังดำเนินการ",
    color:       "#3b82f6",
    description: "Task is actively being worked on",
    descTh:      "งานกำลังดำเนินการอยู่",
    pointCount:  "in_progress",
    pointLabel:  "In Progress",
    pointLabelTh:"กำลังดำเนินการ",
    badgeClass:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    type:        "review",
    label:       "Review",
    labelTh:     "รอตรวจสอบ",
    color:       "#f59e0b",
    description: "Task is under review or QA",
    descTh:      "งานอยู่ระหว่างการตรวจสอบ",
    pointCount:  "in_progress",
    pointLabel:  "In Progress",
    pointLabelTh:"กำลังดำเนินการ",
    badgeClass:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    type:        "done",
    label:       "Done",
    labelTh:     "เสร็จสิ้น",
    color:       "#10b981",
    description: "Task has been completed",
    descTh:      "งานเสร็จสมบูรณ์ นับ Point ได้",
    pointCount:  "complete",
    pointLabel:  "Complete",
    pointLabelTh:"นับเป็นเสร็จ",
    badgeClass:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    type:        "closed",
    label:       "Closed",
    labelTh:     "ปิด",
    color:       "#6366f1",
    description: "Task is closed and archived",
    descTh:      "งานปิดและเก็บเข้า archive",
    pointCount:  "complete",
    pointLabel:  "Complete",
    pointLabelTh:"นับเป็นเสร็จ",
    badgeClass:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

const POINT_COLORS: Record<string, string> = {
  not_counted: "#6b7280",
  in_progress: "#3b82f6",
  complete:    "#10b981",
};

export default function JobStatusPage() {
  const { language } = useTranslation();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Job Status Master</h1>
          <p className="text-muted-foreground">
            {language === "th"
              ? "ประเภทสถานะมาตรฐานที่ใช้ในระบบ Xiqma"
              : "Standard status types used across Xiqma"}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-1">
              {language === "th" ? "วิธีจัดการ Status" : "How Statuses Work"}
            </p>
            <p>
              {language === "th"
                ? "ใน Xiqma แต่ละ List จะมี Status columns ของตัวเอง เมื่อสร้าง List ใหม่ระบบจะ auto-seed 5 statuses มาตรฐานให้ทันที สามารถเพิ่ม/แก้ไข/ลบ Status ได้ที่หน้า List นั้นๆ"
                : "In Xiqma, each List has its own status columns. When a new List is created, the system auto-seeds these 5 standard statuses. You can add, edit, or delete statuses per List from the List settings."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "th" ? "ประเภทสถานะทั้งหมด" : "Total Status Types"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATUS_TYPES.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open / In Progress / Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Done / Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "th" ? "ประเภทสถานะมาตรฐาน" : "Standard Status Types"}
          </CardTitle>
          <CardDescription>
            {language === "th"
              ? "ประเภทสถานะที่จะถูก seed ให้อัตโนมัติเมื่อสร้าง List ใหม่"
              : "These status types are auto-seeded when a new List is created"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                <TableHead>{language === "th" ? "คำอธิบาย" : "Description"}</TableHead>
                <TableHead>{language === "th" ? "การนับ Point" : "Point Counting"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATUS_TYPES.map((s) => (
                <TableRow key={s.type}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${s.color}20` }}
                      >
                        <CircleDot className="h-4 w-4" style={{ color: s.color }} />
                      </div>
                      <span className="font-medium">{language === "th" ? s.labelTh : s.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={s.badgeClass}>
                      {language === "th" ? s.labelTh : s.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {language === "th" ? s.descTh : s.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: POINT_COLORS[s.pointCount],
                        color:       POINT_COLORS[s.pointCount],
                      }}
                    >
                      {language === "th" ? s.pointLabelTh : s.pointLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Link to list management */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {language === "th"
              ? "ต้องการเพิ่ม/แก้ไข Status? ไปที่ List ที่ต้องการแล้วจัดการ Status ในหน้า List Settings"
              : "Want to add or edit statuses? Go to the specific List and manage statuses there."}
          </p>
          <Link href="/">
            <Button variant="outline">
              {language === "th" ? "ไปหน้า Workspace" : "Go to Workspace"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
