"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Bell, Palette, Globe, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/auth-store";
import { useEmployee } from "@/hooks/use-employee";
import { employeesApi, type EmployeeDetail } from "@/lib/api/employees";
import { useTranslation, useLanguageStore, type Language } from "@/lib/i18n";
import { toast } from "sonner";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword:     z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
  confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { user } = useAuthStore();

  const { uploadAvatar, changePassword: apiChangePassword } = useEmployee({
    employeeId: user?.id ?? "",
  });

  // ─── Real employee data ────────────────────────────────────────────────────
  const [profile, setProfile] = useState<EmployeeDetail | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setIsLoadingProfile(true);
    employeesApi.get(user.id)
      .then(setProfile)
      .catch(() => toast.error("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ"))
      .finally(() => setIsLoadingProfile(false));
  }, [user?.id]);

  // ─── Avatar ────────────────────────────────────────────────────────────────
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading,   setIsUploading]   = useState(false);

  // ─── Password modal ────────────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  // ─── Notification toggles (local UI state) ────────────────────────────────
  const [notifications, setNotifications] = useState({
    email:         true,
    desktop:       true,
    taskAssigned:  true,
    taskCompleted: false,
    mentions:      true,
    weeklyDigest:  true,
  });

  // ─── Display values ───────────────────────────────────────────────────────
  const displayName   = profile?.name  ?? user?.name  ?? "—";
  const displayEmail  = profile?.email ?? user?.email ?? "—";
  const displayAvatar = avatarPreview  ?? profile?.avatarUrl ?? undefined;
  const displayRole   = profile?.positionName ?? profile?.roleName ?? profile?.role ?? "—";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("profile.profile")}</h1>
        <p className="text-muted-foreground">{t("profile.updateDetails")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile"      className="gap-2"><User   className="h-4 w-4" />{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell   className="h-4 w-4" />{t("settings.notifications")}</TabsTrigger>
          <TabsTrigger value="appearance"    className="gap-2"><Palette className="h-4 w-4" />{t("settings.appearance")}</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.profileInfo")}</CardTitle>
                <CardDescription>{t("profile.updateDetails")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={displayAvatar} />
                    <AvatarFallback className="text-2xl">
                      {displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("ไฟล์ใหญ่เกินไป สูงสุด 5MB");
                          return;
                        }
                        setIsUploading(true);
                        try {
                          setAvatarPreview(URL.createObjectURL(file));
                          await uploadAvatar(file);
                          toast.success("อัปโหลดรูปโปรไฟล์สำเร็จ");
                          // refresh profile
                          if (user?.id) {
                            const updated = await employeesApi.get(user.id);
                            setProfile(updated);
                          }
                        } catch {
                          setAvatarPreview(null);
                          toast.error("อัปโหลดไม่สำเร็จ");
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                    <Button
                      variant="outline" size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("common.uploading")}</>
                      ) : (
                        t("profile.changePhoto")
                      )}
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
                  </div>
                </div>

                <Separator />

                {/* Form fields */}
                {isLoadingProfile ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading profile…
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("profile.fullName")}</Label>
                      <Input id="name" defaultValue={displayName} readOnly className="bg-muted/30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("profile.email")}</Label>
                      <Input id="email" type="email" defaultValue={displayEmail} readOnly className="bg-muted/30" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">{t("profile.role")}</Label>
                      <Input id="role" defaultValue={displayRole} readOnly className="bg-muted/30" />
                    </div>
                    {profile?.department && (
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input defaultValue={profile.department} readOnly className="bg-muted/30" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="employeeCode">Employee Code</Label>
                      <Input id="employeeCode" defaultValue={profile?.employeeCode ?? "—"} readOnly className="bg-muted/30 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">{t("profile.timezone")}</Label>
                      <Select defaultValue="utc+7">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                          <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                          <SelectItem value="utc+0">UTC</SelectItem>
                          <SelectItem value="utc+7">Bangkok (UTC+7)</SelectItem>
                          <SelectItem value="utc+9">Tokyo (UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Language */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t("common.language")}
                  </Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="th">ไทย (Thai)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.security")}</CardTitle>
                <CardDescription>Manage your password and security settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("profile.password")}</p>
                    <p className="text-sm text-muted-foreground">Keep your account secure</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                    {t("profile.changePassword")}
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("profile.twoFactor")}</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("profile.activeSessions")}</p>
                    <p className="text-sm text-muted-foreground">Manage your active sessions</p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Notifications Tab ────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
              <CardDescription>Choose how and when you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  {(["email", "desktop"] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{key} Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {key === "email" ? "Receive notifications via email" : "Show browser notifications"}
                        </p>
                      </div>
                      <Switch
                        checked={notifications[key]}
                        onCheckedChange={(v) => setNotifications({ ...notifications, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-medium">Activity Notifications</h3>
                <div className="space-y-4">
                  {(["taskAssigned", "taskCompleted", "mentions", "weeklyDigest"] as const).map((key) => {
                    const labels: Record<typeof key, [string, string]> = {
                      taskAssigned:  ["Task Assigned",  "When someone assigns you a task"],
                      taskCompleted: ["Task Completed", "When tasks you're watching are completed"],
                      mentions:      ["Mentions",        "When someone mentions you in a comment"],
                      weeklyDigest:  ["Weekly Digest",   "Get a weekly summary of your tasks"],
                    };
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{labels[key][0]}</p>
                          <p className="text-sm text-muted-foreground">{labels[key][1]}</p>
                        </div>
                        <Switch
                          checked={notifications[key]}
                          onCheckedChange={(v) => setNotifications({ ...notifications, [key]: v })}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance Tab ────────────────────────────────────────────────── */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.appearance")}</CardTitle>
              <CardDescription>Customize how the app looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t("settings.theme")}</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="cursor-pointer rounded-lg border-2 border-primary p-3 text-center">
                    <div className="mb-2 h-8 rounded bg-zinc-900" />
                    <span className="text-sm font-medium">{t("settings.dark")}</span>
                  </div>
                  <div className="cursor-pointer rounded-lg border p-3 text-center hover:border-primary">
                    <div className="mb-2 h-8 rounded bg-white border" />
                    <span className="text-sm font-medium">{t("settings.light")}</span>
                  </div>
                  <div className="cursor-pointer rounded-lg border p-3 text-center hover:border-primary">
                    <div className="mb-2 flex h-8 rounded overflow-hidden">
                      <div className="w-1/2 bg-white" />
                      <div className="w-1/2 bg-zinc-900" />
                    </div>
                    <span className="text-sm font-medium">{t("settings.system")}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  {["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"].map((c) => (
                    <button key={c} className="h-8 w-8 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all hover:ring-primary" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Task IDs</p>
                  <p className="text-sm text-muted-foreground">Display task identifiers</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Password Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.changePassword")}</DialogTitle>
            <DialogDescription>
              กรุณากรอกรหัสผ่านใหม่ รหัสผ่านจะถูกเปลี่ยนและคุณจะถูก logout จากอุปกรณ์อื่นทั้งหมด
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handlePasswordSubmit(async (data) => {
              try {
                await apiChangePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
                toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
                setShowPasswordModal(false);
                resetPasswordForm();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
              }
            })}
            className="space-y-4"
          >
            {(["currentPassword","newPassword","confirmPassword"] as const).map((field) => {
              const labels: Record<typeof field, string> = {
                currentPassword: t("profile.currentPassword"),
                newPassword:     t("profile.newPassword"),
                confirmPassword: t("profile.confirmPassword"),
              };
              return (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{labels[field]}</Label>
                  <Input id={field} type="password" {...registerPassword(field)} />
                  {passwordErrors[field] && (
                    <p className="text-sm text-red-500">{passwordErrors[field]?.message}</p>
                  )}
                </div>
              );
            })}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("profile.changePassword")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
