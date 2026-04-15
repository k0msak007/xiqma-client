"use client";

import { useState, useMemo, useEffect } from "react";
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
  MoreHorizontal,
  Flag,
  Layers,
  TrendingUp,
  Target,
  Link2,
  X,
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
import { getUserById, getListById, statuses } from "@/lib/mock-data";
import {
  calculatePlanFinish,
  calculatePlanProgress,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { tasksApi, type ApiTaskDetail } from "@/lib/api/tasks";
import { commentsApi, type Comment as ApiComment } from "@/lib/api/comments";
import { listsApi, type ListStatus } from "@/lib/api/lists";
import { useAuthStore } from "@/lib/auth-store";

export default function TaskViewPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;

  const [task, setTask] = useState<ApiTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Statuses from API
  const [statusesFromApi, setStatusesFromApi] = useState<ListStatus[]>([]);

  // Comments
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Local state
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [estimateProgress, setEstimateProgress] = useState(0);
  const [showEditProgressDialog, setShowEditProgressDialog] = useState(false);

  // Get current user from auth store
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id || "";
  const currentUser = user ? { name: user.name, avatar: user.avatar || undefined } : null;

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

  const { taskTypes, updateTask } = useTaskStore();

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

  const list = getListById(task.listId);
  const status = statuses.find((s) => s.id === task.listStatusId);
  const taskType = taskTypes.find((tt) => tt.id === task.taskTypeId);
  
  // Handle date fields from API (both camelCase and snake_case)
  const planStartStr = task.planStart || (task as any).plan_start;
  const planStart = planStartStr ? new Date(planStartStr) : null;
  const planFinishStr = task.planFinish || (task as any).plan_finish;
  const planFinish = planFinishStr ? new Date(planFinishStr) : null;
  const planProgress = planStart && planFinish ? calculatePlanProgress(planStart, planFinish) : 0;

  // Handle snake_case from API
  const createdAt = (task as any).createdAt || (task as any).created_at;
  const updatedAt = (task as any).updatedAt || (task as any).updated_at;
  
  // Handle assignee fields from API
  const assigneeId = task.assigneeId || (task as any).assignee_id;
  const assigneeName = task.assigneeName || (task as any).assignee_name;
  const assigneeAvatar = task.assigneeAvatar || (task as any).assignee_avatar;
  const assignee = assigneeId ? getUserById(assigneeId) : null;
  
  // Handle priority from API
  const priorityValue = task.priority || (task as any).priority || "normal";
  const priorityLabel = priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1);
  const priorityColor = priorityValue === "urgent" ? "#ef4444" 
    : priorityValue === "high" ? "#f97316" 
    : priorityValue === "low" ? "#6b7280" 
    : "#3b82f6";

  const handleAddComment = () => {
    if (!newComment.trim() || !taskId) return;
    commentsApi.create(taskId, { commentText: newComment.trim() })
      .then((newCommentData) => {
        setComments([...comments, newCommentData]);
        setNewComment("");
      })
      .catch((err) => {
        console.error("Failed to add comment:", err);
      });
  };

  const handleEditComment = (commentId: string) => {
    const commentText = String(rawComment.commentText || rawComment.comment_text || "");
                    if (commentText) {
                      setEditingCommentId(commentId);
                      setEditingCommentContent(commentText);
                    }
  };

  const handleSaveEditComment = () => {
    if (!editingCommentId || !editingCommentContent.trim() || !taskId) return;
    commentsApi.update(taskId, editingCommentId, { commentText: editingCommentContent.trim() })
      .then((updatedComment) => {
        setComments(comments.map((c) => c.id === editingCommentId ? updatedComment : c));
        setEditingCommentId(null);
        setEditingCommentContent("");
      })
      .catch((err) => {
        console.error("Failed to update comment:", err);
      });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!taskId) return;
    commentsApi.delete(taskId, commentId)
      .then(() => {
        setComments(comments.filter((c) => c.id !== commentId));
      })
      .catch((err) => {
        console.error("Failed to delete comment:", err);
      });
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

  const sortedComments: Comment[] = [];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-mono">{task.displayId}</span>
            {list && (
              <>
                <span>•</span>
                <span>{list.name}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
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

{/* Subtasks - API doesn't provide subtask details, show count only */}
          {task.subtaskCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {language === "th" ? "Subtasks" : "Subtasks"}
                  <Badge variant="secondary">
                    {task.subtaskCount}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === "th" 
                    ? `มี ${task.subtaskCount} งานย่อย` 
                    : `${task.subtaskCount} subtasks`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {language === "th" ? "Comments" : "Comments"}
                <Badge variant="secondary">{comments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder={language === "th" ? "เขียน comment..." : "Write a comment..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      {language === "th" ? "ส่ง" : "Send"}
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "th" ? "ยังไม่มี comment" : "No comments yet"}
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    // Handle both camelCase and snake_case from API
                    const rawComment = comment as Record<string, unknown>;
                    const commentAuthorName = String(rawComment.authorName || rawComment.author_name || "User");
                    const commentAuthorAvatar = rawComment.authorAvatar || rawComment.author_avatar || null;
                    const commentAuthorId = String(rawComment.authorId || rawComment.author_id || "");
                    const commentText = String(rawComment.commentText || rawComment.comment_text || "");
                    const isEditing = editingCommentId === comment.id;
                    const isOwner = commentAuthorId === currentUserId;

                    console.log("Comment debug:", {
                      comment,
                      commentAuthorId,
                      currentUserId,
                      isOwner,
                      commentAuthorAvatar,
                      commentAuthorName
                    });

                    // For other users, use their avatar; for owner, use current user's avatar if available
                    const displayName = isOwner && currentUser ? currentUser.name : commentAuthorName;
                    const displayAvatar = commentAuthorAvatar as string | undefined;

                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        {displayAvatar ? (
                          <img 
                            src={displayAvatar} 
                            alt={displayName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{displayName?.charAt(0) || "?"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), "d MMM yyyy HH:mm", { locale })}
                            </span>
                            {comment.updatedAt && (
                              <span className="text-xs text-muted-foreground">
                                ({language === "th" ? "แก้ไขแล้ว" : "edited"})
                              </span>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEditComment}>
                                  {language === "th" ? "บันทึก" : "Save"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }}>
                                  {language === "th" ? "ยกเลิก" : "Cancel"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <p className="text-sm whitespace-pre-wrap">{commentText}</p>
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === "th" ? "รายละเอียด" : "Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee - API has single assignee */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {language === "th" ? "ผู้รับผิดชอบ" : "Assignee"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {assignee ? (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assignee.avatar} />
                        <AvatarFallback className="text-[10px]">{assignee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{assignee.name}</span>
                    </div>
                  ) : assigneeName ? (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assigneeAvatar || undefined} />
                        <AvatarFallback className="text-[10px]">{assigneeName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{assigneeName}</span>
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
                  {task.planStart && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Start:</span>
                      <span>{format(new Date(task.planStart), "d MMM yyyy", { locale })}</span>
                    </div>
                  )}
                  {planFinish && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Finish:</span>
                      <span>{format(planFinish, "d MMM yyyy", { locale })}</span>
                    </div>
                  )}
                  {task.durationDays && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{task.durationDays} {language === "th" ? "วัน" : "days"}</span>
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

              {/* Status - use API statuses for dropdown */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {language === "th" ? "สถานะ" : "Status"}
                </Label>
                {statusesFromApi.length > 0 ? (
                  <Select 
                    value={task.listStatusId || (task as any).list_status_id || ""} 
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={task.statusName || task.status || "Select status"} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusesFromApi.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    {status && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                    )}
                    <span className="text-sm">{status?.name || task.statusName || task.status}</span>
                  </div>
                )}
              </div>

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

          {/* Attachments - API provides count only */}
          {task.attachmentCount > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {language === "th" ? "ไฟล์แนบ" : "Attachments"}
                  <Badge variant="secondary" className="ml-auto">{task.attachmentCount}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {language === "th" 
                    ? `มี ${task.attachmentCount} ไฟล์แนบ` 
                    : `${task.attachmentCount} attachments`}
                </p>
              </CardContent>
            </Card>
          )}
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
    </div>
  );
}
