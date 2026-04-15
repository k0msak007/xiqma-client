"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/workspace-store";

const folderColors = [
  "#6b7280",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
];

interface Props {
  spaceId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderDialog({ spaceId, onOpenChange }: Props) {
  const { createFolder } = useWorkspaceStore();
  const [name, setName]       = useState("");
  const [color, setColor]     = useState(folderColors[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !spaceId) return;

    setLoading(true);
    const folder = await createFolder({ name: name.trim(), spaceId, color });
    setLoading(false);

    if (folder) {
      setName("");
      setColor(folderColors[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={!!spaceId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sprint 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {folderColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      color === c && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
