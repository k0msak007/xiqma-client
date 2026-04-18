// Point Ratio types - for calculating point allocation (e.g., 80/20 means 80% of work gives points)
export interface PointRatio {
  pointedWorkPercent: number; // Percentage of work that counts for points (e.g., 80)
  nonPointedWorkPercent: number; // Percentage of work that doesn't count (e.g., 20)
}

export const defaultPointRatios: Record<string, PointRatio> = {
  "80/20": { pointedWorkPercent: 80, nonPointedWorkPercent: 20 },
  "60/40": { pointedWorkPercent: 60, nonPointedWorkPercent: 40 },
  "70/30": { pointedWorkPercent: 70, nonPointedWorkPercent: 30 },
  "90/10": { pointedWorkPercent: 90, nonPointedWorkPercent: 10 },
  "100/0": { pointedWorkPercent: 100, nonPointedWorkPercent: 0 },
};

// Point Target - Target point assignment per time period
export type PointTargetPeriod = "day" | "week" | "month" | "year";

export interface PointTarget {
  totalPoints: number; // Total points to assign per period (e.g., 40)
  period: PointTargetPeriod; // Time period (day/week/month/year)
}

// Helper function to calculate split based on ratio
export function calculatePointSplit(
  totalPoints: number,
  pointRatio: PointRatio
): { pointedPoints: number; nonPointedPoints: number } {
  const pointedPoints = Math.round((totalPoints * pointRatio.pointedWorkPercent) / 100);
  const nonPointedPoints = totalPoints - pointedPoints;
  return { pointedPoints, nonPointedPoints };
}

// Task Type Category
export type TaskTypeCategory = "private" | "organization";

// Task Type - for categorizing tasks and determining if they count for points
export interface TaskType {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: TaskTypeCategory; // Private tasks vs Organization tasks
  countsForPoints: boolean; // Whether this task type contributes to point calculations
  fixedPoints?: number; // For private tasks: fixed point value (e.g., Meeting = 2, Consult = 3)
  createdAt: Date;
}

// Organization Position - for org chart hierarchy
export interface Position {
  id: string;
  name: string;
  department?: string;
  level: number; // 1 = CEO/Top, 2 = VP, 3 = Director, 4 = Manager, 5 = Staff, etc.
  jobLevel?: string; // Job Level code e.g., "C1", "M1", "S1", "J1"
  parentPositionId?: string; // Reports to this position
  color?: string;
  createdAt: Date;
}

// Role types
export interface Role {
  id: string;
  name: string;
  description?: string;
  color: string;
  permissions: RolePermission[];
  pointRatio: PointRatio; // Default point ratio for this role
  pointTarget?: PointTarget; // Target point assignment per period
  createdAt: Date;
}

export type RolePermission = 
  | "view_tasks"
  | "create_tasks"
  | "edit_tasks"
  | "delete_tasks"
  | "assign_tasks"
  | "manage_users"
  | "manage_roles"
  | "manage_workspace"
  | "view_analytics"
  | "admin";

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "member" | "viewer"; // Legacy role field
  roleId?: string; // Reference to Role
  positionIds?: string[]; // References to Positions in org chart (many-to-many)
  customPointRatio?: PointRatio; // User-specific point ratio (overrides role's ratio)
  createdAt: Date;
}

// Status point count type - determines how status affects point calculation
export type StatusPointCountType = "not_counted" | "in_progress" | "complete";

// Status types (must match database enum: pending, in_progress, paused, review, completed, cancelled, blocked, overdue)
export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: "pending" | "in_progress" | "paused" | "review" | "completed" | "cancelled" | "blocked" | "overdue" | "closed";
  pointCountType: StatusPointCountType;
}

// Priority types
export type Priority = "urgent" | "high" | "normal" | "low";

export const priorityConfig: Record<Priority, { label: string; color: string; icon: string }> = {
  urgent: { label: "Urgent", color: "#ef4444", icon: "AlertCircle" },
  high: { label: "High", color: "#f97316", icon: "ArrowUp" },
  normal: { label: "Normal", color: "#3b82f6", icon: "Minus" },
  low: { label: "Low", color: "#6b7280", icon: "ArrowDown" },
};

// Story points options
export const storyPointsOptions = [1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPoints = (typeof storyPointsOptions)[number];

// Task types
export interface Task {
  id: string;
  taskId: string; // Human-readable Task ID (e.g., TASK-001)
  title: string;
  description?: string;
  statusId: string;
  priority: Priority;
  taskTypeId?: string; // Reference to TaskType
  assigneeIds: string[];
  creatorId: string;
  listId: string;
  dueDate?: Date;
  startDate?: Date;
  planStart?: Date; // Planned start date
  duration?: number; // Duration in days
  actualStart?: Date;
  actualFinish?: Date;
  estimateProgress?: number; // User-estimated progress percentage (0-100)
  predecessorIds?: string[]; // Task IDs that must be completed before this task can start
  storyPoints?: StoryPoints;
  timeEstimate?: number; // in minutes
  timeSpent?: number; // in minutes (time tracked)
  tags: string[];
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  order: number;
}

// Helper function to calculate Plan Finish from Plan Start + Duration
export function calculatePlanFinish(planStart: Date | undefined, duration: number | undefined): Date | undefined {
  if (!planStart || !duration) return undefined;
  const planFinish = new Date(planStart);
  planFinish.setDate(planFinish.getDate() + duration);
  return planFinish;
}

// Helper function to calculate Plan Progress: ((Today - Start) / (End - Start)) * 100
export function calculatePlanProgress(planStart: Date | undefined, planFinish: Date | undefined): number {
  if (!planStart || !planFinish) return 0;
  const today = new Date();
  const start = new Date(planStart);
  const end = new Date(planFinish);
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays <= 0) return 0;
  const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const progress = (daysPassed / totalDays) * 100;
  return Math.min(100, Math.max(0, progress));
}

// Helper function to calculate Actual Progress: (TimeSpent / TimeEstimate) * 100
export function calculateActualProgress(timeSpent: number | undefined, timeEstimate: number | undefined): number {
  if (!timeSpent || !timeEstimate || timeEstimate === 0) return 0;
  const progress = (timeSpent / timeEstimate) * 100;
  return Math.min(100, Math.max(0, progress));
}

// Helper function to calculate Variance: Plan Progress - Actual Progress
export function calculateVariance(planProgress: number, actualProgress: number): number {
  return planProgress - actualProgress;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

// List types
export interface List {
  id: string;
  name: string;
  folderId?: string;
  spaceId: string;
  color?: string;
  statuses: Status[];
  order: number;
  createdAt: Date;
}

// Folder types
export interface Folder {
  id: string;
  name: string;
  spaceId: string;
  color?: string;
  order: number;
  archived?: boolean; // For moving completed folders to archive
  archivedAt?: Date;
  createdAt: Date;
}

// Space types
export interface Space {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type?: "organization" | "project";
  memberIds: string[];
  order: number;
  createdAt: Date;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Activity types
export interface Activity {
  id: string;
  type: "created" | "updated" | "commented" | "status_changed" | "assigned" | "completed";
  taskId: string;
  userId: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Date;
}

// View types
export type ViewType = "list" | "board" | "calendar" | "timeline" | "gantt";

export interface View {
  id: string;
  name: string;
  type: ViewType;
  listId: string;
  filters?: ViewFilter[];
  groupBy?: string;
  sortBy?: { field: string; direction: "asc" | "desc" };
}

export interface ViewFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between";
  value: unknown;
}

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  type: "tasks_by_status" | "tasks_by_priority" | "velocity" | "workload" | "recent_activity" | "due_soon";
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
}

// Navigation state
export interface NavigationState {
  activeSpaceId?: string;
  activeFolderId?: string;
  activeListId?: string;
  activeTaskId?: string;
  activeView: ViewType;
}

// Holiday Settings
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface SpecialHoliday {
  id: string;
  name: string;
  date: Date; // Specific date
  recurring: boolean; // If true, repeats every year on same month/day
}

export interface HolidaySettings {
  year: number;
  weekendDays: DayOfWeek[]; // e.g., [0, 6] for Sunday and Saturday
  specialHolidays: SpecialHoliday[];
}

// Helper to check if a date is a holiday
export function isHoliday(date: Date, settings: HolidaySettings): boolean {
  const dayOfWeek = date.getDay() as DayOfWeek;
  
  // Check weekend
  if (settings.weekendDays.includes(dayOfWeek)) {
    return true;
  }
  
  // Check special holidays
  for (const holiday of settings.specialHolidays) {
    const holidayDate = new Date(holiday.date);
    if (holiday.recurring) {
      // Match month and day only
      if (date.getMonth() === holidayDate.getMonth() && date.getDate() === holidayDate.getDate()) {
        return true;
      }
    } else {
      // Match exact date
      if (
        date.getFullYear() === holidayDate.getFullYear() &&
        date.getMonth() === holidayDate.getMonth() &&
        date.getDate() === holidayDate.getDate()
      ) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper to get working days between two dates
export function getWorkingDays(startDate: Date, endDate: Date, settings: HolidaySettings): number {
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isHoliday(current, settings)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}
