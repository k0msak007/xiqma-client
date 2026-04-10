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
import { useTaskStore } from "@/lib/store";
import { Code, Megaphone, Palette, Briefcase, Rocket, Target, Lightbulb, Heart, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Space, SpaceType } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const spaceColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const spaceIcons = [
  { id: "Code", icon: Code, label: "Development" },
  { id: "Megaphone", icon: Megaphone, label: "Marketing" },
  { id: "Palette", icon: Palette, label: "Design" },
  { id: "Briefcase", icon: Briefcase, label: "Business" },
  { id: "Rocket", icon: Rocket, label: "Launch" },
  { id: "Target", icon: Target, label: "Goals" },
  { id: "Lightbulb", icon: Lightbulb, label: "Ideas" },
  { id: "Heart", icon: Heart, label: "Personal" },
];

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const { addSpace } = useTaskStore();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(spaceColors[0]);
  const [selectedIcon, setSelectedIcon] = useState<string>("Code");
  const [spaceType, setSpaceType] = useState<SpaceType>("organization");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      type: spaceType,
      ownerId: spaceType === "private" ? "user-1" : undefined,
      memberIds: ["user-1"],
      order: Date.now(),
      createdAt: new Date(),
    };

    addSpace(newSpace);
    
    setName("");
    setSelectedColor(spaceColors[0]);
    setSelectedIcon("Code");
    setSpaceType("organization");
    onOpenChange(false);
  };

  const SelectedIconComponent = spaceIcons.find(i => i.id === selectedIcon)?.icon || Code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Spaces help you organize your work. Add folders and lists inside spaces.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Space Type Selection */}
            <div className="space-y-2">
              <Label>Space Type</Label>
              <Tabs value={spaceType} onValueChange={(v) => setSpaceType(v as SpaceType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="organization" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Organization
                  </TabsTrigger>
                  <TabsTrigger value="private" className="gap-2">
                    <User className="h-4 w-4" />
                    Private
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {spaceType === "organization" 
                  ? "Organization spaces are for team projects and shared work."
                  : "Private spaces are for personal tasks like meetings and consultations."}
              </p>
            </div>

            {/* Space Preview */}
            <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/30">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: selectedColor }}
              >
                <SelectedIconComponent className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{name || "Space Name"}</p>
                  <Badge variant={spaceType === "organization" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {spaceType === "organization" ? "Org" : "Private"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">0 folders, 0 lists</p>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Space Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={spaceType === "organization" ? "e.g., Product Development" : "e.g., My Personal Tasks"}
                autoFocus
              />
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {spaceColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      selectedColor === color && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{ 
                      backgroundColor: color,
                      ringColor: color
                    }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {spaceIcons.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all hover:bg-muted",
                      selectedIcon === id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedIcon(id)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Space
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
