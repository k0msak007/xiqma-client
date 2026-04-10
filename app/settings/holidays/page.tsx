"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Sun,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTaskStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import type { SpecialHoliday, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";

const daysOfWeek = [
  { value: 0 as DayOfWeek, labelEn: "Sunday", labelTh: "อาทิตย์" },
  { value: 1 as DayOfWeek, labelEn: "Monday", labelTh: "จันทร์" },
  { value: 2 as DayOfWeek, labelEn: "Tuesday", labelTh: "อังคาร" },
  { value: 3 as DayOfWeek, labelEn: "Wednesday", labelTh: "พุธ" },
  { value: 4 as DayOfWeek, labelEn: "Thursday", labelTh: "พฤหัส" },
  { value: 5 as DayOfWeek, labelEn: "Friday", labelTh: "ศุกร์" },
  { value: 6 as DayOfWeek, labelEn: "Saturday", labelTh: "เสาร์" },
];

export default function HolidaysPage() {
  const { t, language } = useTranslation();
  const {
    holidaySettings,
    addHolidayYear,
    updateWeekendDays,
    addSpecialHoliday,
    updateSpecialHoliday,
    deleteSpecialHoliday,
  } = useTaskStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showAddYearDialog, setShowAddYearDialog] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<SpecialHoliday | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<SpecialHoliday | null>(null);
  const [newYear, setNewYear] = useState(currentYear + 1);

  // Holiday form state
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState<Date | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);

  // Get settings for selected year
  const yearSettings = useMemo(() => {
    return holidaySettings.find((hs) => hs.year === selectedYear);
  }, [holidaySettings, selectedYear]);

  // Available years
  const availableYears = useMemo(() => {
    return holidaySettings.map((hs) => hs.year).sort((a, b) => b - a);
  }, [holidaySettings]);

  // Toggle weekend day
  const toggleWeekendDay = (day: DayOfWeek) => {
    if (!yearSettings) return;
    const newWeekendDays = yearSettings.weekendDays.includes(day)
      ? yearSettings.weekendDays.filter((d) => d !== day)
      : [...yearSettings.weekendDays, day].sort((a, b) => a - b);
    updateWeekendDays(selectedYear, newWeekendDays as DayOfWeek[]);
  };

  // Reset holiday form
  const resetHolidayForm = () => {
    setHolidayName("");
    setHolidayDate(undefined);
    setIsRecurring(false);
    setEditingHoliday(null);
  };

  // Open edit dialog
  const openEditDialog = (holiday: SpecialHoliday) => {
    setEditingHoliday(holiday);
    setHolidayName(holiday.name);
    setHolidayDate(new Date(holiday.date));
    setIsRecurring(holiday.recurring);
    setShowHolidayDialog(true);
  };

  // Handle submit holiday
  const handleSubmitHoliday = () => {
    if (!holidayName.trim() || !holidayDate) return;

    if (editingHoliday) {
      updateSpecialHoliday(selectedYear, editingHoliday.id, {
        name: holidayName.trim(),
        date: holidayDate,
        recurring: isRecurring,
      });
    } else {
      const newHoliday: SpecialHoliday = {
        id: `h-${selectedYear}-${Date.now()}`,
        name: holidayName.trim(),
        date: holidayDate,
        recurring: isRecurring,
      };
      addSpecialHoliday(selectedYear, newHoliday);
    }

    setShowHolidayDialog(false);
    resetHolidayForm();
  };

  // Handle add year
  const handleAddYear = () => {
    addHolidayYear(newYear);
    setSelectedYear(newYear);
    setShowAddYearDialog(false);
    setNewYear(Math.max(...availableYears) + 1);
  };

  // Handle delete holiday
  const handleDeleteHoliday = () => {
    if (holidayToDelete) {
      deleteSpecialHoliday(selectedYear, holidayToDelete.id);
      setShowDeleteDialog(false);
      setHolidayToDelete(null);
    }
  };

  // Sort holidays by date
  const sortedHolidays = useMemo(() => {
    if (!yearSettings) return [];
    return [...yearSettings.specialHolidays].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [yearSettings]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "th" ? "ตั้งค่าวันหยุด" : "Holiday Settings"}
          </h1>
          <p className="text-muted-foreground">
            {language === "th"
              ? "กำหนดวันหยุดสุดสัปดาห์และวันหยุดพิเศษ"
              : "Configure weekend days and special holidays"}
          </p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">
            {language === "th" ? "ปี" : "Year"}:
          </Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => setShowAddYearDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "th" ? "เพิ่มปี" : "Add Year"}
        </Button>
      </div>

      {yearSettings ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekend Days */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-orange-500" />
                {language === "th" ? "วันหยุดสุดสัปดาห์" : "Weekend Days"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? "เลือกวันที่ไม่นับเป็นวันทำงาน"
                  : "Select days that are not working days"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {daysOfWeek.map((day) => {
                  const isWeekend = yearSettings.weekendDays.includes(day.value);
                  return (
                    <div
                      key={day.value}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                        isWeekend
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleWeekendDay(day.value)}
                    >
                      <Checkbox checked={isWeekend} />
                      <span className="text-sm font-medium">
                        {language === "th" ? day.labelTh : day.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? "วันหยุดที่เลือก: " : "Selected weekends: "}
                  <span className="font-medium text-foreground">
                    {yearSettings.weekendDays.length > 0
                      ? yearSettings.weekendDays
                          .map((d) => {
                            const day = daysOfWeek.find((dw) => dw.value === d);
                            return language === "th" ? day?.labelTh : day?.labelEn;
                          })
                          .join(", ")
                      : language === "th"
                      ? "ไม่มี"
                      : "None"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {language === "th" ? "สรุป" : "Summary"}
              </CardTitle>
              <CardDescription>
                {language === "th"
                  ? `ข้อมูลวันหยุดปี ${selectedYear}`
                  : `Holiday information for ${selectedYear}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    {yearSettings.weekendDays.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "วันหยุด/สัปดาห์" : "Weekend days/week"}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-orange-500">
                    {yearSettings.specialHolidays.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "วันหยุดพิเศษ" : "Special holidays"}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center col-span-2">
                  <p className="text-3xl font-bold text-green-600">
                    {yearSettings.specialHolidays.filter((h) => h.recurring).length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "วันหยุดประจำ (ทุกปี)" : "Recurring holidays"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                {language === "th" ? "ไม่มีข้อมูลสำหรับปีนี้" : "No data for this year"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {language === "th"
                  ? "กรุณาเพิ่มปีใหม่เพื่อเริ่มกำหนดวันหยุด"
                  : "Please add a new year to start configuring holidays"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Holidays Table */}
      {yearSettings && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-red-500" />
                  {language === "th" ? "วันหยุดพิเศษ" : "Special Holidays"}
                </CardTitle>
                <CardDescription>
                  {language === "th"
                    ? "รายการวันหยุดพิเศษนอกเหนือจากวันหยุดสุดสัปดาห์"
                    : "Special holidays in addition to weekend days"}
                </CardDescription>
              </div>
              <Button onClick={() => setShowHolidayDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {language === "th" ? "เพิ่มวันหยุด" : "Add Holiday"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedHolidays.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "th" ? "วันที่" : "Date"}</TableHead>
                      <TableHead>{language === "th" ? "ชื่อวันหยุด" : "Holiday Name"}</TableHead>
                      <TableHead>{language === "th" ? "ประเภท" : "Type"}</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHolidays.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">
                          {format(new Date(holiday.date), "d MMM yyyy")}
                        </TableCell>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell>
                          {holiday.recurring ? (
                            <Badge variant="secondary" className="gap-1">
                              <RefreshCw className="h-3 w-3" />
                              {language === "th" ? "ทุกปี" : "Recurring"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              {language === "th" ? "เฉพาะปีนี้" : "This year only"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(holiday)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                setHolidayToDelete(holiday);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  {language === "th" ? "ยังไม่มีวันหยุดพิเศษ" : "No special holidays"}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {language === "th"
                    ? "คลิกปุ่มเพิ่มวันหยุดเพื่อเริ่มต้น"
                    : "Click Add Holiday to get started"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Year Dialog */}
      <Dialog open={showAddYearDialog} onOpenChange={setShowAddYearDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "เพิ่มปีใหม่" : "Add New Year"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "เพิ่มการตั้งค่าวันหยุดสำหรับปีใหม่"
                : "Add holiday settings for a new year"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "th" ? "ปี" : "Year"}</Label>
              <Input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value) || currentYear)}
                min={2020}
                max={2100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddYearDialog(false)}>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              onClick={handleAddYear}
              disabled={availableYears.includes(newYear)}
            >
              {language === "th" ? "เพิ่ม" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Holiday Dialog */}
      <Dialog
        open={showHolidayDialog}
        onOpenChange={(open) => {
          setShowHolidayDialog(open);
          if (!open) resetHolidayForm();
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingHoliday
                ? language === "th"
                  ? "แก้ไขวันหยุด"
                  : "Edit Holiday"
                : language === "th"
                ? "เพิ่มวันหยุดพิเศษ"
                : "Add Special Holiday"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? `เพิ่มวันหยุดพิเศษสำหรับปี ${selectedYear}`
                : `Add a special holiday for ${selectedYear}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "th" ? "ชื่อวันหยุด" : "Holiday Name"}</Label>
              <Input
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder={
                  language === "th" ? "เช่น วันขึ้นปีใหม่" : "e.g., New Year's Day"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "วันที่" : "Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !holidayDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {holidayDate
                      ? format(holidayDate, "PPP")
                      : language === "th"
                      ? "เลือกวันที่"
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={holidayDate}
                    onSelect={setHolidayDate}
                    defaultMonth={new Date(selectedYear, 0)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">
                  {language === "th" ? "วันหยุดประจำ" : "Recurring Holiday"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {language === "th"
                    ? "ทำซ้ำทุกปีในวันและเดือนเดียวกัน"
                    : "Repeat every year on the same date"}
                </p>
              </div>
              <Checkbox
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowHolidayDialog(false);
                resetHolidayForm();
              }}
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmitHoliday}
              disabled={!holidayName.trim() || !holidayDate}
            >
              {editingHoliday
                ? language === "th"
                  ? "บันทึก"
                  : "Save"
                : language === "th"
                ? "เพิ่ม"
                : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "th" ? "ยืนยันการลบ" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "th"
                ? `คุณต้องการลบวันหยุด "${holidayToDelete?.name}" หรือไม่?`
                : `Are you sure you want to delete "${holidayToDelete?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHoliday}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
