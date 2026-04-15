import type { User, Space, Folder, List, Task, Status, Tag, Activity, Role, TaskType, HolidaySettings, DayOfWeek, Position } from "./types";
import { getCachedEmployee } from "@/lib/employee-cache";

// Organization Positions
export const positions: Position[] = [
  {
    id: "pos-1",
    name: "CEO",
    department: "Executive",
    level: 1,
    jobLevel: "E1",
    parentPositionId: undefined,
    color: "#ef4444",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-2",
    name: "CTO",
    department: "Technology",
    level: 2,
    jobLevel: "C1",
    parentPositionId: "pos-1",
    color: "#3b82f6",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-3",
    name: "VP of Engineering",
    department: "Engineering",
    level: 3,
    jobLevel: "VP1",
    parentPositionId: "pos-2",
    color: "#8b5cf6",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-4",
    name: "Engineering Manager",
    department: "Engineering",
    level: 4,
    jobLevel: "M1",
    parentPositionId: "pos-3",
    color: "#10b981",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-5",
    name: "Senior Developer",
    department: "Engineering",
    level: 5,
    jobLevel: "S1",
    parentPositionId: "pos-4",
    color: "#06b6d4",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-6",
    name: "Developer",
    department: "Engineering",
    level: 5,
    jobLevel: "S2",
    parentPositionId: "pos-4",
    color: "#06b6d4",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-7",
    name: "Design Lead",
    department: "Design",
    level: 4,
    jobLevel: "M1",
    parentPositionId: "pos-3",
    color: "#f59e0b",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-8",
    name: "UI/UX Designer",
    department: "Design",
    level: 5,
    jobLevel: "S1",
    parentPositionId: "pos-7",
    color: "#f59e0b",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-9",
    name: "QA Lead",
    department: "Quality Assurance",
    level: 4,
    jobLevel: "M1",
    parentPositionId: "pos-3",
    color: "#ec4899",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "pos-10",
    name: "QA Engineer",
    department: "Quality Assurance",
    level: 5,
    jobLevel: "S1",
    parentPositionId: "pos-9",
    color: "#ec4899",
    createdAt: new Date("2024-01-01"),
  },
];

// Holiday Settings by Year
export const holidaySettings: HolidaySettings[] = [
  {
    year: 2024,
    weekendDays: [0, 6] as DayOfWeek[], // Sunday and Saturday
    specialHolidays: [
      { id: "h-2024-1", name: "New Year's Day", date: new Date("2024-01-01"), recurring: true },
      { id: "h-2024-2", name: "Makha Bucha Day", date: new Date("2024-02-24"), recurring: false },
      { id: "h-2024-3", name: "Chakri Memorial Day", date: new Date("2024-04-06"), recurring: true },
      { id: "h-2024-4", name: "Songkran Festival", date: new Date("2024-04-13"), recurring: true },
      { id: "h-2024-5", name: "Songkran Festival", date: new Date("2024-04-14"), recurring: true },
      { id: "h-2024-6", name: "Songkran Festival", date: new Date("2024-04-15"), recurring: true },
      { id: "h-2024-7", name: "Labour Day", date: new Date("2024-05-01"), recurring: true },
      { id: "h-2024-8", name: "Coronation Day", date: new Date("2024-05-04"), recurring: true },
      { id: "h-2024-9", name: "Visakha Bucha Day", date: new Date("2024-05-22"), recurring: false },
      { id: "h-2024-10", name: "H.M. Queen's Birthday", date: new Date("2024-06-03"), recurring: true },
      { id: "h-2024-11", name: "Asanha Bucha Day", date: new Date("2024-07-20"), recurring: false },
      { id: "h-2024-12", name: "H.M. King's Birthday", date: new Date("2024-07-28"), recurring: true },
      { id: "h-2024-13", name: "Mother's Day", date: new Date("2024-08-12"), recurring: true },
      { id: "h-2024-14", name: "Chulalongkorn Day", date: new Date("2024-10-23"), recurring: true },
      { id: "h-2024-15", name: "Father's Day", date: new Date("2024-12-05"), recurring: true },
      { id: "h-2024-16", name: "Constitution Day", date: new Date("2024-12-10"), recurring: true },
      { id: "h-2024-17", name: "New Year's Eve", date: new Date("2024-12-31"), recurring: true },
    ],
  },
  {
    year: 2025,
    weekendDays: [0, 6] as DayOfWeek[], // Sunday and Saturday
    specialHolidays: [
      { id: "h-2025-1", name: "New Year's Day", date: new Date("2025-01-01"), recurring: true },
      { id: "h-2025-2", name: "Makha Bucha Day", date: new Date("2025-02-12"), recurring: false },
      { id: "h-2025-3", name: "Chakri Memorial Day", date: new Date("2025-04-06"), recurring: true },
      { id: "h-2025-4", name: "Songkran Festival", date: new Date("2025-04-13"), recurring: true },
      { id: "h-2025-5", name: "Songkran Festival", date: new Date("2025-04-14"), recurring: true },
      { id: "h-2025-6", name: "Songkran Festival", date: new Date("2025-04-15"), recurring: true },
      { id: "h-2025-7", name: "Labour Day", date: new Date("2025-05-01"), recurring: true },
      { id: "h-2025-8", name: "Coronation Day", date: new Date("2025-05-04"), recurring: true },
      { id: "h-2025-9", name: "Visakha Bucha Day", date: new Date("2025-05-11"), recurring: false },
      { id: "h-2025-10", name: "H.M. Queen's Birthday", date: new Date("2025-06-03"), recurring: true },
      { id: "h-2025-11", name: "Asanha Bucha Day", date: new Date("2025-07-10"), recurring: false },
      { id: "h-2025-12", name: "H.M. King's Birthday", date: new Date("2025-07-28"), recurring: true },
      { id: "h-2025-13", name: "Mother's Day", date: new Date("2025-08-12"), recurring: true },
      { id: "h-2025-14", name: "Chulalongkorn Day", date: new Date("2025-10-23"), recurring: true },
      { id: "h-2025-15", name: "Father's Day", date: new Date("2025-12-05"), recurring: true },
      { id: "h-2025-16", name: "Constitution Day", date: new Date("2025-12-10"), recurring: true },
      { id: "h-2025-17", name: "New Year's Eve", date: new Date("2025-12-31"), recurring: true },
    ],
  },
  {
    year: 2026,
    weekendDays: [0, 6] as DayOfWeek[], // Sunday and Saturday
    specialHolidays: [
      { id: "h-2026-1", name: "New Year's Day", date: new Date("2026-01-01"), recurring: true },
      { id: "h-2026-2", name: "Makha Bucha Day", date: new Date("2026-03-03"), recurring: false },
      { id: "h-2026-3", name: "Chakri Memorial Day", date: new Date("2026-04-06"), recurring: true },
      { id: "h-2026-4", name: "Songkran Festival", date: new Date("2026-04-13"), recurring: true },
      { id: "h-2026-5", name: "Songkran Festival", date: new Date("2026-04-14"), recurring: true },
      { id: "h-2026-6", name: "Songkran Festival", date: new Date("2026-04-15"), recurring: true },
      { id: "h-2026-7", name: "Labour Day", date: new Date("2026-05-01"), recurring: true },
      { id: "h-2026-8", name: "Coronation Day", date: new Date("2026-05-04"), recurring: true },
      { id: "h-2026-9", name: "Visakha Bucha Day", date: new Date("2026-05-31"), recurring: false },
      { id: "h-2026-10", name: "H.M. Queen's Birthday", date: new Date("2026-06-03"), recurring: true },
      { id: "h-2026-11", name: "Asanha Bucha Day", date: new Date("2026-07-29"), recurring: false },
      { id: "h-2026-12", name: "H.M. King's Birthday", date: new Date("2026-07-28"), recurring: true },
      { id: "h-2026-13", name: "Mother's Day", date: new Date("2026-08-12"), recurring: true },
      { id: "h-2026-14", name: "Chulalongkorn Day", date: new Date("2026-10-23"), recurring: true },
      { id: "h-2026-15", name: "Father's Day", date: new Date("2026-12-05"), recurring: true },
      { id: "h-2026-16", name: "Constitution Day", date: new Date("2026-12-10"), recurring: true },
      { id: "h-2026-17", name: "New Year's Eve", date: new Date("2026-12-31"), recurring: true },
    ],
  },
];

// Task Types - categorize tasks and determine if they count for points
export const taskTypes: TaskType[] = [
  // Organization Task Types
  {
    id: "tasktype-1",
    name: "Development",
    description: "Software development work",
    color: "#3b82f6",
    category: "organization",
    countsForPoints: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-2",
    name: "Bug Fix",
    description: "Bug fixes and patches",
    color: "#ef4444",
    category: "organization",
    countsForPoints: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-3",
    name: "Design",
    description: "UI/UX design work",
    color: "#f59e0b",
    category: "organization",
    countsForPoints: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-4",
    name: "Documentation",
    description: "Documentation and specs",
    color: "#10b981",
    category: "organization",
    countsForPoints: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-5",
    name: "Code Review",
    description: "Reviewing code and PRs",
    color: "#06b6d4",
    category: "organization",
    countsForPoints: true,
    createdAt: new Date("2024-01-01"),
  },
  // Private Task Types with Fixed Points
  {
    id: "tasktype-6",
    name: "Internal Meeting",
    description: "Internal team meetings",
    color: "#8b5cf6",
    category: "private",
    countsForPoints: true,
    fixedPoints: 2,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-7",
    name: "Consult",
    description: "Consultation and advisory",
    color: "#ec4899",
    category: "private",
    countsForPoints: true,
    fixedPoints: 3,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-8",
    name: "Training",
    description: "Training and learning",
    color: "#14b8a6",
    category: "private",
    countsForPoints: true,
    fixedPoints: 2,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-9",
    name: "External Meeting",
    description: "Meetings with external parties",
    color: "#f97316",
    category: "private",
    countsForPoints: true,
    fixedPoints: 3,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "tasktype-10",
    name: "Admin Task",
    description: "Administrative work (no points)",
    color: "#6b7280",
    category: "private",
    countsForPoints: false,
    fixedPoints: 0,
    createdAt: new Date("2024-01-01"),
  },
];

// Roles
export const roles: Role[] = [
  {
    id: "role-1",
    name: "Developer",
    description: "Software developers and engineers",
    color: "#3b82f6",
    permissions: ["view_tasks", "create_tasks", "edit_tasks", "assign_tasks", "view_analytics"],
    pointRatio: { pointedWorkPercent: 80, nonPointedWorkPercent: 20 },
    pointTarget: { totalPoints: 40, period: "week" },
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "role-2",
    name: "Designer",
    description: "UI/UX designers and creative team",
    color: "#f59e0b",
    permissions: ["view_tasks", "create_tasks", "edit_tasks", "view_analytics"],
    pointRatio: { pointedWorkPercent: 70, nonPointedWorkPercent: 30 },
    pointTarget: { totalPoints: 35, period: "week" },
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "role-3",
    name: "Project Manager",
    description: "Project managers and team leads",
    color: "#10b981",
    permissions: ["view_tasks", "create_tasks", "edit_tasks", "delete_tasks", "assign_tasks", "manage_users", "view_analytics"],
    pointRatio: { pointedWorkPercent: 60, nonPointedWorkPercent: 40 },
    pointTarget: { totalPoints: 30, period: "week" },
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "role-4",
    name: "QA Engineer",
    description: "Quality assurance and testing",
    color: "#8b5cf6",
    permissions: ["view_tasks", "create_tasks", "edit_tasks", "view_analytics"],
    pointRatio: { pointedWorkPercent: 80, nonPointedWorkPercent: 20 },
    pointTarget: { totalPoints: 40, period: "week" },
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "role-5",
    name: "Admin",
    description: "Full system administrator access",
    color: "#ef4444",
    permissions: ["admin"],
    pointRatio: { pointedWorkPercent: 100, nonPointedWorkPercent: 0 },
    pointTarget: { totalPoints: 20, period: "week" },
    createdAt: new Date("2024-01-01"),
  },
];

// Users
export const users: User[] = [
  {
    id: "user-1",
    name: "Alex Johnson",
    email: "alex@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    role: "admin",
    roleId: "role-5",
    positionIds: ["pos-3"], // VP of Engineering
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: "member",
    roleId: "role-1",
    positionIds: ["pos-5", "pos-4"], // Senior Developer + Acting Engineering Manager
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "user-3",
    name: "Mike Brown",
    email: "mike@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    role: "member",
    roleId: "role-1",
    positionIds: ["pos-6"], // Developer
    customPointRatio: { pointedWorkPercent: 90, nonPointedWorkPercent: 10 }, // Custom ratio
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "user-4",
    name: "Emily Davis",
    email: "emily@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    role: "member",
    roleId: "role-2",
    positionIds: ["pos-8", "pos-7"], // UI/UX Designer + Design Lead
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "user-5",
    name: "David Wilson",
    email: "david@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    role: "viewer",
    roleId: "role-4",
    positionIds: ["pos-10"], // QA Engineer
    createdAt: new Date("2024-03-01"),
  },
];

// Job Statuses - Master data for task status workflow
export const statuses: Status[] = [
  { id: "status-1", name: "To Do", color: "#6b7280", order: 0, type: "open", pointCountType: "not_counted" },
  { id: "status-2", name: "In Progress", color: "#3b82f6", order: 1, type: "in_progress", pointCountType: "in_progress" },
  { id: "status-3", name: "In Review", color: "#f59e0b", order: 2, type: "review", pointCountType: "in_progress" },
  { id: "status-4", name: "Done", color: "#10b981", order: 3, type: "done", pointCountType: "complete" },
  { id: "status-5", name: "Closed", color: "#6366f1", order: 4, type: "closed", pointCountType: "complete" },
];

// Alias for backward compatibility
export const defaultStatuses = statuses;

// Spaces
export const spaces: Space[] = [
  {
    id: "space-1",
    name: "Engineering",
    color: "#3b82f6",
    icon: "Code",
    memberIds: ["user-1", "user-2", "user-3"],
    order: 0,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "space-2",
    name: "Marketing",
    color: "#10b981",
    icon: "Megaphone",
    memberIds: ["user-1", "user-4", "user-5"],
    order: 1,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "space-3",
    name: "Design",
    color: "#f59e0b",
    icon: "Palette",
    memberIds: ["user-2", "user-4"],
    order: 2,
    createdAt: new Date("2024-02-01"),
  },
];

// Folders
export const folders: Folder[] = [
  {
    id: "folder-1",
    name: "Frontend",
    spaceId: "space-1",
    color: "#3b82f6",
    order: 0,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "folder-2",
    name: "Backend",
    spaceId: "space-1",
    color: "#6366f1",
    order: 1,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "folder-3",
    name: "Campaigns",
    spaceId: "space-2",
    color: "#10b981",
    order: 0,
    createdAt: new Date("2024-01-20"),
  },
];

// Lists
export const lists: List[] = [
  {
    id: "list-1",
    name: "Sprint 24",
    folderId: "folder-1",
    spaceId: "space-1",
    statuses: defaultStatuses,
    order: 0,
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "list-2",
    name: "Backlog",
    folderId: "folder-1",
    spaceId: "space-1",
    statuses: defaultStatuses,
    order: 1,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "list-3",
    name: "API Development",
    folderId: "folder-2",
    spaceId: "space-1",
    statuses: defaultStatuses,
    order: 0,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "list-4",
    name: "Q1 Campaign",
    folderId: "folder-3",
    spaceId: "space-2",
    statuses: defaultStatuses,
    order: 0,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "list-5",
    name: "UI Components",
    spaceId: "space-3",
    statuses: defaultStatuses,
    order: 0,
    createdAt: new Date("2024-02-05"),
  },
];

// Tags
export const tags: Tag[] = [
  { id: "tag-1", name: "bug", color: "#ef4444" },
  { id: "tag-2", name: "feature", color: "#3b82f6" },
  { id: "tag-3", name: "improvement", color: "#10b981" },
  { id: "tag-4", name: "documentation", color: "#6366f1" },
  { id: "tag-5", name: "urgent", color: "#f97316" },
];

// Tasks
export const tasks: Task[] = [
  {
    id: "task-1",
    taskId: "TASK-001",
    title: "Implement user authentication",
    description: "Set up JWT-based authentication with refresh tokens",
    statusId: "status-2",
    priority: "high",
    assigneeIds: ["user-2"],
    creatorId: "user-1",
    listId: "list-1",
    dueDate: new Date("2024-04-05"),
    startDate: new Date("2024-03-25"),
    planStart: new Date("2024-03-25"),
    duration: 11,
    storyPoints: 8,
    timeEstimate: 960,
    timeSpent: 480,
    tags: ["feature"],
    subtasks: [
      { id: "subtask-1", title: "Create login endpoint", completed: true },
      { id: "subtask-2", title: "Implement token refresh", completed: false },
      { id: "subtask-3", title: "Add password reset flow", completed: false },
    ],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-03-28"),
    order: 0,
  },
  {
    id: "task-2",
    taskId: "TASK-002",
    title: "Fix navigation bug on mobile",
    description: "Menu doesn't close after selecting an item on mobile devices",
    statusId: "status-1",
    priority: "urgent",
    assigneeIds: ["user-3"],
    creatorId: "user-2",
    listId: "list-1",
    dueDate: new Date("2024-04-02"),
    planStart: new Date("2024-03-30"),
    duration: 3,
    storyPoints: 2,
    timeEstimate: 120,
    tags: ["bug", "urgent"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-28"),
    updatedAt: new Date("2024-03-28"),
    order: 1,
  },
  {
    id: "task-3",
    taskId: "TASK-003",
    title: "Design dashboard widgets",
    description: "Create reusable widget components for the analytics dashboard",
    statusId: "status-3",
    priority: "normal",
    assigneeIds: ["user-4"],
    creatorId: "user-1",
    listId: "list-1",
    dueDate: new Date("2024-04-10"),
    planStart: new Date("2024-03-28"),
    duration: 13,
    storyPoints: 5,
    timeEstimate: 480,
    timeSpent: 360,
    tags: ["feature"],
    subtasks: [
      { id: "subtask-4", title: "Task distribution chart", completed: true },
      { id: "subtask-5", title: "Velocity chart", completed: true },
      { id: "subtask-6", title: "Workload heatmap", completed: false },
    ],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-30"),
    order: 2,
  },
  {
    id: "task-4",
    taskId: "TASK-004",
    title: "Optimize database queries",
    description: "Improve query performance for task listing and filtering",
    statusId: "status-4",
    priority: "high",
    assigneeIds: ["user-2", "user-3"],
    creatorId: "user-1",
    listId: "list-1",
    dueDate: new Date("2024-03-30"),
    planStart: new Date("2024-03-20"),
    duration: 10,
    storyPoints: 5,
    timeEstimate: 360,
    timeSpent: 420,
    tags: ["improvement"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-29"),
    completedAt: new Date("2024-03-29"),
    order: 3,
  },
  {
    id: "task-5",
    taskId: "TASK-005",
    title: "Write API documentation",
    description: "Document all REST endpoints with examples",
    statusId: "status-1",
    priority: "low",
    assigneeIds: ["user-5"],
    creatorId: "user-2",
    listId: "list-3",
    dueDate: new Date("2024-04-15"),
    planStart: new Date("2024-04-01"),
    duration: 14,
    storyPoints: 3,
    timeEstimate: 240,
    tags: ["documentation"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-03-20"),
    order: 0,
  },
  {
    id: "task-6",
    taskId: "TASK-006",
    title: "Create email templates",
    description: "Design responsive email templates for marketing campaigns",
    statusId: "status-2",
    priority: "normal",
    assigneeIds: ["user-4"],
    creatorId: "user-1",
    listId: "list-4",
    dueDate: new Date("2024-04-08"),
    planStart: new Date("2024-03-30"),
    duration: 9,
    storyPoints: 3,
    timeEstimate: 240,
    timeSpent: 120,
    tags: ["feature"],
    subtasks: [
      { id: "subtask-7", title: "Welcome email", completed: true },
      { id: "subtask-8", title: "Newsletter template", completed: false },
    ],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-22"),
    updatedAt: new Date("2024-03-27"),
    order: 0,
  },
  {
    id: "task-7",
    taskId: "TASK-007",
    title: "Implement drag and drop",
    description: "Add drag and drop functionality to Kanban board",
    statusId: "status-1",
    priority: "high",
    assigneeIds: ["user-2"],
    creatorId: "user-1",
    listId: "list-1",
    planStart: new Date("2024-04-01"),
    duration: 7,
    dueDate: new Date("2024-04-12"),
    storyPoints: 8,
    timeEstimate: 720,
    tags: ["feature"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-30"),
    updatedAt: new Date("2024-03-30"),
    order: 4,
  },
  {
    id: "task-8",
    title: "Set up CI/CD pipeline",
    description: "Configure automated testing and deployment",
    statusId: "status-4",
    priority: "high",
    assigneeIds: ["user-3"],
    creatorId: "user-1",
    listId: "list-3",
    dueDate: new Date("2024-03-25"),
    storyPoints: 5,
    timeEstimate: 480,
    timeSpent: 540,
    tags: ["improvement"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-24"),
    completedAt: new Date("2024-03-24"),
    order: 1,
  },
  {
    id: "task-9",
    title: "Button component variants",
    description: "Create all button variants as per design system",
    statusId: "status-4",
    priority: "normal",
    assigneeIds: ["user-4"],
    creatorId: "user-4",
    listId: "list-5",
    storyPoints: 2,
    timeEstimate: 180,
    timeSpent: 150,
    tags: ["feature"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-15"),
    completedAt: new Date("2024-02-15"),
    order: 0,
  },
  {
    id: "task-10",
    title: "Input field components",
    description: "Build input components with validation states",
    statusId: "status-2",
    priority: "normal",
    assigneeIds: ["user-4"],
    creatorId: "user-4",
    listId: "list-5",
    storyPoints: 3,
    timeEstimate: 240,
    timeSpent: 60,
    tags: ["feature"],
    subtasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date("2024-02-16"),
    updatedAt: new Date("2024-03-01"),
    order: 1,
  },
];

// Activities
export const activities: Activity[] = [
  {
    id: "activity-1",
    type: "status_changed",
    taskId: "task-1",
    userId: "user-2",
    previousValue: "To Do",
    newValue: "In Progress",
    createdAt: new Date("2024-03-25T09:00:00"),
  },
  {
    id: "activity-2",
    type: "completed",
    taskId: "task-4",
    userId: "user-2",
    createdAt: new Date("2024-03-29T14:30:00"),
  },
  {
    id: "activity-3",
    type: "assigned",
    taskId: "task-2",
    userId: "user-1",
    newValue: "Mike Brown",
    createdAt: new Date("2024-03-28T10:15:00"),
  },
  {
    id: "activity-4",
    type: "created",
    taskId: "task-7",
    userId: "user-1",
    createdAt: new Date("2024-03-30T08:00:00"),
  },
  {
    id: "activity-5",
    type: "status_changed",
    taskId: "task-3",
    userId: "user-4",
    previousValue: "In Progress",
    newValue: "In Review",
    createdAt: new Date("2024-03-30T11:00:00"),
  },
];

// Helper functions
export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id) ?? getCachedEmployee(id);
}

export function getRoleById(id: string): Role | undefined {
  return roles.find((r) => r.id === id);
}

export function getTaskTypeById(id: string): TaskType | undefined {
  return taskTypes.find((t) => t.id === id);
}

export function getPositionById(id: string): Position | undefined {
  return positions.find((p) => p.id === id);
}

export function getPositionHierarchy(positionId: string): Position[] {
  const hierarchy: Position[] = [];
  let currentPosition = getPositionById(positionId);
  
  while (currentPosition) {
    hierarchy.push(currentPosition);
    if (currentPosition.parentPositionId) {
      currentPosition = getPositionById(currentPosition.parentPositionId);
    } else {
      break;
    }
  }
  
  return hierarchy.reverse(); // Top to bottom
}

export function getDirectReports(positionId: string): Position[] {
  return positions.filter((p) => p.parentPositionId === positionId);
}

export function getUsersByPosition(positionId: string): User[] {
  return users.filter((u) => u.positionIds?.includes(positionId));
}

export function getPositionsForUser(userId: string): Position[] {
  const user = getUserById(userId);
  if (!user || !user.positionIds) return [];
  return user.positionIds
    .map((id) => getPositionById(id))
    .filter((p): p is Position => p !== undefined);
}

export function getUserPointRatio(userId: string): { pointedWorkPercent: number; nonPointedWorkPercent: number } {
  const user = getUserById(userId);
  if (!user) return { pointedWorkPercent: 80, nonPointedWorkPercent: 20 };
  
  // If user has custom ratio, use it
  if (user.customPointRatio) {
    return user.customPointRatio;
  }
  
  // Otherwise use role's ratio
  if (user.roleId) {
    const role = getRoleById(user.roleId);
    if (role) return role.pointRatio;
  }
  
  // Default fallback
  return { pointedWorkPercent: 80, nonPointedWorkPercent: 20 };
}

export function getSpaceById(id: string): Space | undefined {
  return spaces.find((s) => s.id === id);
}

export function getFolderById(id: string): Folder | undefined {
  return folders.find((f) => f.id === id);
}

export function getListById(id: string): List | undefined {
  return lists.find((l) => l.id === id);
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function getTasksByListId(listId: string): Task[] {
  return tasks.filter((t) => t.listId === listId).sort((a, b) => a.order - b.order);
}

export function getTasksByStatusId(statusId: string, listId: string): Task[] {
  return tasks
    .filter((t) => t.statusId === statusId && t.listId === listId)
    .sort((a, b) => a.order - b.order);
}

export function getFoldersBySpaceId(spaceId: string): Folder[] {
  return folders.filter((f) => f.spaceId === spaceId).sort((a, b) => a.order - b.order);
}

export function getListsBySpaceId(spaceId: string): List[] {
  return lists.filter((l) => l.spaceId === spaceId).sort((a, b) => a.order - b.order);
}

export function getListsByFolderId(folderId: string): List[] {
  return lists.filter((l) => l.folderId === folderId).sort((a, b) => a.order - b.order);
}

export function getListsWithoutFolder(spaceId: string): List[] {
  return lists
    .filter((l) => l.spaceId === spaceId && !l.folderId)
    .sort((a, b) => a.order - b.order);
}

export function getStatusById(statusId: string, listId?: string): Status | undefined {
  // First try to find in global statuses (master data)
  const globalStatus = statuses.find((s) => s.id === statusId);
  if (globalStatus) return globalStatus;
  
  // Fallback to list-specific statuses for backward compatibility
  if (listId) {
    const list = getListById(listId);
    return list?.statuses.find((s) => s.id === statusId);
  }
  
  return undefined;
}

export function getTagByName(name: string): Tag | undefined {
  return tags.find((t) => t.name === name);
}
