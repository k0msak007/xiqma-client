"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listsApi, type CreateStatusPayload } from "@/lib/api/lists";

interface AddStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  onSuccess?: (status: { id: string; name: string; color: string; type: string }) => void;
}

const PRESET_COLORS = [
  "#6b7280", // gray
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function AddStatusDialog({ open, onOpenChange, listId, onSuccess }: AddStatusDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [type, setType] = useState<"open" | "in_progress" | "review" | "done" | "closed">("open");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      const payload: CreateStatusPayload = {
        name: name.trim(),
        color,
        type,
      };
      const result = await listsApi.createStatus(listId, payload);
      if (onSuccess) {
        onSuccess(result);
      }
      setName("");
      setColor(PRESET_COLORS[0]);
      setType("open");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create status:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Status</DialogTitle>
          <DialogDescription>
            Create a new status column for this list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status-name">Status Name</Label>
            <Input
              id="status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., In Review, Testing, Done"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2 flex-wrap">
              {(["open", "in_progress", "review", "done", "closed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || saving}>
            {saving ? "Creating..." : "Create Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}