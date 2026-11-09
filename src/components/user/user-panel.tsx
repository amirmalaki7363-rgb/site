"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Flower2, LayoutDashboard, Package, Heart, MapPin, Wallet, Ticket, Star, Bell,
  Settings, Shield, LogOut, Store, ArrowLeft, ChevronLeft, Sparkles, TrendingUp,
  ShoppingBag, CheckCircle2, CircleAlert, LifeBuoy, Lock, User as UserIcon,
  Phone, Eye, EyeOff, Gift, Loader2,
} from "lucide-react";
import { PanelContext, usePanel, type PanelCtx } from "@/components/panel/panel-context";
import { PanelSkeleton, StatusBadge, PanelStat } from "@/components/panel/shared";
import { fetchPanelData } from "@/lib/panel-api";
import { useView } from "@/lib/panel-store";
import { authLogout, authRequest, syncFavoritesToServer } from "@/lib/auth-client";
import type { PanelData } from "@/lib/types";
import { WHATSAPP_NUMBER } from "@/lib/shop-options";
import { faPrice, faNumber, faRelative, faDate } from "@/lib/format";
import OrdersSection from "@/components/user/user-orders";
import { FavoritesSection, AddressesSection, WalletSection, CouponsSection } from "@/components/user/user-shop";
import { MyReviewsSection, NotificationsSection, ProfileSection, SecuritySection } from "@/components/user/user-account";
import SupportSection from "@/components/user/user-support";

const NAV = [
  { key: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { key: "orders", label: "سفارش‌های من", icon: Package },
  { key: "favorites", label: "علاقه‌مندی‌ها", icon: Heart },
  { key: "addresses", label: "آدرس‌های من", icon: MapPin },
  { key: "wallet", label: "کیف پول", icon: Wallet },
  { key: "coupons", label: "کدهای تخفیف", icon: Ticket },
  { key: "reviews", label: "نظرات من", icon: Star },
  { key: "notifications", label: "اعلان‌ها", icon: Bell },
  { key: "support", label: "پشتیبانی", icon: LifeBuoy },
  { key: "profile", label: "اطلاعات حساب", icon: Settings },
  { key: "security", label: "امنیت", icon: Shield },
] as const;

const AVATAR_COLORS = ["#e8b4b8", "#a8c5a0", "#d4a574", "#b8a7d9", "#8fb8d9"];

// ==================== Auth Screen (login / register) ====================
const authInputCls =
  "w-full rounded-2xl border border-input bg-white pr-10 pl-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

export function AuthScreen() {
  const setView = useView((s) => s.setView);
  const setUser = useView((s) => s.setUser);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setUser(res.user);
      void syncFavoritesToServer();
      setView("user");
      window.dispatchEvent(
        new CustomEvent("gh:panel-toast", {
          detail: { msg: tab === "login" ? `${res.user.name} عزیز، خوش برگشتید 🌸` : "حساب شما ساخته شد! خوش آمدید 🌸" },
        })
      );
    } else {
      setError(res.error ?? "خطا در انجام عملیات");
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-blush/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-sage/30 blur-3xl" aria-hidden />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center size-16 rounded-3xl bg-blush text-charcoal shadow-lg shadow-blush/40 mb-3">
            <Flower2 className="size-9" />
          </span>
          <h1 className="text-2xl font-extrabold text-charcoal">پنل کاربری گلستان حافظ</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "login" ? "برای مدیریت سفارش‌ها و کیف پول، وارد حساب شوید" : "در چند ثانیه عضو شوید و هدیه بگیرید"}
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-border p-6 shadow-[0_8px_40px_rgba(44,44,44,0.08)]">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream-dark p-1 mb-5">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(""); }}
                className={`rounded-xl py-2 text-sm font-bold transition-colors ${
                  tab === t ? "bg-white text-charcoal shadow" : "text-charcoal/60 hover:text-charcoal"
                }`}
              >
                {t === "login" ? "ورود" : "ثبت‌نام"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {tab === "register" && (
              <label className="block">
                <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">نام و نام خانوادگی</span>
                <div className="relative">
                  <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input value={name} onChange={(e) => setName(e.target.value)} className={authInputCls} placeholder="مثلاً سارا محمدی" autoComplete="name" />
                </div>
              </label>
            )}
            <label className="block">
              <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">شماره موبایل</span>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${authInputCls} text-left`} dir="ltr" inputMode="tel" placeholder="09xxxxxxxxx" autoComplete="tel" />
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
                  className={`${authInputCls} !pl-10`}
                  placeholder="••••••••"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal" aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

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
              {tab === "login" ? "ورود به پنل کاربری" : "ساخت حساب و ورود"}
            </button>

            {tab === "register" && (
              <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-gold-soft/60 px-4 py-2.5 text-[11px] font-bold text-gold-dark">
                <Gift className="size-3.5" /> کد تخفیف WELCOME برای اولین سفارش
              </p>
            )}
          </form>
        </div>

        <button
          onClick={() => setView("shop")}
          className="mt-4 w-full text-center text-xs font-bold text-charcoal/60 hover:text-charcoal transition-colors"
        >
          ← بازگشت به فروشگاه
        </button>
      </div>
    </div>
  );
}

// ==================== Overview ====================
function Overview({ goto }: { goto: (s: string) => void }) {
  const { data } = usePanel();
  const setView = useView((s) => s.setView);

  const myOrders = data.orders;
  const activeOrders = myOrders.filter((o) => ["pending", "confirmed", "preparing", "shipped"].includes(o.status));
  const unreadNotifs = data.notifications.filter((n) => !n.isRead).length;
  const points = data.profile.points;
  const tier = points >= 2000 ? "طلایی" : points >= 500 ? "نقره‌ای" : "برنزی";
  const nextTier = points >= 2000 ? null : points >= 500 ? 2000 : 500;
  const progress = nextTier ? Math.min(100, Math.round((points / nextTier) * 100)) : 100;

  return (
    <div className="space-y-6">
      {/* welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blush via-blush-soft to-cream p-6 sm:p-8">
        <div className="absolute -top-8 -left-8 size-32 rounded-full bg-white/40 blur-2xl" aria-hidden />
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="grid place-items-center size-16 rounded-full text-2xl font-extrabold text-white shadow-lg shrink-0"
            style={{ background: AVATAR_COLORS[data.profile.avatarHue % AVATAR_COLORS.length] }}
          >
            {data.profile.name.charAt(0)}
          </span>
          <div className="flex-1 min-w-[180px]">
            <p className="text-sm text-charcoal/70">سلام</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal">{data.profile.name} عزیز، خوش آمدید 🌸</h1>
            <p className="text-xs text-charcoal/60 mt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 font-bold">
                <Sparkles className="size-3 text-gold-dark" /> عضویت {tier}
              </span>
              <span>عضو گلستان از {faDate(data.profile.memberSince)}</span>
            </p>
          </div>
          <button
            onClick={() => setView("shop")}
            className="inline-flex items-center gap-2 rounded-full bg-charcoal text-white px-5 py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors shrink-0"
          >
            <ShoppingBag className="size-4" /> خرید گل جدید
          </button>
        </div>
        {/* membership progress */}
        <div className="mt-6 bg-white/70 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal/70 mb-2">
            <span className="flex items-center gap-1"><TrendingUp className="size-3.5 text-sage-dark" /> باشگاه مشتریان — {faNumber(points)} امتیاز</span>
            <span>{nextTier ? `${faNumber(nextTier - points)} امتیاز تا سطح بعدی` : "بالاترین سطح ممکن"}</span>
          </div>
          <div className="h-2.5 rounded-full bg-cream-dark overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-l from-gold to-blush-dark transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PanelStat icon={<Package className="size-5" />} label="کل سفارش‌ها" value={faNumber(myOrders.length)} tone="charcoal" />
        <PanelStat icon={<ShoppingBag className="size-5" />} label="سفارش‌های جاری" value={faNumber(activeOrders.length)} sub="در مسیر آماده‌سازی و ارسال" tone="blush" />
        <PanelStat icon={<Wallet className="size-5" />} label="کیف پول" value={faPrice(data.profile.walletBalance)} tone="sage" />
        <PanelStat icon={<Star className="size-5" />} label="امتیاز باشگاه" value={faNumber(points)} sub={`سطح ${tier}`} tone="gold" />
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "orders", label: "پیگیری سفارش", icon: Package },
          { key: "wallet", label: "شارژ کیف پول", icon: Wallet },
          { key: "coupons", label: "کد تخفیف من", icon: Ticket },
          { key: "favorites", label: "علاقه‌مندی‌ها", icon: Heart },
        ].map((a) => (
          <button
            key={a.key}
            onClick={() => goto(a.key)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-border py-3.5 text-sm font-bold text-charcoal hover:bg-blush-soft hover:border-blush transition-colors"
          >
            <a.icon className="size-4 text-blush-dark" />
            {a.label}
          </button>
        ))}
      </div>

      {/* recent orders */}
      <div className="rounded-3xl bg-white border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-charcoal">آخرین سفارش‌ها</h2>
          <button onClick={() => goto("orders")} className="inline-flex items-center gap-1 text-xs font-bold text-blush-dark hover:text-blush transition-colors">
            مشاهده همه <ChevronLeft className="size-3.5" />
          </button>
        </div>
        {myOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">هنوز سفارشی ثبت نکرده‌اید.</p>
        ) : (
          <div className="space-y-2.5">
            {myOrders.slice(0, 3).map((o) => (
              <button
                key={o.id}
                onClick={() => goto("orders")}
                className="w-full flex items-center gap-3 rounded-2xl border border-border/70 p-3 text-right hover:bg-cream/60 transition-colors"
              >
                <div className="flex -space-x-2 space-x-reverse shrink-0">
                  {o.items.slice(0, 2).map((it, i) => (
                    <img key={i} src={it.image || "/images/roses-pink-1.jpg"} alt={it.name} className="size-10 rounded-xl object-cover border-2 border-white" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-charcoal truncate">{o.items[0]?.name}{o.items.length > 1 ? ` و ${faNumber(o.items.length - 1)} مورد` : ""}</p>
                  <p className="text-[11px] text-muted-foreground">{faRelative(o.createdAt)} — <span className="font-mono" dir="ltr">{o.code}</span></p>
                </div>
                <div className="text-left shrink-0 space-y-1">
                  <p className="text-sm font-extrabold text-charcoal">{faPrice(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* notifications preview */}
      {unreadNotifs > 0 && (
        <button
          onClick={() => goto("notifications")}
          className="w-full flex items-center gap-3 rounded-3xl bg-gold-soft/60 border border-gold/30 p-4 text-right hover:bg-gold-soft transition-colors"
        >
          <span className="grid place-items-center size-10 rounded-2xl bg-gold text-white shrink-0">
            <Bell className="size-4" />
          </span>
          <p className="flex-1 text-sm font-bold text-charcoal">
            {faNumber(unreadNotifs)} اعلان خوانده‌نشده دارید — از تخفیف‌ها و وضعیت سفارش باخبر شوید
          </p>
          <ArrowLeft className="size-4 text-gold-dark" />
        </button>
      )}
    </div>
  );
}

// ==================== User Panel ====================
export default function UserPanel() {
  const [data, setData] = useState<PanelData | null>(null);
  const [loadError, setLoadError] = useState("");
  const user = useView((s) => s.user);
  const authReady = useView((s) => s.authReady);
  const setUser = useView((s) => s.setUser);
  const setView = useView((s) => s.setView);
  const section = useView((s) => s.userSection);
  const setSection = useView((s) => s.setUserSection);

  const refresh = useCallback(async () => {
    const d = await fetchPanelData();
    if (d) setData(d);
  }, []);

  // clear stale panel data when the signed-in user changes
  const [prevUserId, setPrevUserId] = useState(user?.id ?? null);
  if ((user?.id ?? null) !== prevUserId) {
    setPrevUserId(user?.id ?? null);
    if (!user) setData(null);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchPanelData().then((d) => {
      if (!cancelled && d) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const ctx: PanelCtx | null = useMemo(() => {
    if (!data) return null;
    return {
      data,
      refresh,
      toast: (msg, isError) => {
        window.dispatchEvent(new CustomEvent("gh:panel-toast", { detail: { msg, isError } }));
      },
    };
  }, [data, refresh]);

  async function handleLogout() {
    await authLogout();
    setUser(null);
    setData(null);
    setView("shop");
  }

  if (!authReady) return <PanelSkeleton />;
  if (!user) return <AuthScreen />;

  // session expired or banned → back to auth
  if (loadError) return <AuthScreen />;

  if (!data || !ctx) return <PanelSkeleton />;

  const myOrders = data.orders;
  const activeCount = myOrders.filter((o) => ["pending", "confirmed", "preparing", "shipped"].includes(o.status)).length;
  const unreadNotifs = data.notifications.filter((n) => !n.isRead).length;

  return (
    <PanelContext.Provider value={ctx}>
      <div className="min-h-screen bg-cream flex flex-col">
        {/* top bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center size-10 rounded-2xl bg-blush text-charcoal shadow-md shadow-blush/40">
                <Flower2 className="size-6" />
              </span>
              <div className="leading-tight">
                <p className="font-extrabold text-charcoal">پنل کاربری</p>
                <p className="text-[10px] text-muted-foreground">گلستان حافظ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <button
                  onClick={() => setView("admin")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft text-gold-dark px-4 py-2 text-xs font-bold hover:bg-gold-soft/70 transition-colors"
                >
                  <Shield className="size-3.5" /> پنل مدیریت
                </button>
              )}
              <button
                onClick={() => setView("shop")}
                className="inline-flex items-center gap-1.5 rounded-full bg-cream-dark text-charcoal px-4 py-2 text-xs font-bold hover:bg-border transition-colors"
              >
                <Store className="size-3.5" /> فروشگاه
                <ArrowLeft className="size-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fbe4e3] text-[#c0392b] px-4 py-2 text-xs font-bold hover:bg-[#f5cfcc] transition-colors"
              >
                <LogOut className="size-3.5" /> خروج
              </button>
            </div>
          </div>
          {/* mobile nav */}
          <nav className="lg:hidden flex gap-1.5 overflow-x-auto px-4 pb-2.5" aria-label="بخش‌های پنل کاربری">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  section === n.key ? "bg-charcoal text-white" : "bg-cream-dark text-charcoal/70"
                }`}
              >
                <n.icon className="size-3.5" />
                {n.label}
                {n.key === "notifications" && unreadNotifs > 0 && (
                  <span className="grid place-items-center min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[9px]">{faNumber(unreadNotifs)}</span>
                )}
                {n.key === "orders" && activeCount > 0 && (
                  <span className="grid place-items-center min-w-4 h-4 px-1 rounded-full bg-gold text-white text-[9px]">{faNumber(activeCount)}</span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 flex gap-6">
          {/* sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-3xl bg-white border border-border p-4">
              <div className="flex items-center gap-3 p-2 mb-3">
                <span
                  className="grid place-items-center size-12 rounded-2xl text-lg font-extrabold text-white shadow"
                  style={{ background: AVATAR_COLORS[data.profile.avatarHue % AVATAR_COLORS.length] }}
                >
                  {data.profile.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-charcoal truncate">{data.profile.name}</p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">{data.profile.phone}</p>
                </div>
              </div>
              <nav className="space-y-1" aria-label="منوی پنل کاربری">
                {NAV.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => setSection(n.key)}
                    className={`w-full flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                      section === n.key
                        ? "bg-blush-soft text-blush-dark shadow-sm"
                        : "text-charcoal/70 hover:bg-cream hover:text-charcoal"
                    }`}
                    aria-current={section === n.key ? "page" : undefined}
                  >
                    <n.icon className="size-4" />
                    <span className="flex-1 text-right">{n.label}</span>
                    {n.key === "notifications" && unreadNotifs > 0 && (
                      <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-destructive text-white text-[10px]">{faNumber(unreadNotifs)}</span>
                    )}
                    {n.key === "orders" && activeCount > 0 && (
                      <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-gold text-white text-[10px]">{faNumber(activeCount)}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="mt-3 pt-3 border-t border-dashed border-border">
                <p className="text-[11px] text-muted-foreground text-center leading-5 px-2">
                  نیاز به کمک دارید؟ <br />
                  واتس‌آپ:{" "}
                  <span dir="ltr" className="font-bold text-charcoal">{WHATSAPP_NUMBER}</span>
                </p>
              </div>
            </div>
          </aside>

          {/* content */}
          <main className="flex-1 min-w-0">
            {section === "overview" && <Overview goto={setSection} />}
            {section === "orders" && <OrdersSection />}
            {section === "favorites" && <FavoritesSection />}
            {section === "addresses" && <AddressesSection />}
            {section === "wallet" && <WalletSection />}
            {section === "coupons" && <CouponsSection />}
            {section === "reviews" && <MyReviewsSection />}
            {section === "notifications" && <NotificationsSection />}
            {section === "support" && <SupportSection />}
            {section === "profile" && <ProfileSection />}
            {section === "security" && <SecuritySection />}
          </main>
        </div>

        <ToastHost />
      </div>
    </PanelContext.Provider>
  );
}

function ToastHost() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; isError: boolean }[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ msg: string; isError?: boolean }>).detail;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg: detail.msg, isError: !!detail.isError }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener("gh:panel-toast", handler);
    return () => window.removeEventListener("gh:panel-toast", handler);
  }, []);

  return (
    <div className="fixed bottom-5 right-1/2 translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-xl max-w-[90vw] ${
            t.isError ? "bg-destructive text-white" : "bg-charcoal text-white"
          }`}
        >
          {t.isError ? <CircleAlert className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
