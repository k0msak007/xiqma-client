"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { aiApi } from "@/lib/api/ai";
import { useAuthStore } from "@/lib/auth-store";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export function AiChatFAB() {
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === "admin" || user?.role === "manager";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isManagerOrAdmin) return null;

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const result = await aiApi.ask({ question: q });
      setMessages((prev) => [...prev, { role: "ai", text: result.answer ?? "ขออภัย ไม่มีคำตอบ" }]);
    } catch (err: any) {
      toast.error(err?.message ?? "ไม่สามารถตอบคำถามได้");
      setMessages((prev) => [...prev, { role: "ai", text: "ขออภัย เกิดข้อผิดพลาด — ลองถามใหม่" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white",
          "hover:scale-105 hover:shadow-xl",
          open && "scale-90 opacity-0 pointer-events-none",
        )}
        title="ถาม Xiqma AI"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Chat dialog */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[380px] flex-col rounded-xl border border-border/60 bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 rounded-t-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">ถาม Xiqma AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-3
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-border/40"
            style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border) / 0.4) transparent" }}
          >
            <div className="flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-6 w-6 opacity-30" />
                  <p>ถามอะไรเกี่ยวกับงานในระบบได้เลย</p>
                  <p className="mt-1 opacity-60">เช่น &quot;Jane ทำงานอะไรเสร็จบ้างสัปดาห์นี้&quot;</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "self-end bg-primary text-primary-foreground"
                      : "self-start bg-muted text-foreground",
                  )}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="self-start rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  กำลังคิด...
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ถามอะไรก็ได้..."
              disabled={loading}
              className="flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={send}
              disabled={loading || !input.trim()}
              className="h-8 w-8 shrink-0 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
