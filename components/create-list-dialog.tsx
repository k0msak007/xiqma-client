"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/workspace-store";

const listColors = [
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
  folderId?: string;
  onOpenChange: (open: boolean) => void;
}

export function CreateListDialog({ spaceId, folderId, onOpenChange }: Props) {
  const { createList, spaces, folders } = useWorkspaceStore();
  const [name, setName]       = useState("");
  const [color, setColor]     = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const space  = spaces.find((s) => s.id === spaceId);
  const folder = folders.find((f) => f.id === folderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !spaceId) return;

    setLoading(true);
    const list = await createList({ name: name.trim(), spaceId, folderId, color });
    setLoading(false);

    if (list) {
      setName("");
      setColor(undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={!!spaceId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
            {(space || folder) && (
              <DialogDescription>
                {folder ? `In folder: ${folder.name}` : `In space: ${space?.name}`}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Backlog"
              />
            </div>
            <div className="space-y-2">
              <Label>Color (optional)</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    !color && "border-primary"
                  )}
                  style={{ backgroundColor: "#e5e7eb" }}
                  onClick={() => setColor(undefined)}
                  title="No color"
                />
                {listColors.map((c) => (
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
              {loading ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
