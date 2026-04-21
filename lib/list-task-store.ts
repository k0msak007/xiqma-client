"use client";

import { create } from "zustand";
import { tasksApi, type ApiTaskRow, type ApiTaskDetail, type CreateTaskPayload, type UpdateTaskPayload } from "@/lib/api/tasks";
import { listsApi, type ListStatus } from "@/lib/api/lists";
import { subtasksApi } from "@/lib/api/subtasks";
import { commentsApi } from "@/lib/api/comments";
import { attachmentsApi } from "@/lib/api/attachments";
import { toast } from "sonner";
import type { Task, Status, Subtask, Comment, Attachment, Priority, StoryPoints, StatusPointCountType } from "@/lib/types";
import { cacheEmployee } from "@/lib/employee-cache";

// ── Adapters ──────────────────────────────────────────────────────────────────

function adaptListStatus(s: ListStatus): Status {
  const typeToPointCount: Record<string, StatusPointCountType> = {
    completed: "complete", closed: "complete",
    in_progress: "in_progress", review: "in_progress",
    pending: "not_counted", paused: "not_counted", blocked: "not_counted", overdue: "not_counted", open: "not_counted",
  };
  return {
    id:             s.id,
    name:           s.name,
    color:          s.color,
    order:          s.displayOrder,
    type:           s.type,
    pointCountType: (typeToPointCount[s.type] ?? "not_counted") as StatusPointCountType,
  };
}

function adaptApiRow(row: ApiTaskRow): Task {
  // Cache employee for lookup by components
  if (row.assignee_id && row.assignee_name) {
    cacheEmployee({ id: row.assignee_id, name: row.assignee_name, avatarUrl: row.assignee_avatar });
  }

  const subtaskCount    = Number(row.subtask_count    ?? 0);
  const commentCount    = Number(row.comment_count    ?? 0);
  const attachmentCount = Number(row.attachment_count ?? 0);

  // Create stub arrays for count-only display (list/board view)
  const stubSubtasks: Subtask[]       = Array.from({ length: subtaskCount },    (_, i) => ({ id: `stub-sub-${i}`,  title: "", completed: false }));
  const stubComments: Comment[]       = Array.from({ length: commentCount },    (_, i) => ({ id: `stub-cmt-${i}`,  content: "", authorId: "", createdAt: new Date() }));
  const stubAttachments: Attachment[] = Array.from({ length: attachmentCount }, (_, i) => ({ id: `stub-att-${i}`, name: "", url: "", type: "", size: 0, uploadedBy: "", uploadedAt: new Date() }));

  const storyPoints = row.story_points && [1,2,3,5,8,13,21].includes(Number(row.story_points))
    ? (Number(row.story_points) as StoryPoints) : undefined;

  return {
    id:           row.id,
    taskId:       row.display_id || "",
    title:        row.title,
    description:  row.description ?? undefined,
    statusId:     row.list_status_id ?? "",
    priority:     row.priority as Priority,
    taskTypeId:   row.task_type_id ?? undefined,
    assigneeIds:  row.assignee_id ? [row.assignee_id] : [],
    creatorId:    row.creator_id,
    listId:       row.list_id,
    dueDate:      row.deadline      ? new Date(row.deadline)     : undefined,
    planStart:    row.plan_start    ? new Date(row.plan_start)   : undefined,
    duration:     row.duration_days ? Number(row.duration_days)  : undefined,
    actualStart:  row.started_at    ? new Date(row.started_at)   : undefined,
    actualFinish: row.completed_at  ? new Date(row.completed_at) : undefined,
    storyPoints,
    timeEstimate: row.time_estimate_hours ? Math.round(Number(row.time_estimate_hours) * 60) : undefined,
    timeSpent:    row.accumulated_minutes ? Number(row.accumulated_minutes) : undefined,
    estimateProgress: row.estimate_progress != null ? Number(row.estimate_progress) : undefined,
    tags:         (row.tags as string[]) || [],
    subtasks:     stubSubtasks,
    comments:     stubComments,
    attachments:  stubAttachments,
    createdAt:    new Date(row.created_at),
    updatedAt:    new Date(row.updated_at),
    completedAt:  row.completed_at ? new Date(row.completed_at) : undefined,
    order:        Number(row.display_order) || 0,
  };
}

function adaptApiDetail(row: ApiTaskDetail): Task {
  if (row.assigneeId && row.assigneeName) {
    cacheEmployee({ id: row.assigneeId, name: row.assigneeName, avatarUrl: row.assigneeAvatar });
  }
  const storyPoints = row.storyPoints && [1,2,3,5,8,13,21].includes(Number(row.storyPoints))
    ? (Number(row.storyPoints) as StoryPoints) : undefined;
  
  // Handle both camelCase (from type) and snake_case (from backend direct access)
  const startedAt = (row as unknown as { started_at?: string }).started_at || row.startedAt;
  const completedAt = (row as unknown as { completed_at?: string }).completed_at || row.completedAt;
  const deadline = (row as unknown as { deadline?: string }).deadline || row.deadline;
  
  return {
    id:           row.id,
    taskId:       row.displayId || "",
    title:        row.title,
    description:  row.description ?? undefined,
    statusId:     row.listStatusId ?? "",
    priority:     row.priority as Priority,
    taskTypeId:   row.taskTypeId ?? undefined,
    assigneeIds:  row.assigneeId ? [row.assigneeId] : [],
    creatorId:    row.creatorId,
    listId:       row.listId,
    dueDate:      deadline     ? new Date(deadline)     : undefined,
    planStart:    row.planStart     ? new Date(row.planStart)    : undefined,
    duration:     row.durationDays  ? Number(row.durationDays)   : undefined,
    actualStart:  startedAt   ? new Date(startedAt)  : undefined,
    actualFinish: completedAt ? new Date(completedAt): undefined,
    storyPoints,
    timeEstimate: row.timeEstimateHours ? Math.round(Number(row.timeEstimateHours) * 60) : undefined,
    timeSpent:    row.accumulatedMinutes ? Number(row.accumulatedMinutes) : undefined,
    estimateProgress: row.estimateProgress != null ? Number(row.estimateProgress) : undefined,
    tags:         row.tags || [],
    subtasks:     [], // filled separately by loadSubtasks
    comments:     [], // filled separately by loadComments
    attachments:  [], // filled separately by loadAttachments
    createdAt:    new Date(row.createdAt),
    updatedAt:    new Date(row.updatedAt),
    completedAt:  completedAt ? new Date(completedAt) : undefined,
    order:        Number(row.displayOrder) || 0,
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ListTaskStore {
  tasks: Task[];
  statuses: Status[];
  currentListId: string | null;
  loading: boolean;
  saving: boolean;

  // Actions
  loadListTasks:    (listId: string) => Promise<void>;
  refreshTask:      (taskId: string) => Promise<void>;
  createTask:       (payload: CreateTaskPayload) => Promise<Task | null>;
  updateTask:       (taskId: string, data: UpdateTaskPayload) => Promise<void>;
  updateTaskStatus: (taskId: string, listStatusId: string) => Promise<void>;
  reorderTasks:     (listId: string, statusId: string, orderedTaskIds: string[]) => Promise<void>;
  deleteTask:       (taskId: string) => Promise<void>;

  // Subtask actions (operate on the task in the store)
  loadSubtasks:    (taskId: string) => Promise<void>;
  toggleSubtask:   (taskId: string, subtaskId: string) => Promise<void>;
  addSubtask:      (taskId: string, title: string) => Promise<void>;
  deleteSubtask:   (taskId: string, subtaskId: string) => Promise<void>;

  // Comment actions
  loadComments:    (taskId: string) => Promise<void>;
  addComment:      (taskId: string, text: string) => Promise<void>;
  updateComment:   (taskId: string, commentId: string, text: string) => Promise<void>;
  deleteComment:   (taskId: string, commentId: string) => Promise<void>;

  // Attachment actions
  loadAttachments:    (taskId: string) => Promise<void>;
  uploadAttachment:   (taskId: string, file: File) => Promise<void>;
  deleteAttachment:   (taskId: string, attachmentId: string) => Promise<void>;
}

export const useListTaskStore = create<ListTaskStore>((set, get) => ({
  tasks: [],
  statuses: [],
  currentListId: null,
  loading: false,
  saving: false,

  loadListTasks: async (listId) => {
    set({ loading: true, currentListId: listId });
    try {
      console.log("[list-task-store] Loading tasks for listId:", listId);
      
      // Load tasks and statuses in parallel
      const [result, statuses] = await Promise.all([
        tasksApi.list({ listId, limit: 500 }),
        listsApi.getStatuses(listId),
      ]);
      
      console.log("[list-task-store] Tasks loaded:", result.data.length);
      console.log("[list-task-store] Statuses loaded:", statuses.length);
      console.log("[list-task-store] Statuses:", statuses);
      
      const tasks = result.data.map(adaptApiRow);
      set({
        tasks,
        statuses: statuses.map(adaptListStatus),
        loading: false,
      });
    } catch (err) {
      console.error("[list-task-store] Error loading tasks:", err);
      set({ loading: false });
      toast.error("ไม่สามารถโหลดข้อมูล task ได้");
      throw err;
    }
  },

  refreshTask: async (taskId) => {
    try {
      const detail = await tasksApi.get(taskId);
      const updated = adaptApiDetail(detail);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...updated, subtasks: t.subtasks, comments: t.comments, attachments: t.attachments } : t)),
      }));
    } catch { /* silent */ }
  },

  createTask: async (payload) => {
    set({ saving: true });
    try {
      const row = await tasksApi.create(payload);
      const task = adaptApiDetail(row);
      set((s) => ({ tasks: [...s.tasks, task], saving: false }));
      toast.success("สร้าง task สำเร็จ");
      return task;
    } catch (err: unknown) {
      set({ saving: false });
      const message = err instanceof Error ? err.message : "สร้าง task ไม่สำเร็จ";
      toast.error(message);
      return null;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      const row = await tasksApi.update(taskId, data);
      const updated = adaptApiDetail(row);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...updated, subtasks: t.subtasks, comments: t.comments, attachments: t.attachments }
            : t
        ),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "อัปเดต task ไม่สำเร็จ";
      toast.error(message);
    }
  },

  updateTaskStatus: async (taskId, listStatusId) => {
    // Optimistic update
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, statusId: listStatusId } : t)),
    }));
    try {
      await tasksApi.updateStatus(taskId, { listStatusId });
    } catch {
      // Rollback on failure by reloading
      const listId = get().currentListId;
      if (listId) get().loadListTasks(listId);
      toast.error("เปลี่ยน status ไม่สำเร็จ");
    }
  },

  reorderTasks: async (listId, statusId, orderedTaskIds) => {
    // Optimistic: update order locally
    set((s) => {
      const taskMap = new Map(s.tasks.map((t) => [t.id, t]));
      const reordered = orderedTaskIds.map((id, idx) => {
        const t = taskMap.get(id);
        return t ? { ...t, order: idx, statusId } : null;
      }).filter(Boolean) as Task[];
      const others = s.tasks.filter((t) => !orderedTaskIds.includes(t.id));
      return { tasks: [...others, ...reordered] };
    });
    try {
      await tasksApi.reorder({ listId, statusId, orderedTaskIds });
    } catch {
      // Reload on failure
      get().loadListTasks(listId);
      toast.error("เรียงลำดับ task ไม่สำเร็จ");
    }
  },

  deleteTask: async (taskId) => {
    try {
      await tasksApi.delete(taskId);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
      toast.success("ลบ task สำเร็จ");
    } catch {
      toast.error("ลบ task ไม่สำเร็จ");
    }
  },

  // ── Subtasks ─────────────────────────────────────────────────────────────────

  loadSubtasks: async (taskId) => {
    try {
      const rows = await subtasksApi.list(taskId);
      const subtasks: Subtask[] = rows.map((r) => ({
        id:        r.id,
        title:     r.title,
        completed: r.isDone,
      }));
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, subtasks } : t)),
      }));
    } catch { /* silent */ }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const updated = await subtasksApi.toggle(taskId, subtaskId);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((sub) => sub.id === subtaskId ? { ...sub, completed: updated.isDone } : sub) }
            : t
        ),
      }));
    } catch {
      toast.error("อัปเดต subtask ไม่สำเร็จ");
    }
  },

  addSubtask: async (taskId, title) => {
    try {
      const row = await subtasksApi.create(taskId, { title });
      const newSub: Subtask = { id: row.id, title: row.title, completed: row.isDone };
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks.filter((sub) => !sub.id.startsWith("stub-")), newSub] } : t
        ),
      }));
    } catch {
      toast.error("เพิ่ม subtask ไม่สำเร็จ");
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    try {
      await subtasksApi.delete(taskId, subtaskId);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((sub) => sub.id !== subtaskId) } : t
        ),
      }));
    } catch {
      toast.error("ลบ subtask ไม่สำเร็จ");
    }
  },

  // ── Comments ──────────────────────────────────────────────────────────────────

  loadComments: async (taskId) => {
    try {
      const rows = await commentsApi.list(taskId);
      const comments: Comment[] = rows.map((r) => ({
        id:        r.id,
        content:   r.commentText,
        authorId:  r.authorId,
        createdAt: new Date(r.createdAt),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      }));
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, comments } : t)),
      }));
    } catch { /* silent */ }
  },

  addComment: async (taskId, text) => {
    try {
      const row = await commentsApi.create(taskId, { commentText: text });
      const newComment: Comment = {
        id:        row.id,
        content:   row.commentText,
        authorId:  row.authorId,
        createdAt: new Date(row.createdAt),
      };
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, comments: [...t.comments.filter((c) => !c.id.startsWith("stub-")), newComment] } : t
        ),
      }));
    } catch {
      toast.error("เพิ่ม comment ไม่สำเร็จ");
    }
  },

  updateComment: async (taskId, commentId, text) => {
    try {
      const row = await commentsApi.update(taskId, commentId, { commentText: text });
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, comments: t.comments.map((c) => c.id === commentId ? { ...c, content: row.commentText, updatedAt: new Date() } : c) }
            : t
        ),
      }));
    } catch {
      toast.error("แก้ไข comment ไม่สำเร็จ");
    }
  },

  deleteComment: async (taskId, commentId) => {
    try {
      await commentsApi.delete(taskId, commentId);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, comments: t.comments.filter((c) => c.id !== commentId) } : t
        ),
      }));
    } catch {
      toast.error("ลบ comment ไม่สำเร็จ");
    }
  },

  // ── Attachments ───────────────────────────────────────────────────────────────

  loadAttachments: async (taskId) => {
    try {
      const rows = await attachmentsApi.list(taskId);
      const attachments: Attachment[] = rows.map((r) => ({
        id:         r.id,
        name:       r.fileName ?? r.id,
        url:        r.fileUrl,
        type:       r.mimeType ?? "application/octet-stream",
        size:       r.fileSizeBytes ?? 0,
        uploadedBy: r.uploadedBy,
        uploadedAt: new Date(r.createdAt),
      }));
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, attachments } : t)),
      }));
    } catch { /* silent */ }
  },

  uploadAttachment: async (taskId, file) => {
    try {
      const row = await attachmentsApi.upload(taskId, file);
      const newAtt: Attachment = {
        id:         row.id,
        name:       row.fileName ?? file.name,
        url:        row.fileUrl,
        type:       row.mimeType ?? file.type,
        size:       row.fileSizeBytes ?? file.size,
        uploadedBy: row.uploadedBy,
        uploadedAt: new Date(row.createdAt),
      };
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, attachments: [...t.attachments.filter((a) => !a.id.startsWith("stub-")), newAtt] } : t
        ),
      }));
      toast.success("อัปโหลดไฟล์สำเร็จ");
    } catch {
      toast.error("อัปโหลดไฟล์ไม่สำเร็จ");
    }
  },

  deleteAttachment: async (taskId, attachmentId) => {
    try {
      await attachmentsApi.delete(taskId, attachmentId);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) } : t
        ),
      }));
    } catch {
      toast.error("ลบไฟล์ไม่สำเร็จ");
    }
  },
}));
