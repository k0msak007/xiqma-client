"use client";

import { create } from "zustand";
import { spacesApi, type Space } from "@/lib/api/spaces";
import { foldersApi, type Folder } from "@/lib/api/folders";
import { listsApi, type List } from "@/lib/api/lists";
import { toast } from "sonner";

interface WorkspaceStore {
  // Data
  spaces: Space[];
  folders: Folder[];
  lists: List[];

  // UI state
  loading: boolean;
  expandedSpaces: string[];
  expandedFolders: string[];

  // Loaders
  loadWorkspace: () => Promise<void>;
  loadFoldersAndLists: (spaceId: string) => Promise<void>;

  // Sidebar expand/collapse
  toggleSpaceExpanded: (spaceId: string) => void;
  toggleFolderExpanded: (folderId: string) => void;

  // Space CRUD
  createSpace: (payload: { name: string; color?: string; icon?: string }) => Promise<Space | null>;
  deleteSpace: (id: string) => Promise<void>;

  // Folder CRUD
  createFolder: (payload: { name: string; spaceId: string; color?: string }) => Promise<Folder | null>;
  archiveFolder: (id: string) => Promise<void>;
  restoreFolder: (id: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // List CRUD
  createList: (payload: { name: string; spaceId: string; folderId?: string; color?: string }) => Promise<List | null>;
  deleteList: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  spaces: [],
  folders: [],
  lists: [],
  loading: false,
  expandedSpaces: [],
  expandedFolders: [],

  loadWorkspace: async () => {
    set({ loading: true });
    try {
      const spaces = await spacesApi.list();
      set({ spaces, loading: false });

      // Load folders+lists for all spaces in parallel
      await Promise.all(spaces.map((s) => get().loadFoldersAndLists(s.id)));
    } catch {
      set({ loading: false });
      // Silently fail — user might not be logged in yet
    }
  },

  loadFoldersAndLists: async (spaceId: string) => {
    try {
      const [folders, lists] = await Promise.all([
        foldersApi.list(spaceId, true), // include archived
        listsApi.list(spaceId),
      ]);

      set((state) => ({
        folders: [
          ...state.folders.filter((f) => f.spaceId !== spaceId),
          ...folders,
        ],
        lists: [
          ...state.lists.filter((l) => l.spaceId !== spaceId),
          ...lists,
        ],
      }));
    } catch {
      // ignore
    }
  },

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

  // ── Space CRUD ──────────────────────────────────────────────────────────────

  createSpace: async (payload) => {
    try {
      const space = await spacesApi.create(payload);
      set((state) => ({ spaces: [...state.spaces, space] }));
      toast.success(`สร้าง space "${space.name}" สำเร็จ`);
      return space;
    } catch (err: any) {
      toast.error(err?.message ?? "สร้าง space ไม่สำเร็จ");
      return null;
    }
  },

  deleteSpace: async (id) => {
    try {
      await spacesApi.delete(id);
      set((state) => ({
        spaces: state.spaces.filter((s) => s.id !== id),
        folders: state.folders.filter((f) => f.spaceId !== id),
        lists: state.lists.filter((l) => l.spaceId !== id),
      }));
      toast.success("ลบ space สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "ลบ space ไม่สำเร็จ");
    }
  },

  // ── Folder CRUD ─────────────────────────────────────────────────────────────

  createFolder: async (payload) => {
    try {
      const folder = await foldersApi.create(payload);
      set((state) => ({ folders: [...state.folders, folder] }));
      toast.success(`สร้าง folder "${folder.name}" สำเร็จ`);
      return folder;
    } catch (err: any) {
      toast.error(err?.message ?? "สร้าง folder ไม่สำเร็จ");
      return null;
    }
  },

  archiveFolder: async (id) => {
    try {
      const updated = await foldersApi.archive(id);
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updated : f)),
      }));
      toast.success("Archive folder สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "Archive ไม่สำเร็จ");
    }
  },

  restoreFolder: async (id) => {
    try {
      const updated = await foldersApi.restore(id);
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updated : f)),
      }));
      toast.success("Restore folder สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "Restore ไม่สำเร็จ");
    }
  },

  deleteFolder: async (id) => {
    try {
      await foldersApi.delete(id);
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        lists: state.lists.filter((l) => l.folderId !== id),
      }));
      toast.success("ลบ folder สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "ลบ folder ไม่สำเร็จ");
    }
  },

  // ── List CRUD ───────────────────────────────────────────────────────────────

  createList: async (payload) => {
    try {
      const list = await listsApi.create(payload);
      set((state) => ({ lists: [...state.lists, list] }));
      toast.success(`สร้าง list "${list.name}" สำเร็จ`);
      return list;
    } catch (err: any) {
      toast.error(err?.message ?? "สร้าง list ไม่สำเร็จ");
      return null;
    }
  },

  deleteList: async (id) => {
    try {
      await listsApi.delete(id);
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
      }));
      toast.success("ลบ list สำเร็จ");
    } catch (err: any) {
      toast.error(err?.message ?? "ลบ list ไม่สำเร็จ");
    }
  },
}));
