"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTaskStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  UserPlus,
  UserMinus,
  Briefcase,
} from "lucide-react";
import type { Position, User } from "@/lib/types";

const levelLabels: Record<number, { en: string; th: string }> = {
  1: { en: "Executive", th: "ผู้บริหารสูงสุด" },
  2: { en: "C-Level", th: "ผู้บริหารระดับสูง" },
  3: { en: "VP/Director", th: "รองประธาน/ผู้อำนวยการ" },
  4: { en: "Manager", th: "ผู้จัดการ" },
  5: { en: "Senior Staff", th: "พนักงานอาวุโส" },
  6: { en: "Staff", th: "พนักงาน" },
};

const levelColors: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#8b5cf6",
  4: "#10b981",
  5: "#3b82f6",
  6: "#6b7280",
};

const defaultColors = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

// Tree Node Component for recursive rendering
interface TreeNodeProps {
  position: Position;
  level: number;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
  getChildPositions: (parentId: string) => Position[];
  getUsersForPosition: (positionId: string) => User[];
  levelColors: Record<number, string>;
  language: string;
  onEdit: (position: Position) => void;
  onDelete: (position: Position) => void;
  onAssign: (position: Position) => void;
}

function TreeNode({
  position,
  level,
  expandedNodes,
  toggleExpand,
  getChildPositions,
  getUsersForPosition,
  levelColors,
  language,
  onEdit,
  onDelete,
  onAssign,
}: TreeNodeProps) {
  const children = getChildPositions(position.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(position.id);
  const positionUsers = getUsersForPosition(position.id);

  return (
    <div>
      {/* Position Row */}
      <div 
        className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => hasChildren && toggleExpand(position.id)}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
            hasChildren ? "hover:bg-muted cursor-pointer" : "cursor-default"
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          )}
        </button>

        {/* Level Badge */}
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: position.color || levelColors[position.level] }}
        >
          {position.level}
        </div>

        {/* Position Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium truncate">{position.name}</span>
          {position.jobLevel && (
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {position.jobLevel}
            </Badge>
          )}
          {position.department && (
            <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
              {position.department}
            </Badge>
          )}
        </div>

        {/* Users */}
        <div className="flex items-center gap-1 shrink-0">
          {positionUsers.slice(0, 3).map((user) => (
            <Avatar 
              key={user.id} 
              className="h-6 w-6 border-2 border-background"
              title={`${user.name}${(user.positionIds?.length || 0) > 1 ? ` (+${(user.positionIds?.length || 1) - 1} positions)` : ""}`}
            >
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-[10px]">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          ))}
          {positionUsers.length > 3 && (
            <Badge variant="secondary" className="h-6 px-1.5 text-xs">
              +{positionUsers.length - 3}
            </Badge>
          )}
          {positionUsers.length === 0 && (
            <span className="text-xs text-muted-foreground">
              {language === "th" ? "ว่าง" : "Empty"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAssign(position)}
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(position)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(position)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line connector */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
            style={{ left: `${level * 24 + 18}px` }}
          />
          {children.map((child) => (
            <TreeNode
              key={child.id}
              position={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              getChildPositions={getChildPositions}
              getUsersForPosition={getUsersForPosition}
              levelColors={levelColors}
              language={language}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={onAssign}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  const { t, language } = useTranslation();
  const { 
    positions, 
    users, 
    addPosition, 
    updatePosition, 
    deletePosition,
    addUserToPosition,
    removeUserFromPosition,
  } = useTaskStore();
  
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState(5);
  const [jobLevel, setJobLevel] = useState("");
  const [parentPositionId, setParentPositionId] = useState<string | undefined>();
  const [color, setColor] = useState("#3b82f6");
  
  // Assign user dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningPosition, setAssigningPosition] = useState<Position | null>(null);
  
  // Group positions by level
  const positionsByLevel = useMemo(() => {
    const grouped: Record<number, Position[]> = {};
    positions.forEach((pos) => {
      if (!grouped[pos.level]) {
        grouped[pos.level] = [];
      }
      grouped[pos.level].push(pos);
    });
    // Sort each level's positions by department then name
    Object.keys(grouped).forEach((lvl) => {
      grouped[Number(lvl)].sort((a, b) => {
        if (a.department && b.department && a.department !== b.department) {
          return a.department.localeCompare(b.department);
        }
        return a.name.localeCompare(b.name);
      });
    });
    return grouped;
  }, [positions]);

  const levels = Object.keys(positionsByLevel).map(Number).sort((a, b) => a - b);

  // Get users for a position
  const getUsersForPosition = (positionId: string) => {
    return users.filter((u) => u.positionIds?.includes(positionId));
  };

  // Get all positions a user holds
  const getPositionsForUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || !user.positionIds) return [];
    return user.positionIds.map((id) => positions.find((p) => p.id === id)).filter(Boolean) as Position[];
  };

  // Get unassigned users (users with no positions)
  const unassignedUsers = useMemo(() => {
    return users.filter((u) => !u.positionIds || u.positionIds.length === 0);
  }, [users]);

  const resetForm = () => {
    setName("");
    setDepartment("");
    setLevel(5);
    setJobLevel("");
    setParentPositionId(undefined);
    setColor("#3b82f6");
    setEditingPosition(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (position: Position) => {
    setEditingPosition(position);
    setName(position.name);
    setDepartment(position.department || "");
    setLevel(position.level);
    setJobLevel(position.jobLevel || "");
    setParentPositionId(position.parentPositionId);
    setColor(position.color || "#3b82f6");
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const positionData = {
      name: name.trim(),
      department: department.trim() || undefined,
      level,
      jobLevel: jobLevel.trim() || undefined,
      parentPositionId,
      color,
    };

    if (editingPosition) {
      updatePosition(editingPosition.id, positionData);
    } else {
      const newPosition: Position = {
        id: `pos-${Date.now()}`,
        ...positionData,
        createdAt: new Date(),
      };
      addPosition(newPosition);
    }

    setShowDialog(false);
    resetForm();
  };

  const confirmDelete = (position: Position) => {
    setPositionToDelete(position);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (positionToDelete) {
      deletePosition(positionToDelete.id);
      setShowDeleteDialog(false);
      setPositionToDelete(null);
    }
  };

  const openAssignDialog = (position: Position) => {
    setAssigningPosition(position);
    setShowAssignDialog(true);
  };

  const toggleUserPosition = (userId: string, positionId: string, isAssigned: boolean) => {
    if (isAssigned) {
      removeUserFromPosition(userId, positionId);
    } else {
      addUserToPosition(userId, positionId);
    }
  };

  // Get parent position name
  const getParentName = (parentId?: string) => {
    if (!parentId) return null;
    const parent = positions.find((p) => p.id === parentId);
    return parent?.name;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  {language === "th" ? "โครงสร้างองค์กร" : "Organization Chart"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {language === "th" 
                    ? "จัดการตำแหน่งและโครงสร้างบริษัท" 
                    : "Manage positions and company structure"}
                </p>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {language === "th" ? "เพิ่มตำแหน่ง" : "Add Position"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{positions.length}</div>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "ตำแหน่งทั้งหมด" : "Total Positions"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{levels.length}</div>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "ระดับชั้น" : "Levels"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{users.filter((u) => u.positionIds && u.positionIds.length > 0).length}</div>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "พนักงานมีตำแหน่ง" : "Assigned Users"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{unassignedUsers.length}</div>
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "ยังไม่มีตำแหน่ง" : "Unassigned"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Organization Chart by Level */}
        <div className="space-y-6">
          {levels.map((lvl) => (
            <div key={lvl} className="relative">
              {/* Level Header */}
              <div 
                className="sticky top-0 z-10 flex items-center gap-3 py-2 px-4 rounded-lg mb-3"
                style={{ backgroundColor: `${levelColors[lvl]}15` }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: levelColors[lvl] }}
                >
                  {lvl}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: levelColors[lvl] }}>
                    Level {lvl}: {language === "th" ? levelLabels[lvl]?.th : levelLabels[lvl]?.en || `Level ${lvl}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {positionsByLevel[lvl]?.length || 0} {language === "th" ? "ตำแหน่ง" : "positions"}
                  </p>
                </div>
              </div>

              {/* Positions in this level */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-4">
                {positionsByLevel[lvl]?.map((position) => {
                  const positionUsers = getUsersForPosition(position.id);
                  const parentName = getParentName(position.parentPositionId);
                  
                  return (
                    <Card key={position.id} className="relative overflow-hidden">
                      {/* Color bar */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: position.color || levelColors[lvl] }}
                      />
                      
                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate flex items-center gap-2">
                              <Briefcase 
                                className="h-4 w-4 shrink-0" 
                                style={{ color: position.color || levelColors[lvl] }}
                              />
                              {position.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {position.department && (
                                <Badge variant="secondary" className="text-xs">
                                  {position.department}
                                </Badge>
                              )}
                              {position.jobLevel && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {position.jobLevel}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openAssignDialog(position)}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(position)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => confirmDelete(position)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Reports to */}
                        {parentName && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {language === "th" ? "รายงานต่อ:" : "Reports to:"} {parentName}
                          </p>
                        )}
                        
                        {/* Assigned Users */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {positionUsers.length} {language === "th" ? "คน" : "users"}
                            </span>
                          </div>
                          
                          {positionUsers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {positionUsers.slice(0, 5).map((user) => (
                                <div 
                                  key={user.id}
                                  className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5"
                                  title={`${user.name} - ${getPositionsForUser(user.id).map(p => p.name).join(", ")}`}
                                >
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-[8px]">
                                      {user.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate max-w-[80px]">{user.name.split(" ")[0]}</span>
                                  {(user.positionIds?.length || 0) > 1 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                      +{(user.positionIds?.length || 1) - 1}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                              {positionUsers.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{positionUsers.length - 5}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {language === "th" ? "ยังไม่มีพนักงาน" : "No users assigned"}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {levels.length === 0 && (
            <Card className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {language === "th" ? "ยังไม่มีตำแหน่ง" : "No Positions Yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === "th" 
                  ? "เริ่มต้นสร้างโครงสร้างองค์กรด้วยการเพิ่มตำแหน่ง" 
                  : "Start building your org chart by adding positions"}
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {language === "th" ? "เพิ่มตำแหน่งแรก" : "Add First Position"}
              </Button>
            </Card>
          )}
        </div>

        {/* Unassigned Users Section */}
        {unassignedUsers.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {language === "th" ? "พนักงานที่ยังไม่มีตำแหน่ง" : "Unassigned Users"}
              <Badge variant="secondary">{unassignedUsers.length}</Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {unassignedUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Position Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPosition 
                ? (language === "th" ? "แก้ไขตำแหน่ง" : "Edit Position")
                : (language === "th" ? "เพิ่มตำแหน่งใหม่" : "Add New Position")}
            </DialogTitle>
            <DialogDescription>
              {language === "th" 
                ? "กรอกข้อมูลตำแหน่งในองค์กร" 
                : "Fill in the position details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "th" ? "ชื่อตำแหน่ง" : "Position Name"}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "th" ? "เช่น Engineering Manager" : "e.g., Engineering Manager"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "th" ? "ระดับ" : "Level"}</Label>
                <Select value={level.toString()} onValueChange={(v) => setLevel(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <SelectItem key={l} value={l.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: levelColors[l] }}
                          />
                          {l} - {language === "th" ? levelLabels[l]?.th : levelLabels[l]?.en}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === "th" ? "Job Level" : "Job Level"}</Label>
                <Input
                  value={jobLevel}
                  onChange={(e) => setJobLevel(e.target.value)}
                  placeholder="e.g., M1, S2, C1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "แผนก" : "Department"}</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={language === "th" ? "เช่น Engineering" : "e.g., Engineering"}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "รายงานต่อ" : "Reports To"}</Label>
              <Select 
                value={parentPositionId || "none"} 
                onValueChange={(v) => setParentPositionId(v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "th" ? "เลือกตำแหน่งหัวหน้า" : "Select manager position"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {language === "th" ? "ไม่มี (ตำแหน่งสูงสุด)" : "None (Top Position)"}
                  </SelectItem>
                  {positions
                    .filter((p) => p.id !== editingPosition?.id)
                    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                    .map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="w-6 h-5 flex items-center justify-center text-xs"
                            style={{ borderColor: levelColors[pos.level], color: levelColors[pos.level] }}
                          >
                            {pos.level}
                          </Badge>
                          {pos.name}
                          {pos.jobLevel && (
                            <span className="text-xs text-muted-foreground">({pos.jobLevel})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "th" ? "สี" : "Color"}</Label>
              <div className="flex flex-wrap gap-2">
                {defaultColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {editingPosition 
                ? (language === "th" ? "บันทึก" : "Save Changes")
                : (language === "th" ? "เพิ่ม" : "Add Position")}
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
                ? `คุณต้องการลบตำแหน่ง "${positionToDelete?.name}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
                : `Are you sure you want to delete "${positionToDelete?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {language === "th" ? "ลบ" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Users Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {language === "th" ? "จัดการพนักงานในตำแหน่ง" : "Manage Position Users"}
            </DialogTitle>
            <DialogDescription>
              {assigningPosition?.name}
              {assigningPosition?.jobLevel && ` (${assigningPosition.jobLevel})`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 py-4">
              {users.map((user) => {
                const isAssigned = user.positionIds?.includes(assigningPosition?.id || "");
                const userPositions = getPositionsForUser(user.id);
                
                return (
                  <div 
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isAssigned ? "bg-primary/5 border-primary/20" : "hover:bg-muted"
                    }`}
                    onClick={() => assigningPosition && toggleUserPosition(user.id, assigningPosition.id, isAssigned || false)}
                  >
                    <Checkbox checked={isAssigned} />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {userPositions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {userPositions.map((pos) => (
                            <Badge 
                              key={pos.id} 
                              variant="secondary" 
                              className="text-[10px] px-1 h-4"
                              style={{ 
                                backgroundColor: `${pos.color}20`,
                                color: pos.color,
                              }}
                            >
                              {pos.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setShowAssignDialog(false)}>
              {language === "th" ? "เสร็จสิ้น" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
