"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Send,
  Pencil,
  Trash2,
  Upload,
  File,
  MoreHorizontal,
  Flag,
  Layers,
  TrendingUp,
  Target,
  Link2,
  X,
  Play,
  Square,
  Plus,
  History,
  RotateCcw,
  AlertCircle,
  FileText,
  ArrowRightLeft,
  FolderKanban,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTaskStore } from "@/lib/store";
import {
  calculatePlanFinish,
  calculatePlanProgress,
  calculatePlanProgressWorkDays,
} from "@/lib/types";
import { performanceConfigApi } from "@/lib/api/performance-config";
import { useTranslation } from "@/lib/i18n";
import { tasksApi, type ApiTaskDetail } from "@/lib/api/tasks";
import { commentsApi, type Comment as ApiComment } from "@/lib/api/comments";
import { subtasksApi, type Subtask } from "@/lib/api/subtasks";
import { timeTrackingApi, type TimeSession } from "@/lib/api/time-tracking";
import { reworkApi, type ReworkEvent } from "@/lib/api/rework";
import { attachmentsApi, type Attachment } from "@/lib/api/attachments";
import { toast } from "sonner";
import { listsApi, type ListStatus } from "@/lib/api/lists";
import { useAuthStore } from "@/lib/auth-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { spacesApi } from "@/lib/api/spaces";
import { MentionTextarea, type MentionEmployee } from "@/components/mention-textarea";
import { taskTemplatesApi } from "@/lib/api/task-templates";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskViewPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;

  const [task, setTask] = useState<ApiTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statuses from API
  const [statusesFromApi, setStatusesFromApi] = useState<ListStatus[]>([]);

  // Comments
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Local state
  const [newComment, setNewComment] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [estimateProgress, setEstimateProgress] = useState(0);
  const [showEditProgressDialog, setShowEditProgressDialog] = useState(false);

  // Timer state
  const [runningTimer, setRunningTimer] = useState<{ id: string; startedAt: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Time sessions + manual log dialog
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logHours, setLogHours] = useState<string>("0");
  const [logMinutes, setLogMinutes] = useState<string>("30");
  const [logNote, setLogNote] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Rework
  const [reworkEvents, setReworkEvents] = useState<ReworkEvent[]>([]);
  const [showReworkDialog, setShowReworkDialog] = useState(false);
  const [reworkToStatusId, setReworkToStatusId] = useState<string>("");
  const [reworkReason, setReworkReason] = useState("");
  const [isSavingRework, setIsSavingRework] = useState(false);
  const [showReworkHistory, setShowReworkHistory] = useState(false);

  // Assignee's work_days (for Plan Progress calc)
  const [assigneeWorkDays, setAssigneeWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Mention candidates (space members) for @-autocomplete
  const [mentionCandidates, setMentionCandidates] = useState<MentionEmployee[]>([]);

  // Move task to another list (admin/manager only)
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTargetListId, setMoveTargetListId] = useState<string>("");
  const [isMoving, setIsMoving] = useState(false);
  const { spaces, folders, lists, loadWorkspace } = useWorkspaceStore();

  // Get current user from auth store
  const user = useAuthStore((s) => s.user);
  const { taskTypes } = useTaskStore();
  const currentUserId = user?.id || "";
  const currentUser = user ? { name: user.name, avatar: undefined as string | undefined } : null;

  // Load task from API
  useEffect(() => {
    if (taskId) {
      setLoading(true);
      setError(null);
      tasksApi.get(taskId)
        .then((data) => {
          console.log("Task loaded:", data);
          setTask(data);
          // Set estimate progress from API
          const progress = data.estimateProgress ?? (data as any).estimate_progress ?? 0;
          setEstimateProgress(progress);
          // Load statuses for this task's list
          // Handle both camelCase and snake_case from API
          const listId = data.listId || (data as any).list_id;
          console.log("Loading statuses for listId:", listId);
          if (listId) {
            listsApi.getStatuses(listId)
              .then((statuses) => {
                console.log("Statuses loaded:", statuses);
                setStatusesFromApi(statuses);
              })
              .catch((err) => {
                console.error("Failed to load statuses:", err);
              });
          }
        })
        .catch((err) => {
          console.error("Failed to load task:", err);
          setError(err instanceof Error ? err.message : "Failed to load task");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [taskId]);

  // Load attachments
  useEffect(() => {
    if (taskId) {
      attachmentsApi.list(taskId).then(setAttachments).catch(() => {});
    }
  }, [taskId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    setUploading(true);
    try {
      const uploaded = await attachmentsApi.upload(taskId, file);
      setAttachments((prev) => [...prev, uploaded]);
      toast.success(language === "th" ? "อัปโหลดสำเร็จ" : "Uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load comments from API
  useEffect(() => {
    if (taskId) {
      setCommentsLoading(true);
      setCommentsError(null);
      commentsApi.list(taskId)
        .then((data) => {
          console.log("Comments loaded:", data);
          setComments(data);
        })
        .catch((err) => {
          console.error("Failed to load comments:", err);
          setCommentsError(err instanceof Error ? err.message : "Failed to load comments");
        })
        .finally(() => {
          setCommentsLoading(false);
        });
    }
  }, [taskId]);

  // Load subtasks
  useEffect(() => {
    if (!taskId) return;
    subtasksApi.list(taskId)
      .then(setSubtasks)
      .catch((err) => console.error("Failed to load subtasks:", err));
  }, [taskId]);

  const reloadSubtasks = async () => {
    try { setSubtasks(await subtasksApi.list(taskId)); } catch { /* ignore */ }
  };

  const handleAddSubtask = async () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    try {
      const row = await subtasksApi.create(taskId, { title });
      setSubtasks((prev) => [...prev, row]);
      setNewSubtaskTitle("");
    } catch {
      toast.error(language === "th" ? "เพิ่ม subtask ไม่สำเร็จ" : "Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (id: string) => {
    try {
      const updated = await subtasksApi.toggle(taskId, id);
      setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      toast.error(language === "th" ? "อัปเดตไม่สำเร็จ" : "Failed to update");
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    try {
      await subtasksApi.delete(taskId, id);
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error(language === "th" ? "ลบไม่สำเร็จ" : "Failed to delete");
    }
  };

  const beginEditSubtask = (s: Subtask) => {
    setEditingSubtaskId(s.id);
    setEditingSubtaskTitle(s.title);
  };

  const saveEditSubtask = async () => {
    if (!editingSubtaskId) return;
    const title = editingSubtaskTitle.trim();
    if (!title) { setEditingSubtaskId(null); return; }
    try {
      const updated = await subtasksApi.update(taskId, editingSubtaskId, { title });
      setSubtasks((prev) => prev.map((s) => (s.id === editingSubtaskId ? updated : s)));
      setEditingSubtaskId(null);
      setEditingSubtaskTitle("");
    } catch {
      toast.error(language === "th" ? "แก้ไขไม่สำเร็จ" : "Failed to edit");
    }
    void reloadSubtasks;
  };

  // Check for running timer
  useEffect(() => {
    const checkTimer = async () => {
      try {
        const sessions = await tasksApi.getTimer(taskId);
        const running = sessions.find(s => !s.endedAt);
        if (running) {
          setRunningTimer(running);
          const startTime = new Date(running.startedAt).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setElapsedSeconds(elapsed);
        } else {
          setRunningTimer(null);
          setElapsedSeconds(0);
        }
      } catch { /* ignore */ }
    };
    
    if (taskId) {
      checkTimer();
      const interval = setInterval(checkTimer, 10000);
      return () => clearInterval(interval);
    }
  }, [taskId]);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      const startTime = new Date(runningTimer.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  const toggleTimer = async () => {
    try {
      if (runningTimer) {
        await tasksApi.stopTimer(taskId);
        setRunningTimer(null);
        setElapsedSeconds(0);
        const [updated] = await Promise.all([tasksApi.get(taskId), loadSessions()]);
        setTask(updated);
        toast.success(language === "th" ? "หยุดจับเวลาแล้ว" : "Timer stopped");
      } else {
        const session = await tasksApi.startTimer(taskId);
        setRunningTimer(session);
        const startTime = new Date(session.startedAt).getTime();
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
        toast.success(language === "th" ? "เริ่มจับเวลาแล้ว" : "Timer started");
      }
    } catch (err: any) {
      if (err?.data?.error === "SESSION_ALREADY_RUNNING") {
        toast.error(language === "th" ? "มี timer กำลังทำงานอยู่แล้ว" : "A timer is already running");
      } else {
        toast.error(language === "th" ? "ไม่สามารถจับเวลาได้" : "Failed to toggle timer");
      }
    }
  };

  // Load sessions
  const loadSessions = async () => {
    try {
      const list = await timeTrackingApi.list(taskId);
      setSessions(list);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (taskId) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const refreshTaskAndSessions = async () => {
    try {
      const [updated] = await Promise.all([
        tasksApi.get(taskId),
        loadSessions(),
      ]);
      setTask(updated);
    } catch { /* ignore */ }
  };

  const handleLogTime = async () => {
    const h = parseInt(logHours || "0", 10) || 0;
    const m = parseInt(logMinutes || "0", 10) || 0;
    const totalMin = h * 60 + m;
    if (totalMin < 1) {
      toast.error(language === "th" ? "กรุณาระบุเวลา" : "Please enter a duration");
      return;
    }
    if (totalMin > 24 * 60) {
      toast.error(language === "th" ? "เวลาต้องไม่เกิน 24 ชั่วโมง" : "Duration must be ≤ 24 hours");
      return;
    }
    setIsSavingLog(true);
    try {
      await timeTrackingApi.log(taskId, { durationMin: totalMin, note: logNote.trim() || undefined });
      toast.success(language === "th" ? "บันทึกเวลาสำเร็จ" : "Time logged");
      setShowLogDialog(false);
      setLogHours("0"); setLogMinutes("30"); setLogNote("");
      await refreshTaskAndSessions();
    } catch {
      toast.error(language === "th" ? "บันทึกไม่สำเร็จ" : "Failed to log time");
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(language === "th" ? "ลบ session นี้?" : "Delete this session?")) return;
    try {
      await timeTrackingApi.deleteSession(taskId, sessionId);
      toast.success(language === "th" ? "ลบสำเร็จ" : "Deleted");
      await refreshTaskAndSessions();
    } catch {
      toast.error(language === "th" ? "ลบไม่สำเร็จ" : "Failed to delete");
    }
  };

  // Load rework events
  const loadReworkEvents = async () => {
    try { setReworkEvents(await reworkApi.list(taskId)); } catch { /* ignore */ }
  };
  useEffect(() => { if (taskId) loadReworkEvents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [taskId]);

  const handleSubmitRework = async () => {
    if (!reworkToStatusId) {
      toast.error(language === "th" ? "เลือก status ปลายทาง" : "Select target status");
      return;
    }
    if (!reworkReason.trim()) {
      toast.error(language === "th" ? "กรุณาระบุเหตุผล" : "Please enter a reason");
      return;
    }
    setIsSavingRework(true);
    try {
      await reworkApi.create(taskId, { toStatusId: reworkToStatusId, reason: reworkReason.trim() });
      toast.success(language === "th" ? "ส่งกลับแก้ไขสำเร็จ" : "Sent back for rework");
      setShowReworkDialog(false);
      setReworkReason("");
      setReworkToStatusId("");
      const [updated] = await Promise.all([tasksApi.get(taskId), loadReworkEvents()]);
      setTask(updated);
    } catch (err: any) {
      toast.error(err?.data?.message || (language === "th" ? "ไม่สำเร็จ" : "Failed"));
    } finally {
      setIsSavingRework(false);
    }
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Check if user can timer (admin or assignee) - only check after task is loaded
  const taskAssigneeId = task ? ((task as any).assigneeId || (task as any).assignee_id) : null;
  const canTimer = task && user && (user.role === "admin" || taskAssigneeId === user.id);

  // Load assignee's work_days for Plan Progress calc
  useEffect(() => {
    if (!taskAssigneeId) return;
    performanceConfigApi.getByEmployee(taskAssigneeId)
      .then((cfg: any) => {
        const wd = cfg?.work_days && cfg.work_days.length > 0 ? cfg.work_days : [1, 2, 3, 4, 5];
        setAssigneeWorkDays(wd);
      })
      .catch(() => setAssigneeWorkDays([1, 2, 3, 4, 5]));
  }, [taskAssigneeId]);

  // Load space members for @-mention autocomplete
  useEffect(() => {
    const spaceId = (task as any)?.spaceId ?? (task as any)?.space_id;
    if (!spaceId) return;
    spacesApi.get(spaceId)
      .then((detail) => {
        const list: MentionEmployee[] = (detail.members ?? []).map((m: any) => ({
          id:        m.employee?.id ?? m.employeeId,
          name:      m.employee?.name ?? "Unknown",
          avatarUrl: m.employee?.avatarUrl ?? null,
        }));
        setMentionCandidates(list);
      })
      .catch(() => setMentionCandidates([]));
  }, [task]);

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If error or no task, show error state
  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold">
          {language === "th" ? "ไม่พบงาน" : "Task Not Found"}
        </h1>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "th" ? "กลับ" : "Go Back"}
        </Button>
      </div>
    );
  }

  // List name — try API joined field, fall back gracefully
  const taskAny = task as unknown as Record<string, unknown>;
  const listNameDisplay: string | null =
    (taskAny.listName as string | null) ??
    (taskAny.list_name as string | null) ??
    null;
  const status = statusesFromApi.find(
    (s) => s.id === (task.listStatusId ?? (taskAny.list_status_id as string | null)),
  );
  const taskType = taskTypes?.find((tt) => tt.id === task.taskTypeId);
  
  // Handle date fields from API (both camelCase and snake_case)
  const planStartStr = task.planStart || (task as any).plan_start;
  const planStart = planStartStr ? new Date(planStartStr) : null;
  const planFinishStr = task.planFinish || (task as any).plan_finish;
  const durationDays = task.durationDays ?? (task as any).duration_days ?? undefined;
  // Prefer server-provided plan_finish (respects work_days); fall back to naive calc.
  const planFinish = planFinishStr
    ? new Date(planFinishStr)
    : (planStart && durationDays ? calculatePlanFinish(planStart, Number(durationDays)) ?? null : null);
  const planProgress = planStart && planFinish ? calculatePlanProgressWorkDays(planStart, planFinish, assigneeWorkDays) : 0;

  // Handle snake_case from API
  const createdAt = (task as any).createdAt || (task as any).created_at;
  const updatedAt = (task as any).updatedAt || (task as any).updated_at;
  
  // Handle assignee fields from API
  const assigneeId = task.assigneeId || (task as any).assignee_id;
  const assigneeName = task.assigneeName || (task as any).assignee_name;
  const assigneeAvatar = task.assigneeAvatar || (task as any).assignee_avatar;
  // Assignee resolved from API joined fields (assigneeName / assigneeAvatar)
  const assignee = null;
  
  // Handle priority from API
  const priorityValue = task.priority || (task as any).priority || "normal";
  const priorityLabel = priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1);
  const priorityColor = priorityValue === "urgent" ? "#ef4444" 
    : priorityValue === "high" ? "#f97316" 
    : priorityValue === "low" ? "#6b7280" 
    : "#3b82f6";

  const handleAddComment = async () => {
    if (!newComment.trim() || !taskId || isSendingComment) return;
    setIsSendingComment(true);
    try {
      const newCommentData = await commentsApi.create(taskId, { commentText: newComment.trim() });
      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error(language === "th" ? "ส่ง comment ไม่สำเร็จ" : "Failed to send comment");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
    const raw = comment as unknown as Record<string, unknown>;
    const commentText = String(raw.commentText ?? raw.comment_text ?? "");
    if (commentText) {
      setEditingCommentId(commentId);
      setEditingCommentContent(commentText);
    }
  };

  const handleSaveEditComment = async () => {
    if (!editingCommentId || !editingCommentContent.trim() || !taskId) return;
    try {
      const updatedComment = await commentsApi.update(taskId, editingCommentId, { commentText: editingCommentContent.trim() });
      setComments((prev) => prev.map((c) => c.id === editingCommentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      console.error("Failed to update comment:", err);
      toast.error(language === "th" ? "แก้ไขไม่สำเร็จ" : "Failed to update");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!taskId) return;
    const ok = window.confirm(language === "th" ? "ลบ comment นี้?" : "Delete this comment?");
    if (!ok) return;
    try {
      await commentsApi.delete(taskId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      toast.error(language === "th" ? "ลบไม่สำเร็จ" : "Failed to delete");
    }
  };

  // Relative time formatter: "เมื่อสักครู่", "5 นาทีที่แล้ว", etc.
  const formatRelative = (iso: string): string => {
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 45)        return language === "th" ? "เมื่อสักครู่"         : "just now";
    if (diffSec < 3600)      return language === "th" ? `${Math.floor(diffSec / 60)} นาทีที่แล้ว` : `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400)     return language === "th" ? `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว` : `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 7) return language === "th" ? `${Math.floor(diffSec / 86400)} วันที่แล้ว` : `${Math.floor(diffSec / 86400)}d ago`;
    return format(new Date(iso), "d MMM yyyy", { locale });
  };

  const handleSaveProgress = () => {
    if (!task) return;
    tasksApi.update(task.id, { estimateProgress })
      .then((updated) => {
        setTask(updated);
        setShowEditProgressDialog(false);
      })
      .catch((err) => {
        console.error("Failed to update progress:", err);
      });
  };

  const canMove = user?.role === "admin" || user?.role === "manager";

  const handleMoveTask = async () => {
    if (!task || !moveTargetListId) return;
    setIsMoving(true);
    try {
      await tasksApi.move(task.id, moveTargetListId);
      const updated = await tasksApi.get(task.id);
      setTask(updated);
      const listId = updated.listId || (updated as any).list_id;
      if (listId) {
        const statuses = await listsApi.getStatuses(listId);
        setStatusesFromApi(statuses);
      }
      toast.success(language === "th" ? "ย้าย task สำเร็จ" : "Task moved");
      setShowMoveDialog(false);
      setMoveTargetListId("");
    } catch (err: any) {
      toast.error(err?.message ?? (language === "th" ? "ย้ายไม่สำเร็จ" : "Failed to move"));
    } finally {
      setIsMoving(false);
    }
  };

  const handleStatusChange = (statusId: string) => {
    if (!statusId || !task) return;
    tasksApi.updateStatus(task.id, { listStatusId: statusId })
      .then(() => {
        // Refresh task to get latest data
        return tasksApi.get(task.id);
      })
      .then((updated) => {
        setTask(updated);
        // Also refresh statuses in case they changed
        const listId = updated.listId || (updated as any).list_id;
        if (listId) {
          return listsApi.getStatuses(listId);
        }
        return null;
      })
      .then((statuses) => {
        if (statuses) {
          setStatusesFromApi(statuses);
        }
      })
      .catch((err) => {
        console.error("Failed to update status:", err);
      });
  };

  // comments already in state; sorted display handled in JSX

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header — hero */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-rose-50/80 via-orange-50/60 to-amber-50/40 p-5 shadow-sm dark:from-rose-950/20 dark:via-orange-950/15 dark:to-amber-950/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-rose-300/40 to-pink-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-gradient-to-tr from-amber-200/40 to-orange-200/30 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/70 backdrop-blur hover:bg-white dark:bg-card/60 dark:hover:bg-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-rose-300/60 bg-white/70 font-mono text-[11px] text-rose-700 backdrop-blur dark:border-rose-500/30 dark:bg-card/60 dark:text-rose-300">
                {task.displayId || (task as any).display_id}
              </Badge>
              {listNameDisplay && (
                <Badge variant="outline" className="border-border/60 bg-white/70 text-[11px] backdrop-blur dark:bg-card/60">
                  {listNameDisplay}
                </Badge>
              )}
              {(status?.name || task.statusName) && (
                <Badge
                  className="border-0 text-[11px] font-medium shadow-sm"
                  style={{
                    backgroundColor: `${status?.color || "#6b7280"}20`,
                    color: status?.color || "#6b7280",
                  }}
                >
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: status?.color || "#6b7280" }}
                  />
                  {status?.name || task.statusName}
                </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={savingTemplate}
            onClick={async () => {
              const name = prompt(
                language === "th" ? "ตั้งชื่อ Template:" : "Template name:",
                task.title
              );
              if (!name?.trim()) return;
              setSavingTemplate(true);
              try {
                await taskTemplatesApi.create({
                  name: name.trim(),
                  title: task.title,
                  description: task.description || null,
                  taskTypeId: task.taskTypeId || null,
                  priority: (task.priority || "normal") as any,
                  timeEstimateHours: task.timeEstimateHours || null,
                  tags: task.tags || [],
                });
                toast.success(language === "th" ? "บันทึก Template แล้ว" : "Template saved");
              } catch (err: any) {
                toast.error(err?.message ?? "Failed to save template");
              } finally {
                setSavingTemplate(false);
              }
            }}
            className="bg-white/70 backdrop-blur hover:bg-white dark:bg-card/60 dark:hover:bg-card"
          >
            💾 {language === "th" ? "บันทึกเป็น Template" : "Save as Template"}
          </Button>
        </div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {task.title}
            </h1>
          </div>
          {canMove && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadWorkspace();
                setMoveTargetListId("");
                setShowMoveDialog(true);
              }}
              className="bg-white/70 backdrop-blur hover:bg-white dark:bg-card/60 dark:hover:bg-card"
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
              {language === "th" ? "ย้าย List" : "Move"}
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="relative overflow-hidden border-border/60 transition hover:shadow-md hover:shadow-rose-500/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                {language === "th" ? "รายละเอียด" : "Description"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {language === "th" ? "ไม่มีรายละเอียด" : "No description"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Progress Section */}
          <Card className="relative overflow-hidden border-border/60 transition hover:shadow-md hover:shadow-emerald-500/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  {language === "th" ? "ความคืบหน้า" : "Progress"}
                </CardTitle>
                <CardDescription>
                  {language === "th" ? "ติดตามความคืบหน้าของงาน" : "Track task progress"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setEstimateProgress(0);
                setShowEditProgressDialog(true);
              }}>
                <Pencil className="h-4 w-4 mr-1" />
                {language === "th" ? "แก้ไข" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    {language === "th" ? "Plan Progress" : "Plan Progress"}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={Math.min(planProgress, 100)} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{Math.round(planProgress)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "คำนวณจาก Plan Start และ Duration" : "Calculated from Plan Start and Duration"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    {language === "th" ? "Estimate Progress" : "Estimate Progress"}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={estimateProgress} className="flex-1 [&>div]:bg-green-500" />
                    <span className="text-sm font-medium w-12 text-right">{estimateProgress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "ประเมินโดยผู้รับผิดชอบ" : "Estimated by assignee"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtasks — full CRUD */}
          <Card className="relative overflow-hidden border-border/60 transition hover:shadow-md hover:shadow-orange-500/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
                  <CheckSquare className="h-3.5 w-3.5" />
                </div>
                {language === "th" ? "งานย่อย" : "Subtasks"}
                <Badge variant="secondary" className="ml-auto">
                  {subtasks.filter((s) => s.isDone).length}/{subtasks.length}
                </Badge>
              </CardTitle>
              {subtasks.length > 0 && (
                <Progress
                  value={(subtasks.filter((s) => s.isDone).length / subtasks.length) * 100}
                  className="h-1.5 mt-2"
                />
              )}
            </CardHeader>
            <CardContent className="space-y-1.5">
              {subtasks.length === 0 && (
                <p className="text-xs text-muted-foreground italic pb-1">
                  {language === "th" ? "ยังไม่มีงานย่อย" : "No subtasks yet"}
                </p>
              )}
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <Checkbox
                    checked={s.isDone}
                    onCheckedChange={() => handleToggleSubtask(s.id)}
                  />
                  {editingSubtaskId === s.id ? (
                    <Input
                      autoFocus
                      value={editingSubtaskTitle}
                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                      onBlur={saveEditSubtask}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditSubtask();
                        if (e.key === "Escape") { setEditingSubtaskId(null); setEditingSubtaskTitle(""); }
                      }}
                      className="h-7 text-sm flex-1"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => beginEditSubtask(s)}
                      className={cn(
                        "text-sm flex-1 cursor-text select-none",
                        s.isDone && "line-through text-muted-foreground",
                      )}
                      title={language === "th" ? "ดับเบิลคลิกเพื่อแก้ไข" : "Double-click to edit"}
                    >
                      {s.title}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => beginEditSubtask(s)}
                    title={language === "th" ? "แก้ไข" : "Edit"}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSubtask(s.id)}
                    title={language === "th" ? "ลบ" : "Delete"}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddSubtask(); }}
                  placeholder={language === "th" ? "เพิ่มงานย่อย..." : "Add subtask..."}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                >
                  {language === "th" ? "เพิ่ม" : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="relative overflow-hidden border-border/60 transition hover:shadow-md hover:shadow-fuchsia-500/5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-400 to-purple-500" />
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                {language === "th" ? "Comments" : "Comments"}
                <Badge variant="secondary" className="ml-auto">{comments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <MentionTextarea
                    placeholder={language === "th" ? "เขียน comment... (พิมพ์ @ เพื่อ mention · Ctrl+Enter เพื่อส่ง)" : "Write a comment... (type @ to mention · Ctrl+Enter to send)"}
                    value={newComment}
                    onChange={setNewComment}
                    employees={mentionCandidates}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {newComment.trim().length > 0 && `${newComment.trim().length} ${language === "th" ? "ตัวอักษร" : "chars"}`}
                    </span>
                    <Button onClick={handleAddComment} disabled={!newComment.trim() || isSendingComment} size="sm">
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {isSendingComment
                        ? (language === "th" ? "กำลังส่ง..." : "Sending...")
                        : (language === "th" ? "ส่ง" : "Send")}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Comments List */}
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "th" ? "กำลังโหลด..." : "Loading..."}
                </p>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    {language === "th" ? "ยังไม่มี comment — เริ่มสนทนาได้เลย" : "No comments yet — start the conversation"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    // Handle both camelCase and snake_case from API
                    const rawComment = comment as unknown as Record<string, unknown>;
                    const commentAuthorName = String(rawComment.authorName || rawComment.author_name || "User");
                    const commentAuthorAvatar = rawComment.authorAvatar || rawComment.author_avatar || null;
                    const commentAuthorId = String(rawComment.authorId || rawComment.author_id || "");
                    const commentText = String(rawComment.commentText || rawComment.comment_text || "");
                    const isEditing = editingCommentId === comment.id;
                    const isOwner = commentAuthorId === currentUserId;

                    const displayName = isOwner && currentUser ? currentUser.name : commentAuthorName;
                    const displayAvatar = commentAuthorAvatar as string | undefined;

                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        {displayAvatar ? (
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-background"
                          />
                        ) : (
                          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                            <AvatarFallback>{displayName?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium">{displayName}</span>
                            {isOwner && (
                              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                {language === "th" ? "คุณ" : "You"}
                              </Badge>
                            )}
                            <span
                              className="text-xs text-muted-foreground"
                              title={format(new Date(comment.createdAt), "d MMM yyyy HH:mm:ss", { locale })}
                            >
                              {formatRelative(comment.createdAt)}
                            </span>
                            {comment.updatedAt && (
                              <span className="text-xs text-muted-foreground italic">
                                · {language === "th" ? "แก้ไขแล้ว" : "edited"}
                              </span>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                autoFocus
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveEditComment();
                                  } else if (e.key === "Escape") {
                                    setEditingCommentId(null);
                                    setEditingCommentContent("");
                                  }
                                }}
                                rows={2}
                                className="resize-none"
                              />
                              <div className="flex gap-2 text-[11px] text-muted-foreground items-center">
                                <Button size="sm" onClick={handleSaveEditComment} disabled={!editingCommentContent.trim()}>
                                  {language === "th" ? "บันทึก" : "Save"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }}>
                                  {language === "th" ? "ยกเลิก" : "Cancel"}
                                </Button>
                                <span className="ml-1">Ctrl+Enter {language === "th" ? "เพื่อบันทึก · Esc ยกเลิก" : "to save · Esc to cancel"}</span>
                              </div>
                            </div>
                          ) : (
                            <div className={cn(
                              "flex items-start justify-between gap-2 rounded-lg px-3 py-2",
                              isOwner ? "bg-primary/5 border border-primary/10" : "bg-muted/50",
                            )}>
                              <p className="text-sm whitespace-pre-wrap break-words flex-1">{commentText}</p>
                              {isOwner && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditComment(comment.id)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      {language === "th" ? "แก้ไข" : "Edit"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {language === "th" ? "ลบ" : "Delete"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details Card */}
          <Card className="relative overflow-hidden border-border/60 lg:sticky lg:top-4">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-pink-500 to-rose-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language === "th" ? "รายละเอียด" : "Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status — top, most frequently changed */}
              <div className="space-y-2 rounded-lg border border-primary/20 bg-gradient-to-br from-rose-50/60 to-pink-50/40 p-3 dark:border-primary/30 dark:from-rose-950/20 dark:to-pink-950/10">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: status?.color || "#6b7280" }}
                  />
                  {language === "th" ? "สถานะ" : "Status"}
                </Label>
                {statusesFromApi.length > 0 ? (
                  <Select
                    value={task.listStatusId || (task as any).list_status_id || ""}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-9 bg-white font-medium dark:bg-card">
                      <SelectValue placeholder={task.statusName || task.status || "Select status"} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusesFromApi.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {status?.name || task.statusName || task.status}
                  </div>
                )}
              </div>

              {/* Assignee - API has single assignee */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {language === "th" ? "ผู้รับผิดชอบ" : "Assignee"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {assigneeName ? (
                    <div className="flex items-center gap-2 rounded-full border border-rose-200/60 bg-gradient-to-r from-rose-50 to-pink-50 px-2 py-1 dark:border-rose-500/20 dark:from-rose-950/30 dark:to-pink-950/20">
                      <Avatar className="h-5 w-5 ring-2 ring-white dark:ring-card">
                        <AvatarImage src={assigneeAvatar ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-[10px] font-semibold text-white">
                          {assigneeName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{assigneeName}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  {language === "th" ? "ความสำคัญ" : "Priority"}
                </Label>
                <Badge style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}>
                  {priorityValue === "urgent" ? "🔴" : priorityValue === "high" ? "⬆️" : priorityValue === "low" ? "⬇️" : "➖"} {priorityLabel}
                </Badge>
              </div>

              {/* Task Type */}
              {taskType && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {language === "th" ? "ประเภท" : "Type"}
                  </Label>
                  <Badge style={{ backgroundColor: `${taskType.color}20`, color: taskType.color }}>
                    {taskType.name}
                  </Badge>
                </div>
              )}

              {/* Story Points */}
              {task.storyPoints && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Story Points</Label>
                  <Badge variant="outline">{task.storyPoints}</Badge>
                </div>
              )}

              {/* Time Estimate */}
              {task.timeEstimateHours && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {language === "th" ? "เวลาประมาณการ" : "Time Estimate"}
                  </Label>
                  <span className="text-sm">{task.timeEstimateHours} {language === "th" ? "ชั่วโมง" : "hours"}</span>
                </div>
              )}

              {/* Actual Hours */}
              {task.actualHours > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {language === "th" ? "เวลาที่ใช้จริง" : "Actual Hours"}
                  </Label>
                  <span className="text-sm">{task.actualHours} {language === "th" ? "ชั่วโมง" : "hours"}</span>
                </div>
              )}

              {/* Time Tracking */}
              {(() => {
                const accumMin = (task.accumulatedMinutes ?? (task as any).accumulated_minutes ?? 0) as number;
                const estimateHours = task.timeEstimateHours ?? (task as any).time_estimate_hours ?? null;
                const estimateMin = estimateHours ? Math.round(Number(estimateHours) * 60) : 0;
                const totalDisplayMin = accumMin + (runningTimer ? Math.floor(elapsedSeconds / 60) : 0);
                const pct = estimateMin > 0 ? Math.min(100, Math.round((totalDisplayMin / estimateMin) * 100)) : 0;
                const overrun = estimateMin > 0 && totalDisplayMin > estimateMin;
                const fmtMin = (min: number) => {
                  const h = Math.floor(min / 60);
                  const m = min % 60;
                  return h > 0 ? `${h}h ${m}m` : `${m}m`;
                };
                return (
                  <div className="space-y-3 rounded-lg border bg-gradient-to-br from-background to-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {language === "th" ? "จับเวลา" : "Time Tracking"}
                      </Label>
                      {canTimer && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowLogDialog(true)}>
                          <Plus className="h-3 w-3 mr-1" />
                          {language === "th" ? "บันทึกเอง" : "Log"}
                        </Button>
                      )}
                    </div>

                    {runningTimer ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                          </span>
                          <span className="font-mono text-lg font-semibold tabular-nums">
                            {formatElapsed(elapsedSeconds)}
                          </span>
                        </div>
                        {canTimer && (
                          <Button variant="outline" size="sm" onClick={toggleTimer} className="text-destructive">
                            <Square className="h-3 w-3 mr-1" />
                            {language === "th" ? "หยุด" : "Stop"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {accumMin > 0 ? fmtMin(accumMin) : (language === "th" ? "ยังไม่มีเวลา" : "No time yet")}
                        </span>
                        {canTimer && (
                          <Button variant="outline" size="sm" onClick={toggleTimer}>
                            <Play className="h-3 w-3 mr-1" />
                            {language === "th" ? "เริ่ม" : "Start"}
                          </Button>
                        )}
                      </div>
                    )}

                    {estimateMin > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{fmtMin(totalDisplayMin)} / {fmtMin(estimateMin)}</span>
                          <span className={cn(overrun && "text-destructive font-medium")}>
                            {overrun ? `+${fmtMin(totalDisplayMin - estimateMin)}` : `${pct}%`}
                          </span>
                        </div>
                        <Progress value={pct} className={cn("h-1.5", overrun && "[&>div]:bg-destructive")} />
                      </div>
                    )}

                    {sessions.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowHistory((v) => !v)}
                          className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                        >
                          <span className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            {language === "th" ? "ประวัติ" : "History"} ({sessions.length})
                          </span>
                          <span>{showHistory ? "−" : "+"}</span>
                        </button>
                        {showHistory && (
                          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                            {sessions.map((s) => (
                              <li key={s.id} className="group flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px]">
                                    {s.employeeName?.slice(0, 1) ?? "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium truncate">{s.employeeName}</span>
                                    {s.endedAt ? (
                                      <Badge variant="secondary" className="h-4 text-[9px] px-1">
                                        {fmtMin(s.durationMin ?? 0)}
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="h-4 text-[9px] px-1 animate-pulse">
                                        {language === "th" ? "กำลังจับเวลา" : "running"}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {format(new Date(s.startedAt), "d MMM HH:mm", { locale })}
                                    {s.note ? ` · ${s.note}` : ""}
                                  </div>
                                </div>
                                {(user?.role === "admin" || s.employeeId === user?.id) && s.endedAt && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                    onClick={() => handleDeleteSession(s.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Rework */}
              {(() => {
                const canRework = user && (user.role === "admin" || user.role === "manager");
                const count = (task.reworkCount ?? (task as any).rework_count ?? 0) as number;
                if (!canRework && count === 0) return null;
                return (
                  <div className="space-y-2 rounded-lg border bg-gradient-to-br from-background to-amber-50/30 dark:to-amber-950/10 p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        {language === "th" ? "ส่งกลับแก้ไข" : "Rework"}
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1.5 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                            × {count}
                          </Badge>
                        )}
                      </Label>
                      {canRework && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowReworkDialog(true)}>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          {language === "th" ? "ขอแก้ไข" : "Send back"}
                        </Button>
                      )}
                    </div>

                    {reworkEvents.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowReworkHistory((v) => !v)}
                          className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                        >
                          <span className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            {language === "th" ? "ประวัติ" : "History"} ({reworkEvents.length})
                          </span>
                          <span>{showReworkHistory ? "−" : "+"}</span>
                        </button>
                        {showReworkHistory && (
                          <ul className="space-y-2 max-h-56 overflow-y-auto">
                            {reworkEvents.map((ev) => (
                              <li key={ev.id} className="rounded border-l-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-1.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px]">
                                      {ev.requestedByName?.slice(0, 1) ?? "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium truncate">{ev.requestedByName ?? "—"}</span>
                                  <span className="text-muted-foreground">·</span>
                                  <span className="text-muted-foreground text-[10px]">
                                    {format(new Date(ev.createdAt), "d MMM HH:mm", { locale })}
                                  </span>
                                </div>
                                {(ev.fromStatusName || ev.toStatusName) && (
                                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                                    {ev.fromStatusName ?? "—"} → <span className="font-medium text-foreground">{ev.toStatusName ?? "—"}</span>
                                  </div>
                                )}
                                <div className="mt-1 flex items-start gap-1">
                                  <AlertCircle className="h-3 w-3 mt-0.5 text-amber-600 shrink-0" />
                                  <span className="flex-1">{ev.reason}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {language === "th" ? "Tags" : "Tags"}
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked Note */}
              {task.blockedNote && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === "th" ? "เหตุผลที่บล็อก" : "Blocked Note"}
                  </Label>
                  <p className="text-sm text-destructive">{task.blockedNote}</p>
                </div>
              )}

              {/* Predecessors - API doesn't provide this field */}
              {false && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {language === "th" ? "งานที่ต้องรอ (Predecessor)" : "Predecessors"}
                  </Label>
                </div>
              )}

              <Separator />

              {/* Dates */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === "th" ? "วันที่" : "Dates"}
                </Label>
                <div className="space-y-1 text-sm">
                  {planStart && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Start:</span>
                      <span>{format(planStart, "d MMM yyyy", { locale })}</span>
                    </div>
                  )}
                  {planFinish && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Finish:</span>
                      <span>{format(planFinish, "d MMM yyyy", { locale })}</span>
                    </div>
                  )}
                  {(task.durationDays ?? (task as any).duration_days) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{task.durationDays ?? (task as any).duration_days} {language === "th" ? "วัน" : "days"}</span>
                    </div>
                  )}
                  {task.deadline && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{format(new Date(task.deadline), "d MMM yyyy", { locale })}</span>
                    </div>
                  )}
                  {task.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span>{format(new Date(task.startedAt), "d MMM yyyy HH:mm", { locale })}</span>
                    </div>
                  )}
                  {task.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{format(new Date(task.completedAt), "d MMM yyyy HH:mm", { locale })}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Creator */}
              {task.creatorName && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === "th" ? "ผู้สร้าง" : "Creator"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">{task.creatorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.creatorName}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Meta */}
              <div className="space-y-1 text-xs text-muted-foreground">
                {createdAt && (
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{format(new Date(createdAt), "d MMM yyyy HH:mm", { locale })}</span>
                  </div>
                )}
                {updatedAt && (
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{format(new Date(updatedAt), "d MMM yyyy HH:mm", { locale })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="relative overflow-hidden border-border/60">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                  <Paperclip className="h-3 w-3" />
                </div>
                {language === "th" ? "ไฟล์แนบ" : "Attachments"}
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{attachments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* File list */}
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline truncate"
                    >
                      <File className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.fileName || "file"}</span>
                    </a>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {a.fileSizeBytes && <span>{formatFileSize(a.fileSizeBytes)}</span>}
                      {a.uploaderName && <span>· {a.uploaderName}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      if (!confirm(language === "th" ? "ลบไฟล์นี้?" : "Delete this file?")) return;
                      try {
                        await attachmentsApi.delete(taskId!, a.id);
                        setAttachments((prev) => prev.filter((x) => x.id !== a.id));
                        toast.success(language === "th" ? "ลบไฟล์แล้ว" : "Deleted");
                      } catch (err: any) {
                        toast.error(err?.message ?? "ลบไม่สำเร็จ");
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Empty state */}
              {attachments.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {language === "th" ? "ยังไม่มีไฟล์แนบ — ลากไฟล์มาวางหรือกดปุ่มด้านล่าง" : "No files attached — drag & drop or use the button below"}
                </p>
              )}

              {/* Upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 h-8"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading
                  ? (language === "th" ? "กำลังอัปโหลด..." : "Uploading...")
                  : (language === "th" ? "อัปโหลดไฟล์" : "Upload File")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Progress Dialog */}
      <Dialog open={showEditProgressDialog} onOpenChange={setShowEditProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "แก้ไข Estimate Progress" : "Edit Estimate Progress"}
            </DialogTitle>
            <DialogDescription>
              {language === "th" 
                ? "ระบุเปอร์เซ็นต์ความคืบหน้าที่ประเมินไว้" 
                : "Set the estimated progress percentage"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Progress</Label>
                <span className="text-2xl font-bold">{estimateProgress}%</span>
              </div>
              <Slider
                value={[estimateProgress]}
                onValueChange={([value]) => setEstimateProgress(value)}
                max={100}
                step={5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[0, 25, 50, 75, 100].map((value) => (
                <Button
                  key={value}
                  variant={estimateProgress === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEstimateProgress(value)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProgressDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveProgress}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rework dialog */}
      {/* Move Task Dialog — admin/manager only */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              {language === "th" ? "ย้าย Task ไปยัง List อื่น" : "Move Task to Another List"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "สถานะจะถูกตั้งเป็นค่าเริ่มต้นของ list ปลายทาง"
                : "Status will be reset to the target list's default."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {spaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === "th" ? "ไม่มี space" : "No spaces available"}
              </p>
            ) : (
              spaces.map((space) => {
                const spaceLists = lists.filter(
                  (l) => l.spaceId === space.id && l.id !== (task?.listId || (task as any)?.list_id)
                );
                const spaceFolders = folders.filter((f) => f.spaceId === space.id && !f.isArchived);
                if (spaceLists.length === 0) return null;
                return (
                  <div key={space.id} className="space-y-1">
                    <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: space.color }}
                      />
                      {space.name}
                    </div>
                    {/* Lists inside folders */}
                    {spaceFolders.map((folder) => {
                      const listsInFolder = spaceLists.filter((l) => l.folderId === folder.id);
                      if (listsInFolder.length === 0) return null;
                      return (
                        <div key={folder.id} className="ml-3 space-y-0.5">
                          <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs text-muted-foreground">
                            <FolderKanban className="h-3 w-3" style={{ color: folder.color || space.color }} />
                            {folder.name}
                          </div>
                          {listsInFolder.map((list) => (
                            <button
                              key={list.id}
                              type="button"
                              onClick={() => setMoveTargetListId(list.id)}
                              className={cn(
                                "ml-4 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition",
                                moveTargetListId === list.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border/60 hover:bg-muted"
                              )}
                            >
                              <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate">{list.name}</span>
                              {list.taskCount > 0 && (
                                <span className="text-xs text-muted-foreground">{list.taskCount}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {/* Lists without folder */}
                    {spaceLists.filter((l) => !l.folderId).map((list) => (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => setMoveTargetListId(list.id)}
                        className={cn(
                          "ml-3 flex w-[calc(100%-0.75rem)] items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition",
                          moveTargetListId === list.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border/60 hover:bg-muted"
                        )}
                      >
                        <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{list.name}</span>
                        {list.taskCount > 0 && (
                          <span className="text-xs text-muted-foreground">{list.taskCount}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)} disabled={isMoving}>
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              onClick={handleMoveTask}
              disabled={!moveTargetListId || isMoving}
              className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white hover:from-orange-600 hover:via-pink-600 hover:to-rose-600"
            >
              {isMoving
                ? (language === "th" ? "กำลังย้าย..." : "Moving...")
                : (language === "th" ? "ย้าย" : "Move")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReworkDialog} onOpenChange={setShowReworkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-600" />
              {language === "th" ? "ส่งกลับแก้ไข" : "Send Back for Rework"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "เลือก status ปลายทางและระบุเหตุผลที่ต้องแก้ไข"
                : "Select a target status and provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{language === "th" ? "ส่งกลับไปที่" : "Send back to"}</Label>
              <Select value={reworkToStatusId} onValueChange={setReworkToStatusId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "th" ? "เลือก status" : "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  {statusesFromApi
                    .filter((s) => s.id !== (task.listStatusId ?? (task as any).list_status_id))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? "#888" }} />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{language === "th" ? "เหตุผล" : "Reason"} *</Label>
              <Textarea
                placeholder={language === "th" ? "ระบุสิ่งที่ต้องแก้ไข..." : "Describe what needs to be fixed..."}
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReworkDialog(false)} disabled={isSavingRework}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmitRework} disabled={isSavingRework} className="bg-amber-600 hover:bg-amber-700">
              {isSavingRework
                ? (language === "th" ? "กำลังส่ง..." : "Sending...")
                : (language === "th" ? "ส่งกลับแก้ไข" : "Send Back")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual time log dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "th" ? "บันทึกเวลาด้วยตนเอง" : "Log Time Manually"}
            </DialogTitle>
            <DialogDescription>
              {language === "th"
                ? "กรอกเวลาที่ทำงานไปและหมายเหตุ (ถ้ามี)"
                : "Enter the time you worked and an optional note."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{language === "th" ? "ชั่วโมง" : "Hours"}</Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === "th" ? "นาที" : "Minutes"}</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{language === "th" ? "หมายเหตุ" : "Note"}</Label>
              <Textarea
                placeholder={language === "th" ? "ทำอะไรไปบ้าง..." : "What did you work on..."}
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)} disabled={isSavingLog}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleLogTime} disabled={isSavingLog}>
              {isSavingLog ? (language === "th" ? "กำลังบันทึก..." : "Saving...") : (language === "th" ? "บันทึก" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
