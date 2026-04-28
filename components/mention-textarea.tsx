"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface MentionEmployee {
  id:        string;
  name:      string;
  code?:     string | null;
  avatarUrl?: string | null;
  role?:     string | null;
}

interface MentionTextareaProps
  extends Omit<React.ComponentProps<typeof Textarea>, "onChange" | "value"> {
  value:     string;
  onChange:  (next: string) => void;
  employees: MentionEmployee[];
  /** When user picks an employee — also fired (for store of mentioned IDs if needed) */
  onMention?: (emp: MentionEmployee) => void;
}

/**
 * Textarea with @-mention dropdown.
 *
 *   - typing "@" opens a list of employees filtered by token following @
 *   - up/down/Enter/Tab to select, Esc to dismiss
 *   - inserts "@<Name> " into text (matches backend fuzzy resolver)
 *
 * Standalone — no Radix dependencies, just absolute-positioned div anchored to wrapper.
 */
export const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  function MentionTextarea({ value, onChange, employees, onMention, className, onKeyDown, ...rest }, ref) {
    const [open, setOpen]               = React.useState(false);
    const [token, setToken]             = React.useState("");
    const [highlight, setHighlight]     = React.useState(0);
    const [tokenStart, setTokenStart]   = React.useState<number>(-1);

    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current!, []);

    // Filter employees by token
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    const filtered = React.useMemo(() => {
      if (!token) return employees.slice(0, 10);
      const t = norm(token);
      return employees
        .filter((e) => norm(e.name).includes(t) || (e.code && norm(e.code).includes(t)))
        .slice(0, 10);
    }, [employees, token]);

    // Keep highlight in range
    React.useEffect(() => {
      if (highlight >= filtered.length) setHighlight(0);
    }, [filtered.length, highlight]);

    // Detect "@token" before caret on every value change
    const detect = (next: string, caret: number) => {
      const before = next.slice(0, caret);
      const atIdx  = before.lastIndexOf("@");
      if (atIdx === -1) {
        setOpen(false); setToken(""); setTokenStart(-1);
        return;
      }
      // Must be at start or preceded by whitespace
      const prevChar = atIdx > 0 ? before[atIdx - 1] : "";
      if (prevChar && !/\s/.test(prevChar)) {
        setOpen(false); setToken(""); setTokenStart(-1);
        return;
      }
      const candidate = before.slice(atIdx + 1);
      // Token may not contain whitespace — close if user typed space after @
      if (/\s/.test(candidate)) {
        setOpen(false); setToken(""); setTokenStart(-1);
        return;
      }
      setToken(candidate);
      setTokenStart(atIdx);
      setOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      onChange(next);
      detect(next, e.target.selectionStart ?? next.length);
    };

    const insertMention = (emp: MentionEmployee) => {
      const ta = innerRef.current;
      if (!ta) return;
      const caret = ta.selectionStart ?? value.length;
      const start = tokenStart;
      if (start < 0) return;

      // Use display name (no spaces inside token works best for backend resolver).
      // If employee name has spaces, prefer code if available, else name (resolver handles spaces in name via substring).
      const insertText = emp.code || emp.name.replace(/\s+/g, "");
      const before = value.slice(0, start);
      const after  = value.slice(caret);
      const next = `${before}@${insertText} ${after}`;
      onChange(next);
      onMention?.(emp);
      setOpen(false);
      setToken(""); setTokenStart(-1);

      // Restore caret right after the inserted text
      requestAnimationFrame(() => {
        const newPos = start + insertText.length + 2; // "@" + name + space
        ta.setSelectionRange(newPos, newPos);
        ta.focus();
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (open && filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlight((h) => (h + 1) % filtered.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filtered[highlight]!);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          return;
        }
      }
      onKeyDown?.(e);
    };

    return (
      <div className="relative">
        <Textarea
          {...rest}
          ref={innerRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={className}
        />
        {open && filtered.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            role="listbox"
          >
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {token ? `@ ${token}` : "เลือกผู้ใช้"}
            </div>
            {filtered.map((e, i) => (
              <button
                key={e.id}
                type="button"
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  insertMention(e);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={e.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">{e.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{e.name}</span>
                  {e.code && (
                    <span className="font-mono text-[10px] text-muted-foreground">{e.code}</span>
                  )}
                </div>
                {e.role && (
                  <span className="text-[10px] text-muted-foreground">{e.role}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
