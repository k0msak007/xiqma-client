import { api } from "./client";

export interface QaResult {
  answer: string;
  model: string;
  toolCallsMade?: string[];
}

export interface ExtractedTaskDraft {
  // raw fields from AI
  title:           string;
  description?:    string | null;
  rawAssignee?:    string | null;
  rawTaskType?:    string | null;
  priority?:       "low" | "normal" | "high" | "urgent";
  planStart?:      string | null;
  durationDays?:   number | null;
  deadline?:       string | null;
  dependsOnIndex?: number | null;
  reasoning?:      string | null;

  // server-resolved
  assigneeId?:     string | null;
  assigneeName?:   string | null;
  assigneeMatch:   "exact" | "fuzzy" | "none";
  taskTypeId?:     string | null;
  taskTypeName?:   string | null;
}

export interface ExtractTasksResult {
  drafts: ExtractedTaskDraft[];
  notes?: string;
  model:  string;
}

export interface DurationEstimate {
  similarTasks: Array<{
    taskId: string;
    title: string;
    displayId: string | null;
    estimatedHours: number | null;
    actualHours: number | null;
    similarity: number;
  }>;
  suggestedHours: number;
  rangeMin: number;
  rangeMax: number;
  sampleSize: number;
}

export const aiApi = {
  /** POST /ai/tasks/extract — admin only */
  extractTasks: (body: { text: string; listId: string; language?: "th" | "en" }) =>
    api.post<ExtractTasksResult>("/ai/tasks/extract", body),

  /** POST /ai/estimate-duration — admin only */
  estimateDuration: (body: { title: string; description?: string | null }) =>
    api.post<DurationEstimate>("/ai/estimate-duration", body),

  /** POST /ai/qa — manager and admin */
  ask: (body: { question: string }) =>
    api.post<QaResult>("/ai/qa", body),
};
