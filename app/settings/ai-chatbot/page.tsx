"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface LineBotConfig {
  enabled: boolean;
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl: string;
  verified: boolean;
}

export default function AIChatbotPage() {
  const { language } = useTranslation();
  
  // Line Bot configuration
  const [lineConfig, setLineConfig] = useState<LineBotConfig>({
    enabled: false,
    channelAccessToken: "",
    channelSecret: "",
    webhookUrl: typeof window !== "undefined" ? `${window.location.origin}/api/line/webhook` : "",
    verified: false,
  });
  
  // UI state
  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };
  
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(lineConfig.webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };
  
  const maskToken = (token: string) => {
    if (!token) return "";
    if (token.length <= 8) return "••••••••";
    return token.substring(0, 4) + "••••••••" + token.substring(token.length - 4);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === "th" ? "AI Chatbot Setup" : "AI Chatbot Setup"}
            </h1>
            <p className="text-muted-foreground">
              {language === "th" 
                ? "ตั้งค่า API Token สำหรับเชื่อมต่อ Line และ Chatbot อื่นๆ" 
                : "Configure API tokens for Line and other chatbot integrations"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving 
            ? (language === "th" ? "กำลังบันทึก..." : "Saving...") 
            : (language === "th" ? "บันทึก" : "Save")}
        </Button>
      </header>

      {/* Line Messaging API */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Line Messaging API
                  {lineConfig.verified && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {language === "th" ? "เชื่อมต่อแล้ว" : "Connected"}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {language === "th" 
                    ? "เชื่อมต่อกับ Line Official Account เพื่อส่งการแจ้งเตือนและโต้ตอบกับทีม" 
                    : "Connect to Line Official Account for notifications and team interactions"}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={lineConfig.enabled}
              onCheckedChange={(enabled) => setLineConfig(prev => ({ ...prev, enabled }))}
            />
          </div>
        </CardHeader>
        
        {lineConfig.enabled && (
          <CardContent className="space-y-6">
            {/* Setup Instructions */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {language === "th" ? "วิธีตั้งค่า Line Messaging API" : "How to set up Line Messaging API"}
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>
                  {language === "th" ? "ไปที่ " : "Go to "}
                  <a 
                    href="https://developers.line.biz/console/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    Line Developers Console
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>{language === "th" ? "สร้าง Provider และ Channel (Messaging API)" : "Create a Provider and Channel (Messaging API)"}</li>
                <li>{language === "th" ? "คัดลอก Channel Access Token และ Channel Secret" : "Copy the Channel Access Token and Channel Secret"}</li>
                <li>{language === "th" ? "วาง Webhook URL ด้านล่างในการตั้งค่า Channel" : "Paste the Webhook URL below in your Channel settings"}</li>
              </ol>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label>{language === "th" ? "Webhook URL" : "Webhook URL"}</Label>
              <div className="flex gap-2">
                <Input 
                  value={lineConfig.webhookUrl}
                  readOnly
                  className="font-mono text-sm bg-muted"
                />
                <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                  {copiedWebhook ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "th" 
                  ? "คัดลอก URL นี้ไปวางในการตั้งค่า Webhook ของ Line Channel" 
                  : "Copy this URL to your Line Channel webhook settings"}
              </p>
            </div>

            {/* Channel Access Token */}
            <div className="space-y-2">
              <Label htmlFor="channelAccessToken">
                Channel Access Token <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    id="channelAccessToken"
                    type={showToken ? "text" : "password"}
                    value={lineConfig.channelAccessToken}
                    onChange={(e) => setLineConfig(prev => ({ ...prev, channelAccessToken: e.target.value }))}
                    placeholder="Enter your Channel Access Token"
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "th" 
                  ? "พบได้ใน Line Developers Console > Channel > Messaging API > Channel access token" 
                  : "Found in Line Developers Console > Channel > Messaging API > Channel access token"}
              </p>
            </div>

            {/* Channel Secret */}
            <div className="space-y-2">
              <Label htmlFor="channelSecret">
                Channel Secret <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    id="channelSecret"
                    type={showSecret ? "text" : "password"}
                    value={lineConfig.channelSecret}
                    onChange={(e) => setLineConfig(prev => ({ ...prev, channelSecret: e.target.value }))}
                    placeholder="Enter your Channel Secret"
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "th" 
                  ? "พบได้ใน Line Developers Console > Channel > Basic settings > Channel secret" 
                  : "Found in Line Developers Console > Channel > Basic settings > Channel secret"}
              </p>
            </div>

            {/* Connection Status */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {lineConfig.channelAccessToken && lineConfig.channelSecret ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {lineConfig.channelAccessToken && lineConfig.channelSecret
                        ? (language === "th" ? "พร้อมเชื่อมต่อ" : "Ready to connect")
                        : (language === "th" ? "ยังไม่ได้ตั้งค่า" : "Not configured")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lineConfig.channelAccessToken && lineConfig.channelSecret
                        ? (language === "th" ? "กรุณาบันทึกเพื่อเริ่มใช้งาน" : "Please save to activate")
                        : (language === "th" ? "กรุณากรอก Token และ Secret" : "Please enter Token and Secret")}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  disabled={!lineConfig.channelAccessToken || !lineConfig.channelSecret}
                >
                  {language === "th" ? "ทดสอบการเชื่อมต่อ" : "Test Connection"}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">
            {language === "th" ? "การเชื่อมต่ออื่นๆ (เร็วๆ นี้)" : "Other Integrations (Coming Soon)"}
          </CardTitle>
          <CardDescription>
            {language === "th" 
              ? "รองรับ Slack, Microsoft Teams, Discord และอื่นๆ ในอนาคต" 
              : "Support for Slack, Microsoft Teams, Discord and more coming soon"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
              <span className="text-lg font-bold text-muted-foreground">S</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
              <span className="text-lg font-bold text-muted-foreground">T</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
              <span className="text-lg font-bold text-muted-foreground">D</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
