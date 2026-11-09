"use client";

import { useEffect, useState } from "react";
import { WHATSAPP_LINK } from "@/lib/shop-options";
import {
  Flower2, Lock, User as UserIcon, Phone, Eye, EyeOff, CircleAlert,
  CheckCircle2, Gift, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useView } from "@/lib/panel-store";
import { authRequest, syncFavoritesToServer } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/types";

const inputCls =
  "w-full rounded-2xl border border-input bg-white pr-10 pl-10 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

export default function AuthModal() {
  const open = useView((s) => s.authModalOpen);
  const close = useView((s) => s.closeAuthModal);
  const mode = useView((s) => s.authModalMode);
  const setOpenMode = useView((s) => s.openAuthModal);
  const setUser = useView((s) => s.setUser);

  const [tab, setTab] = useState<"login" | "register">(mode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // adjust internal state when the modal is re-opened with a different mode
  const [prevMode, setPrevMode] = useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setTab(mode);
    setError("");
  }

  function switchTab(t: "login" | "register") {
    setTab(t);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await authRequest(
      tab,
      tab === "login" ? { phone, password } : { name, phone, password }
    );
    setLoading(false);
    if (res.success && res.user) {
      const user: SessionUser = res.user;
      setUser(user);
      useView.getState().closeAuthModal();
      void syncFavoritesToServer();
      window.dispatchEvent(
        new CustomEvent("gh:panel-toast", {
          detail: {
            msg: tab === "login"
              ? `${user.name} عزیز، خوش برگشتید 🌸`
              : "حساب شما ساخته شد! خوش آمدید 🌸",
          },
        })
      );
    } else {
      setError(res.error ?? "خطا در انجام عملیات");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md rounded-3xl bg-cream p-0 overflow-hidden" aria-describedby="auth-desc">
        <div className="relative px-6 pt-6 pb-2">
          <div className="absolute -top-10 -right-10 size-28 rounded-full bg-blush/30 blur-2xl" aria-hidden />
          <div className="text-center">
            <span className="inline-grid place-items-center size-14 rounded-3xl bg-blush text-charcoal shadow-lg shadow-blush/40 mb-2">
              <Flower2 className="size-8" />
            </span>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-xl font-extrabold text-charcoal">
                {tab === "login" ? "ورود به حساب کاربری" : "ساخت حساب جدید"}
              </DialogTitle>
              <DialogDescription id="auth-desc" className="text-center text-xs">
                {tab === "login"
                  ? "به گلستان حافظ خوش آمدید؛ سفارش‌ها و کیف پول شما اینجاست."
                  : "در چند ثانیه عضو گلستان شوید و هدیه خوش‌آمدگی بگیرید."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* tabs */}
        <div className="px-6">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream-dark p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`rounded-xl py-2 text-sm font-bold transition-colors ${
                  tab === t ? "bg-white text-charcoal shadow" : "text-charcoal/60 hover:text-charcoal"
                }`}
              >
                {t === "login" ? "ورود" : "ثبت‌نام"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="p-6 pt-4 space-y-3">
          {tab === "register" && (
            <label className="block">
              <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">نام و نام خانوادگی</span>
              <div className="relative">
                <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputCls} !pl-3.5`}
                  placeholder="مثلاً سارا محمدی"
                  autoComplete="name"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">شماره موبایل</span>
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputCls} !pl-3.5 text-left`}
                dir="ltr"
                inputMode="tel"
                placeholder="09xxxxxxxxx"
                autoComplete="tel"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">رمز عبور</span>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="••••••••"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal transition-colors"
                aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {tab === "login" && (
            <p className="text-[11px] text-muted-foreground leading-6">
              رمز عبور خود را فراموش کرده‌اید؟{" "}
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-bold text-charcoal underline underline-offset-4">
                از طریق واتس‌آپ به پشتیبانی پیام بدهید
              </a>{" "}
              تا رمز جدید برایتان تعیین شود.
            </p>
          )}

          {error && (
            <p className="rounded-2xl bg-[#fbe4e3] text-[#c0392b] text-xs font-bold px-4 py-3 flex items-center gap-2">
              <CircleAlert className="size-4 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-charcoal text-white py-3 text-sm font-extrabold hover:bg-charcoal/85 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {tab === "login" ? "ورود به حساب" : "ساخت حساب و ورود"}
          </button>

          {tab === "register" && (
            <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-gold-soft/60 px-4 py-2.5 text-[11px] font-bold text-gold-dark">
              <Gift className="size-3.5" /> کد تخفیف WELCOME برای اولین سفارش
            </p>
          )}
          {tab === "login" && (
            <p className="flex items-start justify-center gap-1.5 text-[11px] text-muted-foreground leading-5">
              <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-sage-dark" />
              حساب ندارید؟ دکمه «ثبت‌نام» را بزنید؛ در چند ثانیه عضو شوید.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
