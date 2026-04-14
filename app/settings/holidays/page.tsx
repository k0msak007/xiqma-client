"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import { holidaysApi, type Holiday, type CreateHolidayPayload } from "@/lib/api/holidays";
import { cn } from "@/lib/utils";

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Holiday form state
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState<Date | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [note, setNote] = useState("");

  const loadHolidays = async (year: number) => {
    try {
      setIsLoading(true);
      const data = await holidaysApi.list(year);
      setHolidays(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load holidays");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays(selectedYear);
  }, [selectedYear]);

  const sortedHolidays = useMemo(() => {
    return [...holidays].sort(
      (a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
    );
  }, [holidays]);

  const resetHolidayForm = () => {
    setHolidayName("");
    setHolidayDate(undefined);
    setIsRecurring(false);
    setNote("");
    setEditingHoliday(null);
  };

  const openCreateDialog = () => {
    resetHolidayForm();
    setShowHolidayDialog(true);
  };

  const openEditDialog = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayName(holiday.name);
    setHolidayDate(new Date(holiday.holidayDate));
    setIsRecurring(holiday.isRecurring);
    setNote(holiday.note || "");
    setShowHolidayDialog(true);
  };

  const handleSubmitHoliday = async () => {
    if (!holidayName.trim() || !holidayDate) return;
    setIsSaving(true);

    const payload: CreateHolidayPayload = {
      name: holidayName.trim(),
      holidayDate: format(holidayDate, "yyyy-MM-dd"),
      isRecurring,
      note: note.trim() || undefined,
    };

    try {
      if (editingHoliday) {
        await holidaysApi.update(editingHoliday.id, payload);
        toast.success("Holiday updated");
      } else {
        await holidaysApi.create(payload);
        toast.success("Holiday added");
      }
      setShowHolidayDialog(false);
      resetHolidayForm();
      await loadHolidays(selectedYear);
    } catch (err) {
      console.error(err);
      toast.error(editingHoliday ? "Failed to update holiday" : "Failed to add holiday");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deleteHolidayId) return;
    try {
      await holidaysApi.delete(deleteHolidayId);
      toast.success("Holiday deleted");
      setDeleteHolidayId(null);
      await loadHolidays(selectedYear);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete holiday");
    }
  };

  const deletingHoliday = holidays.find((h) => h.id === deleteHolidayId);
  const recurringCount = holidays.filter((h) => h.isRecurring).length;

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
          <h1 className="text-2xl font-bold tracking-tight">Holiday Settings</h1>
          <p className="text-muted-foreground">
            Configure special holidays and recurring annual holidays.
          </p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Year:</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{holidays.length}</div>
            <p className="text-sm text-muted-foreground">Total Holidays in {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{recurringCount}</div>
            <p className="text-sm text-muted-foreground">Recurring (Annual)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{holidays.length - recurringCount}</div>
            <p className="text-sm text-muted-foreground">One-time Only</p>
          </CardContent>
        </Card>
      </div>

      {/* Holidays Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-red-500" />
            Holidays for {selectedYear}
          </CardTitle>
          <CardDescription>
            Special holidays in addition to regular weekend days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : sortedHolidays.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHolidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                      {format(new Date(holiday.holidayDate), "d MMM yyyy")}
                    </TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>
                      {holiday.isRecurring ? (
                        <Badge variant="secondary" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Recurring
                        </Badge>
                      ) : (
                        <Badge variant="outline">This year only</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {holiday.note || "-"}
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
                          onClick={() => setDeleteHolidayId(holiday.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No holidays for {selectedYear}</h3>
              <p className="mt-2 text-muted-foreground">
                Click &quot;Add Holiday&quot; to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
              {editingHoliday ? "Edit Holiday" : "Add Holiday"}
            </DialogTitle>
            <DialogDescription>
              {editingHoliday
                ? "Update the holiday details."
                : `Add a holiday for ${selectedYear}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Holiday Name *</Label>
              <Input
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g., New Year's Day"
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
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
                    {holidayDate ? format(holidayDate, "PPP") : "Pick a date"}
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

            <div className="space-y-2">
              <Label htmlFor="holiday-note">Note</Label>
              <Textarea
                id="holiday-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
                rows={2}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Recurring Holiday</Label>
                <p className="text-sm text-muted-foreground">
                  Repeat every year on the same date
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
              Cancel
            </Button>
            <Button
              onClick={handleSubmitHoliday}
              disabled={!holidayName.trim() || !holidayDate || isSaving}
            >
              {isSaving ? "Saving..." : editingHoliday ? "Save" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteHolidayId} onOpenChange={(open) => { if (!open) setDeleteHolidayId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingHoliday?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHoliday}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
