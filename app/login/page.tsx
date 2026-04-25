"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api/client";

// ---- Validation Schema ----

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---- Component ----

export default function LoginPage() {
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(
          err.code === "INVALID_CREDENTIALS"
            ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            : err.message
        );
      } else {
        setServerError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-orange-300/40 via-pink-300/40 to-rose-300/30 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-amber-200/50 to-orange-300/40 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-[2rem] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-pink-200/40 to-fuchsia-200/30 blur-3xl" />
        <div className="absolute right-[20%] top-[30%] h-[14rem] w-[14rem] rounded-full bg-yellow-100/30 blur-3xl" />
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between lg:flex">
          <div>
            <div className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-white shadow-lg shadow-orange-500/30">
                <span className="text-lg font-bold">X</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Xiqma</span>
            </div>
            <h2 className="mt-10 text-4xl font-semibold leading-tight tracking-tight text-foreground">
              จัดการงานของทีม
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                ให้เรียบง่ายขึ้น
              </span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              ติดตามงาน บันทึกเวลา และเห็นภาพรวมของทีม ในที่เดียว
            </p>
          </div>

          <ul className="mt-10 space-y-3 text-sm text-muted-foreground">
            {[
              "บันทึกเวลาทำงานจริงของแต่ละงาน",
              "ดูภาพรวมทีมและ workload",
              "ทำงานเป็นทีมบน space ร่วมกัน",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 text-white shadow-lg shadow-orange-500/30">
              <span className="text-xl font-bold">X</span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Xiqma
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              จัดการงานของทีมให้เรียบง่ายขึ้น
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/75 px-7 py-9 shadow-2xl shadow-rose-500/10 backdrop-blur-md dark:border-border/60 dark:bg-card/80 dark:shadow-primary/5">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
                ยินดีต้อนรับกลับ
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                เข้าสู่ระบบเพื่อเริ่มทำงานต่อ
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {serverError}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  {...register("email")}
                  className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    {...register("password")}
                    className={`h-11 pr-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-sm font-medium text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 hover:shadow-orange-500/40"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบของคุณ
          </p>
        </div>
      </div>
    </div>
  );
}
