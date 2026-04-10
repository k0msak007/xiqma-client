"use client";

import { useState, useMemo } from "react";
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
import { getUserById, getListById } from "@/lib/mock-data";
import {
  priorityConfig,
  calculatePlanFinish,
  calculatePlanProgress,
  type Comment,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export default function TaskViewPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const { t, language } = useTranslation();
  const locale = language === "th" ? th : enUS;

  const { 
    tasks, 
    users, 
    statuses, 
    taskTypes, 
    updateTask, 
    addComment, 
    updateComment, 
    deleteComment 
  } = useTaskStore();

  const task = tasks.find((t) => t.id === taskId);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [showEditProgressDialog, setShowEditProgressDialog] = useState(false);
  const [estimateProgress, setEstimateProgress] = useState(task?.estimateProgress || 0);

  // Current user (mock - in real app would come from auth)
  const currentUserId = "user-1";
  const currentUser = getUserById(currentUserId);

  if (!task) {
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
  const status = statuses.find((s) => s.id === task.statusId);
  const taskType = taskTypes.find((tt) => tt.id === task.taskTypeId);
  const assignees = task.assigneeIds.map((id) => getUserById(id)).filter(Boolean);
  const planFinish = calculatePlanFinish(task.planStart, task.duration);
  const planProgress = calculatePlanProgress(task.planStart, task.duration);
  const priority = priorityConfig[task.priority];

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment.trim(),
      authorId: currentUserId,
      createdAt: new Date(),
    };

    addComment(task.id, comment);
    setNewComment("");
  };

  const handleEditComment = (commentId: string) => {
    const comment = task.comments.find((c) => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditingCommentContent(comment.content);
    }
  };

  const handleSaveEditComment = () => {
    if (!editingCommentId || !editingCommentContent.trim()) return;
    updateComment(task.id, editingCommentId, editingCommentContent.trim());
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(task.id, commentId);
  };

  const handleSaveProgress = () => {
    updateTask(task.id, { estimateProgress });
    setShowEditProgressDialog(false);
  };

  const handleStatusChange = (statusId: string) => {
    updateTask(task.id, { statusId });
  };

  const sortedComments = [...task.comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-mono">{task.taskId}</span>
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
                setEstimateProgress(task.estimateProgress || 0);
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
                    <Progress value={task.estimateProgress || 0} className="flex-1 [&>div]:bg-green-500" />
                    <span className="text-sm font-medium w-12 text-right">{task.estimateProgress || 0}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "th" ? "ประเมินโดยผู้รับผิดชอบ" : "Estimated by assignee"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {language === "th" ? "Subtasks" : "Subtasks"}
                  <Badge variant="secondary">
                    {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        subtask.completed ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {subtask.completed && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className={cn(
                        "text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {language === "th" ? "Comments" : "Comments"}
                <Badge variant="secondary">{task.comments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
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
              <div className="space-y-4">
                {sortedComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {language === "th" ? "ยังไม่มี comment" : "No comments yet"}
                  </p>
                ) : (
                  sortedComments.map((comment) => {
                    const author = getUserById(comment.authorId);
                    const isEditing = editingCommentId === comment.id;
                    const isOwner = comment.authorId === currentUserId;

                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={author?.avatar} />
                          <AvatarFallback>{author?.name.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{author?.name || "Unknown"}</span>
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
                              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
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
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === "th" ? "สถานะ" : "Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={task.statusId} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === "th" ? "รายละเอียด" : "Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignees */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {language === "th" ? "ผู้รับผิดชอบ" : "Assignees"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {assignees.length > 0 ? (
                    assignees.map((assignee) => (
                      <div key={assignee?.id} className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={assignee?.avatar} />
                          <AvatarFallback className="text-[10px]">{assignee?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{assignee?.name}</span>
                      </div>
                    ))
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
                <Badge style={{ backgroundColor: `${priority.color}20`, color: priority.color }}>
                  {priority.icon} {priority.label}
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

              {/* Predecessors */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {language === "th" ? "งานที่ต้องรอ (Predecessor)" : "Predecessors"}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      {task.predecessorIds && task.predecessorIds.length > 0 
                        ? `${task.predecessorIds.length} ${language === "th" ? "งาน" : "task(s)"}`
                        : language === "th" ? "เลือกงานที่ต้องรอ" : "Select predecessors"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {language === "th" ? "เลือกงานที่ต้องเสร็จก่อน" : "Select tasks that must finish first"}
                      </p>
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {tasks
                            .filter((t) => t.id !== task.id && t.listId === task.listId)
                            .map((t) => {
                              const isSelected = task.predecessorIds?.includes(t.id);
                              return (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                  onClick={() => {
                                    const currentPredecessors = task.predecessorIds || [];
                                    const newPredecessors = isSelected
                                      ? currentPredecessors.filter((id) => id !== t.id)
                                      : [...currentPredecessors, t.id];
                                    updateTask(task.id, { predecessorIds: newPredecessors });
                                  }}
                                >
                                  <Checkbox checked={isSelected} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{t.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {t.taskId}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
                {task.predecessorIds && task.predecessorIds.length > 0 && (
                  <div className="space-y-1">
                    {task.predecessorIds.map((predId) => {
                      const predTask = tasks.find((t) => t.id === predId);
                      if (!predTask) return null;
                      const predStatus = statuses.find((s) => s.id === predTask.statusId);
                      return (
                        <div
                          key={predId}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: predStatus?.color }}
                          />
                          <span className="truncate flex-1">{predTask.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              const newPredecessors = task.predecessorIds?.filter(
                                (id) => id !== predId
                              ) || [];
                              updateTask(task.id, { predecessorIds: newPredecessors });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                  {task.duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{task.duration} {language === "th" ? "วัน" : "days"}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{format(new Date(task.dueDate), "d MMM yyyy", { locale })}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Meta */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{format(new Date(task.createdAt), "d MMM yyyy HH:mm", { locale })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span>{format(new Date(task.updatedAt), "d MMM yyyy HH:mm", { locale })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {language === "th" ? "ไฟล์แนบ" : "Attachments"}
                  <Badge variant="secondary" className="ml-auto">{task.attachments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 rounded border text-sm">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate flex-1">{attachment.name}</span>
                    </div>
                  ))}
                </div>
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
