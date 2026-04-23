"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, Loader2, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { spacesApi } from "@/lib/api/spaces";
import { employeesApi } from "@/lib/api/employees";

interface SpaceMember {
  id: string;
  employeeId: string;
  joinedAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface SpaceMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  spaceName: string;
}

export function SpaceMembersDialog({ open, onOpenChange, spaceId, spaceName }: SpaceMembersDialogProps) {
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [allEmployees, setAllEmployees] = useState<{ id: string; name: string; email: string; avatarUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && spaceId) {
      loadData();
    }
  }, [open, spaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [spaceDetail, employeesRes] = await Promise.all([
        spacesApi.get(spaceId),
        employeesApi.listAll(),
      ]);
      
      const empList = (employeesRes as unknown as { rows?: { id: string; name: string; email: string; avatarUrl?: string }[] }).rows || employeesRes as unknown as { id: string; name: string; email: string; avatarUrl?: string }[];
      
      setMembers(spaceDetail.members || []);
      setAllEmployees(Array.isArray(empList) ? empList : []);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Prevent render before data is loaded
  if (!loading && allEmployees.length === 0 && members.length === 0) {
    return null;
  }

  const currentMemberIds = members.map(m => m.employeeId);
  const availableEmployees = (allEmployees || []).filter(e => !currentMemberIds.includes(e.id));
  const filteredEmployees = availableEmployees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMembers = async () => {
    if (selectedIds.length === 0) return;
    
    setSaving(true);
    try {
      await spacesApi.addMembers(spaceId, selectedIds);
      toast.success(`Added ${selectedIds.length} member(s)`);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error("Failed to add members:", err);
      toast.error("Failed to add members");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (employeeId: string, name: string) => {
    try {
      await spacesApi.removeMember(spaceId, employeeId);
      toast.success(`Removed ${name}`);
      setMembers(prev => prev.filter(m => m.employeeId !== employeeId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error("Failed to remove member");
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>
            Add or remove members from {spaceName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Members */}
            <div className="border-b pb-4 mb-4">
              <Label className="mb-2 block">Current Members ({members.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                ) : (
                  members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.employee.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {member.employee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.employee.name}</p>
                          <p className="text-xs text-muted-foreground">{member.employee.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(member.employeeId, member.employee.name)}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Members */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>Add New Members</Label>
                {selectedIds.length > 0 && (
                  <Badge variant="secondary">{selectedIds.length} selected</Badge>
                )}
              </div>
              
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 border rounded p-2">
                {filteredEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No employees available to add
                  </p>
                ) : (
                  filteredEmployees.map(emp => {
                    const isSelected = selectedIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleEmployee(emp.id)}
                      >
                        <Checkbox checked={isSelected} />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={emp.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleAddMembers}
            disabled={selectedIds.length === 0 || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserPlus className="mr-2 h-4 w-4" />
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}