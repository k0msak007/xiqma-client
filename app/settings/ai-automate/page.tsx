"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Bell, UserCheck, Clock, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

// Days of week
const daysOfWeek = [
  { id: "mon", label: "Mon", labelTh: "จ." },
  { id: "tue", label: "Tue", labelTh: "อ." },
  { id: "wed", label: "Wed", labelTh: "พ." },
  { id: "thu", label: "Thu", labelTh: "พฤ." },
  { id: "fri", label: "Fri", labelTh: "ศ." },
  { id: "sat", label: "Sat", labelTh: "ส." },
  { id: "sun", label: "Sun", labelTh: "อา." },
];

// Time options
const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export default function AIAutomatePage() {
  const { language } = useTranslation();

  // Bot Alert Settings
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertDays, setAlertDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [alertTime, setAlertTime] = useState("09:00");

  // Bot Follow-up Settings
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [followUpDays, setFollowUpDays] = useState<string[]>(["mon", "wed", "fri"]);
  const [followUpTime, setFollowUpTime] = useState("14:00");

  const toggleAlertDay = (dayId: string) => {
    setAlertDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const toggleFollowUpDay = (dayId: string) => {
    setFollowUpDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSave = () => {
    // Save settings to store/API
    console.log("Saving AI Automate settings:", {
      alert: { enabled: alertEnabled, days: alertDays, time: alertTime },
      followUp: { enabled: followUpEnabled, days: followUpDays, time: followUpTime },
    });
    // Show success toast/notification
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-pink-500" />
            {language === "th" ? "AI Automate Task" : "AI Automate Task"}
          </h1>
          <p className="text-muted-foreground">
            {language === "th"
              ? "ตั้งค่า Bot แจ้งเตือนและติดตามงานอัตโนมัติ"
              : "Configure automated bot alerts and task follow-ups"}
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {language === "th" ? "บันทึก" : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bot Alert Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>
                    {language === "th" ? "Bot แจ้งเตือนงาน" : "Bot Alert"}
                  </CardTitle>
                  <CardDescription>
                    {language === "th"
                      ? "แจ้งเตือนงานที่ต้องทำประจำวัน"
                      : "Daily task reminders and notifications"}
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={alertEnabled}
                onCheckedChange={setAlertEnabled}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Days Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {language === "th" ? "แจ้งเตือนทุกวัน" : "Alert Days"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = alertDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => alertEnabled && toggleAlertDay(day.id)}
                      disabled={!alertEnabled}
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all
                        ${isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }
                        ${!alertEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {language === "th" ? day.labelTh : day.label}
                    </button>
                  );
                })}
              </div>
              {alertDays.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "เลือก" : "Selected"}: {alertDays.length} {language === "th" ? "วัน" : "days"}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {language === "th" ? "เวลาแจ้งเตือน" : "Alert Time"}
              </Label>
              <Select
                value={alertTime}
                onValueChange={setAlertTime}
                disabled={!alertEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">
                    {language === "th" ? "Bot จะแจ้งเตือน:" : "Bot will notify:"}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                    <li>{language === "th" ? "งานที่ต้องทำวันนี้" : "Tasks due today"}</li>
                    <li>{language === "th" ? "งานที่เลยกำหนด" : "Overdue tasks"}</li>
                    <li>{language === "th" ? "งานที่ใกล้ถึงกำหนด" : "Upcoming deadlines"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Follow-up Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>
                    {language === "th" ? "Bot ติดตามงานทีม" : "Team Task Follow-up"}
                  </CardTitle>
                  <CardDescription>
                    {language === "th"
                      ? "ติดตามงานที่ยังไม่เสร็จของทีม"
                      : "Follow up on incomplete team tasks"}
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={followUpEnabled}
                onCheckedChange={setFollowUpEnabled}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Days Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {language === "th" ? "ติดตามทุกวัน" : "Follow-up Days"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = followUpDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => followUpEnabled && toggleFollowUpDay(day.id)}
                      disabled={!followUpEnabled}
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all
                        ${isSelected
                          ? "bg-purple-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }
                        ${!followUpEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {language === "th" ? day.labelTh : day.label}
                    </button>
                  );
                })}
              </div>
              {followUpDays.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {language === "th" ? "เลือก" : "Selected"}: {followUpDays.length} {language === "th" ? "วัน" : "days"}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {language === "th" ? "เวลาติดตาม" : "Follow-up Time"}
              </Label>
              <Select
                value={followUpTime}
                onValueChange={setFollowUpTime}
                disabled={!followUpEnabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800 dark:text-purple-200">
                  <p className="font-medium mb-1">
                    {language === "th" ? "Bot จะติดตาม:" : "Bot will follow up on:"}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-purple-700 dark:text-purple-300">
                    <li>{language === "th" ? "งานที่ยังไม่เสร็จของสมาชิกในทีม" : "Incomplete tasks by team members"}</li>
                    <li>{language === "th" ? "งานที่ไม่มีความคืบหน้า" : "Tasks with no progress"}</li>
                    <li>{language === "th" ? "งานที่ต้องการความช่วยเหลือ" : "Tasks that need attention"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {language === "th" ? "ตัวอย่างการตั้งค่า" : "Settings Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {alertEnabled && (
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <Bell className="h-4 w-4 text-blue-600" />
                <div className="text-sm">
                  <span className="font-medium">{language === "th" ? "แจ้งเตือน" : "Alert"}:</span>{" "}
                  <span className="text-muted-foreground">
                    {alertDays.map(d => {
                      const day = daysOfWeek.find(day => day.id === d);
                      return language === "th" ? day?.labelTh : day?.label;
                    }).join(", ")} @ {alertTime}
                  </span>
                </div>
              </div>
            )}
            {followUpEnabled && (
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <UserCheck className="h-4 w-4 text-purple-600" />
                <div className="text-sm">
                  <span className="font-medium">{language === "th" ? "ติดตามทีม" : "Follow-up"}:</span>{" "}
                  <span className="text-muted-foreground">
                    {followUpDays.map(d => {
                      const day = daysOfWeek.find(day => day.id === d);
                      return language === "th" ? day?.labelTh : day?.label;
                    }).join(", ")} @ {followUpTime}
                  </span>
                </div>
              </div>
            )}
            {!alertEnabled && !followUpEnabled && (
              <p className="text-sm text-muted-foreground">
                {language === "th" 
                  ? "ไม่มีการตั้งค่า Bot ที่เปิดใช้งาน" 
                  : "No bot settings enabled"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
