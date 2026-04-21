import { create } from "zustand";
import type { Task, NavigationState, ViewType, Space, Folder, List, Role, User, PointRatio, TaskType, HolidaySettings, SpecialHoliday, DayOfWeek, Position, Status, Comment } from "./types";
import { tasks as initialTasks, spaces as initialSpaces, folders as initialFolders, lists as initialLists, roles as initialRoles, users as initialUsers, taskTypes as initialTaskTypes, holidaySettings as initialHolidaySettings, positions as initialPositions, statuses as initialStatuses } from "./mock-data";

interface TaskStore {
  // Data
  tasks: Task[];
  spaces: Space[];
  folders: Folder[];
  lists: List[];
  roles: Role[];
  users: User[];
  taskTypes: TaskType[];
  positions: Position[];
  statuses: Status[];
  holidaySettings: HolidaySettings[];
  
  // Navigation state
  navigation: NavigationState;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  expandedSpaces: string[];
  expandedFolders: string[];
  
  // Actions
  setActiveSpace: (spaceId: string | undefined) => void;
  setActiveFolder: (folderId: string | undefined) => void;
  setActiveList: (listId: string | undefined) => void;
  setActiveTask: (taskId: string | undefined) => void;
  setActiveView: (view: ViewType) => void;
  
  toggleSidebar: () => void;
  toggleSpaceExpanded: (spaceId: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  
  // Task actions
  updateTaskStatus: (taskId: string, statusId: string) => void;
  updateTaskOrder: (taskId: string, newOrder: number, newStatusId?: string) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  
  // Space actions
  addSpace: (space: Space) => void;
  
  // Role actions
  addRole: (role: Role) => void;
  updateRole: (roleId: string, updates: Partial<Role>) => void;
  deleteRole: (roleId: string) => void;
  
  // User actions
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  setUserPointRatio: (userId: string, pointRatio: PointRatio | undefined) => void;
  
  // Task Type actions
  addTaskType: (taskType: TaskType) => void;
  updateTaskType: (taskTypeId: string, updates: Partial<TaskType>) => void;
  deleteTaskType: (taskTypeId: string) => void;
  setTaskTypes: (taskTypes: TaskType[]) => void;
  
  // Folder actions
  archiveFolder: (folderId: string) => void;
  restoreFolder: (folderId: string) => void;
  
  // Position actions
  addPosition: (position: Position) => void;
  updatePosition: (positionId: string, updates: Partial<Position>) => void;
  deletePosition: (positionId: string) => void;
  addUserToPosition: (userId: string, positionId: string) => void;
  removeUserFromPosition: (userId: string, positionId: string) => void;
  
  // Holiday Settings actions
  addHolidayYear: (year: number) => void;
  updateWeekendDays: (year: number, weekendDays: DayOfWeek[]) => void;
  addSpecialHoliday: (year: number, holiday: SpecialHoliday) => void;
  updateSpecialHoliday: (year: number, holidayId: string, updates: Partial<SpecialHoliday>) => void;
  deleteSpecialHoliday: (year: number, holidayId: string) => void;
  
  // Status actions
  addStatus: (status: Status) => void;
  updateStatus: (statusId: string, updates: Partial<Status>) => void;
  deleteStatus: (statusId: string) => void;
  reorderStatuses: (orderedStatusIds: string[]) => void;
  
  // Comment actions
  addComment: (taskId: string, comment: Comment) => void;
  updateComment: (taskId: string, commentId: string, content: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
  
  // Bulk actions
  reorderTasks: (listId: string, statusId: string, orderedTaskIds: string[]) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  // Initial data
  tasks: initialTasks,
  spaces: initialSpaces,
  folders: initialFolders,
  lists: initialLists,
  roles: initialRoles,
  users: initialUsers,
  taskTypes: initialTaskTypes,
  positions: initialPositions,
  statuses: initialStatuses,
  holidaySettings: initialHolidaySettings,
  
  // Initial navigation
  navigation: {
    activeSpaceId: "space-1",
    activeListId: "list-1",
    activeView: "board",
  },
  
  // Initial sidebar state
  sidebarCollapsed: false,
  expandedSpaces: ["space-1"],
  expandedFolders: ["folder-1"],
  
  // Navigation actions
  setActiveSpace: (spaceId) =>
    set((state) => ({
      navigation: { ...state.navigation, activeSpaceId: spaceId, activeFolderId: undefined, activeListId: undefined },
    })),
    
  setActiveFolder: (folderId) =>
    set((state) => ({
      navigation: { ...state.navigation, activeFolderId: folderId },
    })),
    
  setActiveList: (listId) =>
    set((state) => ({
      navigation: { ...state.navigation, activeListId: listId, activeTaskId: undefined },
    })),
    
  setActiveTask: (taskId) =>
    set((state) => ({
      navigation: { ...state.navigation, activeTaskId: taskId },
    })),
    
  setActiveView: (view) =>
    set((state) => ({
      navigation: { ...state.navigation, activeView: view },
    })),
    
  // Sidebar actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    
  toggleSpaceExpanded: (spaceId) =>
    set((state) => ({
      expandedSpaces: state.expandedSpaces.includes(spaceId)
        ? state.expandedSpaces.filter((id) => id !== spaceId)
        : [...state.expandedSpaces, spaceId],
    })),
    
  toggleFolderExpanded: (folderId) =>
    set((state) => ({
      expandedFolders: state.expandedFolders.includes(folderId)
        ? state.expandedFolders.filter((id) => id !== folderId)
        : [...state.expandedFolders, folderId],
    })),
    
  // Task actions
  updateTaskStatus: (taskId, statusId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, statusId, updatedAt: new Date() }
          : task
      ),
    })),
    
  updateTaskOrder: (taskId, newOrder, newStatusId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              order: newOrder,
              ...(newStatusId && { statusId: newStatusId }),
              updatedAt: new Date(),
            }
          : task
      ),
    })),
    
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
    
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      ),
    })),
    
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
    
  addSpace: (space) =>
    set((state) => ({
      spaces: [...state.spaces, space],
      expandedSpaces: [...state.expandedSpaces, space.id],
    })),
    
  // Role actions
  addRole: (role) =>
    set((state) => ({
      roles: [...state.roles, role],
    })),
    
  updateRole: (roleId, updates) =>
    set((state) => ({
      roles: state.roles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role
      ),
    })),
    
  deleteRole: (roleId) =>
    set((state) => ({
      roles: state.roles.filter((role) => role.id !== roleId),
    })),
    
  // User actions
  addUser: (user) =>
    set((state) => ({
      users: [...state.users, user],
    })),
    
  updateUser: (userId, updates) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, ...updates } : user
      ),
    })),
    
  deleteUser: (userId) =>
    set((state) => ({
      users: state.users.filter((user) => user.id !== userId),
    })),
    
  setUserPointRatio: (userId, pointRatio) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, customPointRatio: pointRatio } : user
      ),
    })),
    
  // Task Type actions
  addTaskType: (taskType) =>
    set((state) => ({
      taskTypes: [...state.taskTypes, taskType],
    })),
    
  updateTaskType: (taskTypeId, updates) =>
    set((state) => ({
      taskTypes: state.taskTypes.map((tt) =>
        tt.id === taskTypeId ? { ...tt, ...updates } : tt
      ),
    })),
    
  deleteTaskType: (taskTypeId) =>
    set((state) => ({
      taskTypes: state.taskTypes.filter((tt) => tt.id !== taskTypeId),
    })),

  setTaskTypes: (taskTypes) => set({ taskTypes }),
    
  // Folder actions
  archiveFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId ? { ...folder, archived: true, archivedAt: new Date() } : folder
      ),
    })),
    
  restoreFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId ? { ...folder, archived: false, archivedAt: undefined } : folder
      ),
    })),
    
  // Position actions
  addPosition: (position) =>
    set((state) => ({
      positions: [...state.positions, position],
    })),
    
  updatePosition: (positionId, updates) =>
    set((state) => ({
      positions: state.positions.map((pos) =>
        pos.id === positionId ? { ...pos, ...updates } : pos
      ),
    })),
    
  deletePosition: (positionId) =>
    set((state) => ({
      positions: state.positions.filter((pos) => pos.id !== positionId),
      // Also remove positionId from users' positionIds array
      users: state.users.map((user) => ({
        ...user,
        positionIds: user.positionIds?.filter((id) => id !== positionId),
      })),
    })),
    
  addUserToPosition: (userId, positionId) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId
          ? { ...user, positionIds: [...(user.positionIds || []), positionId] }
          : user
      ),
    })),
    
  removeUserFromPosition: (userId, positionId) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId
          ? { ...user, positionIds: user.positionIds?.filter((id) => id !== positionId) }
          : user
      ),
    })),
    
  // Holiday Settings actions
  addHolidayYear: (year) =>
    set((state) => {
      // Check if year already exists
      if (state.holidaySettings.some((hs) => hs.year === year)) {
        return state;
      }
      const newSettings: HolidaySettings = {
        year,
        weekendDays: [0, 6] as DayOfWeek[], // Default to Sunday and Saturday
        specialHolidays: [],
      };
      return { holidaySettings: [...state.holidaySettings, newSettings].sort((a, b) => a.year - b.year) };
    }),
    
  updateWeekendDays: (year, weekendDays) =>
    set((state) => ({
      holidaySettings: state.holidaySettings.map((hs) =>
        hs.year === year ? { ...hs, weekendDays } : hs
      ),
    })),
    
  addSpecialHoliday: (year, holiday) =>
    set((state) => ({
      holidaySettings: state.holidaySettings.map((hs) =>
        hs.year === year
          ? { ...hs, specialHolidays: [...hs.specialHolidays, holiday] }
          : hs
      ),
    })),
    
  updateSpecialHoliday: (year, holidayId, updates) =>
    set((state) => ({
      holidaySettings: state.holidaySettings.map((hs) =>
        hs.year === year
          ? {
              ...hs,
              specialHolidays: hs.specialHolidays.map((h) =>
                h.id === holidayId ? { ...h, ...updates } : h
              ),
            }
          : hs
      ),
    })),
    
  deleteSpecialHoliday: (year, holidayId) =>
    set((state) => ({
      holidaySettings: state.holidaySettings.map((hs) =>
        hs.year === year
          ? { ...hs, specialHolidays: hs.specialHolidays.filter((h) => h.id !== holidayId) }
          : hs
      ),
    })),
    
  reorderTasks: (listId, statusId, orderedTaskIds) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.listId !== listId) return task;
        const newIndex = orderedTaskIds.indexOf(task.id);
        if (newIndex === -1) return task;
        return {
          ...task,
          order: newIndex,
          statusId: statusId,
          updatedAt: new Date(),
        };
      }),
    })),
    
  // Status actions
  addStatus: (status) =>
    set((state) => ({
      statuses: [...state.statuses, status].sort((a, b) => a.order - b.order),
    })),
    
  updateStatus: (statusId, updates) =>
    set((state) => ({
      statuses: state.statuses.map((status) =>
        status.id === statusId ? { ...status, ...updates } : status
      ),
    })),
    
  deleteStatus: (statusId) =>
    set((state) => ({
      statuses: state.statuses.filter((status) => status.id !== statusId),
    })),
    
  reorderStatuses: (orderedStatusIds) =>
    set((state) => ({
      statuses: state.statuses.map((status) => {
        const newOrder = orderedStatusIds.indexOf(status.id);
        return newOrder !== -1 ? { ...status, order: newOrder } : status;
      }).sort((a, b) => a.order - b.order),
    })),
    
  // Comment actions
  addComment: (taskId, comment) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, comment], updatedAt: new Date() }
          : task
      ),
    })),
    
  updateComment: (taskId, commentId, content) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: task.comments.map((c) =>
                c.id === commentId ? { ...c, content, updatedAt: new Date() } : c
              ),
              updatedAt: new Date(),
            }
          : task
      ),
    })),
    
  deleteComment: (taskId, commentId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, comments: task.comments.filter((c) => c.id !== commentId), updatedAt: new Date() }
          : task
      ),
    })),
}));
