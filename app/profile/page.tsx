"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Palette,
  Globe,
} from "lucide-react";
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
import { users } from "@/lib/mock-data";
import { useTranslation, useLanguageStore, type Language } from "@/lib/i18n";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const currentUser = users[0]; // Alex Johnson (admin)
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    taskAssigned: true,
    taskCompleted: false,
    mentions: true,
    weeklyDigest: true,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("profile.profile")}</h1>
        <p className="text-muted-foreground">
          {t("profile.updateDetails")}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            {t("settings.profile")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {t("settings.notifications")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            {t("settings.appearance")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.profileInfo")}</CardTitle>
                <CardDescription>
                  {t("profile.updateDetails")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback className="text-2xl">
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      {t("profile.changePhoto")}
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("profile.fullName")}</Label>
                    <Input id="name" defaultValue={currentUser.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("profile.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={currentUser.email}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t("profile.role")}</Label>
                    <Input
                      id="role"
                      defaultValue="Product Manager"
                      placeholder="Your job title"
                    />
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

                <Separator />

                {/* Language Setting */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t("common.language")}
                  </Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="th">ไทย (Thai)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.security")}</CardTitle>
                <CardDescription>
                  Manage your password and security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("profile.password")}</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed 30 days ago
                    </p>
                  </div>
                  <Button variant="outline">{t("profile.changePassword")}</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("profile.twoFactor")}</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("profile.activeSessions")}</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your active sessions
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channels */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Desktop Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Show browser notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.desktop}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, desktop: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity Notifications */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Activity Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Task Assigned</p>
                      <p className="text-sm text-muted-foreground">
                        When someone assigns you a task
                      </p>
                    </div>
                    <Switch
                      checked={notifications.taskAssigned}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, taskAssigned: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Task Completed</p>
                      <p className="text-sm text-muted-foreground">
                        When tasks you&apos;re watching are completed
                      </p>
                    </div>
                    <Switch
                      checked={notifications.taskCompleted}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, taskCompleted: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mentions</p>
                      <p className="text-sm text-muted-foreground">
                        When someone mentions you in a comment
                      </p>
                    </div>
                    <Switch
                      checked={notifications.mentions}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, mentions: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly summary of your tasks
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weeklyDigest: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.appearance")}</CardTitle>
              <CardDescription>
                Customize how the app looks and feels.
              </CardDescription>
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
                  {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map(
                    (color) => (
                      <button
                        key={color}
                        className="h-8 w-8 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all hover:ring-primary focus:ring-primary"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing and padding
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Task IDs</p>
                  <p className="text-sm text-muted-foreground">
                    Display task identifiers
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
