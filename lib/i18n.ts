"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "th";

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "language-storage",
    }
  )
);

// Translation dictionary
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.myTasks": "My Tasks",
    "nav.search": "Search",
    "nav.resources": "Resources",
    "nav.analytics": "Analytics",
    "nav.team": "Team",
    "nav.roles": "Roles",
    "nav.users": "Users",
    "nav.settings": "Settings",
    "nav.profile": "Profile",
    "nav.spaces": "Spaces",
    "nav.archive": "Archive",
    "nav.tools": "Tools",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.create": "Create",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.group": "Group",
    "common.all": "All",
    "common.none": "None",
    "common.yes": "Yes",
    "common.no": "No",
    "common.loading": "Loading...",
    "common.noData": "No data found",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.priority": "Priority",
    "common.assignee": "Assignee",
    "common.dueDate": "Due Date",
    "common.language": "Language",
    "common.english": "English",
    "common.thai": "Thai",

    // Task
    "task.task": "Task",
    "task.tasks": "Tasks",
    "task.taskId": "Task ID",
    "task.taskName": "Task Name",
    "task.taskType": "Task Type",
    "task.description": "Description",
    "task.duration": "Duration",
    "task.planStart": "Plan Start",
    "task.planFinish": "Plan Finish",
    "task.actualStart": "Actual Start",
    "task.actualFinish": "Actual Finish",
    "task.planProgress": "Plan %",
    "task.actualProgress": "Actual %",
    "task.variance": "Variance",
    "task.storyPoints": "Story Points",
    "task.timeEstimate": "Time Estimate",
    "task.timeTracked": "Time Tracked",
    "task.addTask": "Add Task",
    "task.newTask": "New Task",
    "task.noTasks": "No tasks found",

    // Settings
    "settings.settings": "Settings",
    "settings.profile": "Profile",
    "settings.notifications": "Notifications",
    "settings.appearance": "Appearance",
    "settings.workspace": "Workspace",
    "settings.teamManagement": "Team Management",
    "settings.roleManagement": "Role Management",
    "settings.userManagement": "User Management",
    "settings.taskTypes": "Task Types",
    "settings.taskTypeMaster": "Task Type Master",
    "settings.countsForPoints": "Counts for Points",
    "settings.pointRatio": "Point Ratio",
    "settings.permissions": "Permissions",
    "settings.theme": "Theme",
    "settings.dark": "Dark",
    "settings.light": "Light",
    "settings.system": "System",

    // Profile
    "profile.profile": "Profile",
    "profile.profileInfo": "Profile Information",
    "profile.updateDetails": "Update your personal details and profile picture.",
    "profile.fullName": "Full Name",
    "profile.email": "Email",
    "profile.role": "Role",
    "profile.timezone": "Timezone",
    "profile.changePhoto": "Change Photo",
    "profile.security": "Security",
    "profile.password": "Password",
    "profile.changePassword": "Change Password",
    "profile.twoFactor": "Two-Factor Authentication",
    "profile.activeSessions": "Active Sessions",

    // Archive
    "archive.archive": "Archive",
    "archive.archivedFolders": "Archived Folders",
    "archive.moveToArchive": "Move to Archive",
    "archive.restoreFromArchive": "Restore from Archive",
    "archive.noArchived": "No archived folders",

    // Roles & Users
    "roles.createRole": "Create Role",
    "roles.editRole": "Edit Role",
    "roles.roleName": "Role Name",
    "roles.roleDescription": "Role Description",
    "roles.roleColor": "Role Color",
    "roles.deleteRole": "Delete Role",
    "users.createUser": "Create User",
    "users.editUser": "Edit User",
    "users.assignRole": "Assign Role",
    "users.customPointRatio": "Custom Point Ratio",
    "users.useRoleDefault": "Use Role Default",
  },
  th: {
    // Navigation
    "nav.home": "หน้าหลัก",
    "nav.myTasks": "งานของฉัน",
    "nav.search": "ค้นหา",
    "nav.resources": "ทรัพยากร",
    "nav.analytics": "วิเคราะห์",
    "nav.team": "ทีม",
    "nav.roles": "บทบาท",
    "nav.users": "ผู้ใช้",
    "nav.settings": "ตั้งค่า",
    "nav.profile": "โปรไฟล์",
    "nav.spaces": "พื้นที่",
    "nav.archive": "เก็บถาวร",
    "nav.tools": "เครื่องมือ",

    // Common
    "common.save": "บันทึก",
    "common.cancel": "ยกเลิก",
    "common.delete": "ลบ",
    "common.edit": "แก้ไข",
    "common.add": "เพิ่ม",
    "common.create": "สร้าง",
    "common.search": "ค้นหา",
    "common.filter": "กรอง",
    "common.sort": "เรียง",
    "common.group": "จัดกลุ่ม",
    "common.all": "ทั้งหมด",
    "common.none": "ไม่มี",
    "common.yes": "ใช่",
    "common.no": "ไม่",
    "common.loading": "กำลังโหลด...",
    "common.noData": "ไม่พบข้อมูล",
    "common.actions": "การกระทำ",
    "common.status": "สถานะ",
    "common.priority": "ความสำคัญ",
    "common.assignee": "ผู้รับผิดชอบ",
    "common.dueDate": "วันครบกำหนด",
    "common.language": "ภาษา",
    "common.english": "อังกฤษ",
    "common.thai": "ไทย",

    // Task
    "task.task": "งาน",
    "task.tasks": "งาน",
    "task.taskId": "รหัสงาน",
    "task.taskName": "ชื่องาน",
    "task.taskType": "ประเภทงาน",
    "task.description": "รายละเอียด",
    "task.duration": "ระยะเวลา",
    "task.planStart": "เริ่มตามแผน",
    "task.planFinish": "สิ้นสุดตามแผน",
    "task.actualStart": "เริ่มจริง",
    "task.actualFinish": "สิ้นสุดจริง",
    "task.planProgress": "แผน %",
    "task.actualProgress": "จริง %",
    "task.variance": "ส่วนต่าง",
    "task.storyPoints": "คะแนน",
    "task.timeEstimate": "เวลาประเมิน",
    "task.timeTracked": "เวลาที่ใช้",
    "task.addTask": "เพิ่มงาน",
    "task.newTask": "งานใหม่",
    "task.noTasks": "ไม่พบงาน",

    // Settings
    "settings.settings": "ตั้งค่า",
    "settings.profile": "โปรไฟล์",
    "settings.notifications": "การแจ้งเตือน",
    "settings.appearance": "รูปแบบ",
    "settings.workspace": "พื้นที่ทำงาน",
    "settings.teamManagement": "จัดการทีม",
    "settings.roleManagement": "จัดการบทบาท",
    "settings.userManagement": "จัดการผู้ใช้",
    "settings.taskTypes": "ประเภทงาน",
    "settings.taskTypeMaster": "ตั้งค่าประเภทงาน",
    "settings.countsForPoints": "นับคะแนน",
    "settings.pointRatio": "อัตราส่วนคะแนน",
    "settings.permissions": "สิทธิ์",
    "settings.theme": "ธีม",
    "settings.dark": "มืด",
    "settings.light": "สว่าง",
    "settings.system": "ระบบ",

    // Profile
    "profile.profile": "โปรไฟล์",
    "profile.profileInfo": "ข้อมูลโปรไฟล์",
    "profile.updateDetails": "อัพเดทข้อมูลส่วนตัวและรูปโปรไฟล์",
    "profile.fullName": "ชื่อ-นามสกุล",
    "profile.email": "อีเมล",
    "profile.role": "บทบาท",
    "profile.timezone": "เขตเวลา",
    "profile.changePhoto": "เปลี่ยนรูป",
    "profile.security": "ความปลอดภัย",
    "profile.password": "รหัสผ่าน",
    "profile.changePassword": "เปลี่ยนรหัสผ่าน",
    "profile.twoFactor": "ยืนยันตัวตนสองขั้นตอน",
    "profile.activeSessions": "เซสชันที่ใช้งาน",

    // Archive
    "archive.archive": "เก็บถาวร",
    "archive.archivedFolders": "โฟลเดอร์ที่เก็บถาวร",
    "archive.moveToArchive": "ย้ายไปเก็บถาวร",
    "archive.restoreFromArchive": "กู้คืนจากเก็บถาวร",
    "archive.noArchived": "ไม่มีโฟลเดอร์ที่เก็บถาวร",

    // Roles & Users
    "roles.createRole": "สร้างบทบาท",
    "roles.editRole": "แก้ไขบทบาท",
    "roles.roleName": "ชื่อบทบาท",
    "roles.roleDescription": "คำอธิบายบทบาท",
    "roles.roleColor": "สีบทบาท",
    "roles.deleteRole": "ลบบทบาท",
    "users.createUser": "สร้างผู้ใช้",
    "users.editUser": "แก้ไขผู้ใช้",
    "users.assignRole": "กำหนดบทบาท",
    "users.customPointRatio": "อัตราส่วนคะแนนกำหนดเอง",
    "users.useRoleDefault": "ใช้ค่าเริ่มต้นของบทบาท",
  },
};

// Translation hook
export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return { t, language };
}
