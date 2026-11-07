"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Flower2, LayoutDashboard, Package, ShoppingCart, Users, Ticket, Star,
  BarChart3, MessageSquare, Settings as SettingsIcon, LogOut, Store, ArrowLeft,
  CheckCircle2, CircleAlert, Lock, User as UserIcon, Eye, EyeOff, Boxes, LifeBuoy, Phone,
} from "lucide-react";
import { PanelContext, type PanelCtx } from "@/components/panel/panel-context";
import { PanelSkeleton } from "@/components/panel/shared";
import { fetchPanelData } from "@/lib/panel-api";
import { authRequest, authLogout } from "@/lib/auth-client";
import { useView } from "@/lib/panel-store";
import type { PanelData } from "@/lib/types";
import { faNumber } from "@/lib/format";
import { DashboardSection, ProductsSection, CategoriesSection } from "@/components/admin/admin-catalog";
import { AdminOrdersSection, CustomersSection, AdminCouponsSection } from "@/components/admin/admin-orders";
import { AdminReviewsSection, ReportsSection, MessagesSection, AdminSettingsSection } from "@/components/admin/admin-misc";
import { TicketsSection, NotifyComposerButton } from "@/components/admin/admin-support";

const NAV = [
  { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { key: "orders", label: "سفارش‌ها", icon: ShoppingCart },
  { key: "products", label: "محصولات", icon: Package },
  { key: "categories", label: "دسته‌بندی‌ها", icon: Boxes },
  { key: "customers", label: "مشتریان", icon: Users },
  { key: "coupons", label: "کدهای تخفیف", icon: Ticket },
  { key: "reviews", label: "نظرات", icon: Star },
  { key: "tickets", label: "تیکت‌های پشتیبانی", icon: LifeBuoy },
  { key: "reports", label: "گزارش‌ها", icon: BarChart3 },
  { key: "messages", label: "پیام‌ها", icon: MessageSquare },
  { key: "settings", label: "تنظیمات فروشگاه", icon: SettingsIcon },
] as const;

// ==================== Login ====================
function LoginGate() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setUser = useView((s) => s.setUser);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await authRequest("login", { phone, password });
    setLoading(false);
    if (res.success && res.user) {
      if (res.user.role !== "admin") {
        setError("این حساب دسترسی مدیریتی ندارد. با حساب مدیر وارد شوید.");
        return;
      }
      setUser(res.user);
    } else {
      setError(res.error ?? "خطا در ورود");
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
          <h1 className="text-2xl font-extrabold text-charcoal">پنل مدیریت گلستان حافظ</h1>
          <p className="text-sm text-muted-foreground mt-1">برای ادامه وارد حساب مدیر شوید</p>
        </div>
        <form onSubmit={submit} className="rounded-3xl bg-white border border-border p-6 shadow-[0_8px_40px_rgba(44,44,44,0.08)] space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-charcoal/80 mb-1.5">شماره موبایل مدیر</span>
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-input bg-white pr-10 pl-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blush"
                placeholder="09xxxxxxxxx"
                dir="ltr"
                inputMode="tel"
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
                className="w-full rounded-2xl border border-input bg-white pr-10 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blush"
                placeholder="••••••••"
                autoComplete="current-password"
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
          {error && (
            <p className="rounded-2xl bg-[#fbe4e3] text-[#c0392b] text-xs font-bold px-4 py-3 flex items-center gap-2">
              <CircleAlert className="size-4 shrink-0" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-charcoal text-white py-3 text-sm font-extrabold hover:bg-charcoal/85 transition-colors disabled:opacity-60"
          >
            {loading ? "در حال بررسی..." : "ورود به پنل مدیریت"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== Admin Panel ====================
export default function AdminPanel() {
  const [data, setData] = useState<PanelData | null>(null);
  const user = useView((s) => s.user);
  const authReady = useView((s) => s.authReady);
  const setUser = useView((s) => s.setUser);
  const setView = useView((s) => s.setView);
  const section = useView((s) => s.adminSection);
  const setSection = useView((s) => s.setAdminSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = !!user && user.role === "admin";

  const refresh = useCallback(async () => {
    const d = await fetchPanelData();
    if (d) setData(d);
  }, []);

  // clear stale admin data when the admin session changes
  const [prevAdminId, setPrevAdminId] = useState<string | null>(user?.id ?? null);
  if ((user?.id ?? null) !== prevAdminId) {
    setPrevAdminId(user?.id ?? null);
    if (!isAdmin) setData(null);
  }

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchPanelData().then((d) => {
      if (!cancelled && d) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function handleLogout() {
    await authLogout();
    setUser(null);
    setData(null);
    setView("shop");
  }

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

  if (!authReady) return <PanelSkeleton />;
  if (!isAdmin) return <LoginGate />;
  if (!data || !ctx) return <PanelSkeleton />;

  const pendingOrders = data.stats.pendingOrders;
  const pendingReviews = data.reviews.filter((r) => r.status === "pending").length;
  const unreadMessages = data.messages.filter((m) => !m.isRead).length;
  const lowStock = data.stats.lowStockProducts.length;
  const openTickets = data.tickets.filter((t) => t.status === "open").length;

  return (
    <PanelContext.Provider value={ctx}>
      <div className="min-h-screen bg-cream flex" dir="rtl">
        {/* sidebar */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-64 shrink-0 bg-charcoal text-white z-50 flex flex-col transition-transform ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          } right-0 lg:right-auto`}
        >
          <div className="p-5 flex items-center gap-2.5 border-b border-white/10">
            <span className="grid place-items-center size-10 rounded-2xl bg-blush text-charcoal shadow">
              <Flower2 className="size-6" />
            </span>
            <div className="leading-tight">
              <p className="font-extrabold">گلستان حافظ</p>
              <p className="text-[10px] text-white/50">پنل مدیریت فروشگاه</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="منوی پنل مدیریت">
            {NAV.map((n) => {
              const badge =
                n.key === "orders" ? pendingOrders :
                n.key === "reviews" ? pendingReviews :
                n.key === "messages" ? unreadMessages :
                n.key === "products" ? lowStock :
                n.key === "tickets" ? openTickets : 0;
              return (
                <button
                  key={n.key}
                  onClick={() => { setSection(n.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                    section === n.key ? "bg-blush text-charcoal shadow" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  aria-current={section === n.key ? "page" : undefined}
                >
                  <n.icon className="size-4" />
                  <span className="flex-1 text-right">{n.label}</span>
                  {badge > 0 && (
                    <span className={`grid place-items-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold ${
                      section === n.key ? "bg-charcoal text-white" : "bg-blush text-charcoal"
                    }`}>
                      {faNumber(badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/10 space-y-1">
            <button
              onClick={() => setView("shop")}
              className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Store className="size-4" />
              <span className="flex-1 text-right">مشاهده فروشگاه</span>
              <ArrowLeft className="size-3.5" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-[#f2b8b5] hover:bg-white/10 transition-colors"
            >
              <LogOut className="size-4" />
              <span className="flex-1 text-right">خروج از پنل</span>
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="بستن منو"
          />
        )}

        {/* main */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border">
            <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden grid place-items-center size-10 rounded-2xl bg-cream-dark text-charcoal"
                  aria-label="باز کردن منو"
                >
                  <LayoutDashboard className="size-5" />
                </button>
                <div>
                  <h1 className="font-extrabold text-charcoal">{NAV.find((n) => n.key === section)?.label}</h1>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    {data.settings.shopName} — مدیریت فروشگاه آنلاین گل
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotifyComposerButton />
                {pendingOrders > 0 && (
                  <button
                    onClick={() => setSection("orders")}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gold-soft text-gold-dark px-3.5 py-2 text-xs font-bold hover:bg-gold-soft/70 transition-colors"
                  >
                    <CircleAlert className="size-3.5" /> {faNumber(pendingOrders)} سفارش در انتظار تأیید
                  </button>
                )}
                <span className="grid place-items-center size-10 rounded-full bg-sage-dark text-white text-sm font-extrabold" title="مدیر کل">
                  م
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            {section === "dashboard" && <DashboardSection />}
            {section === "orders" && <AdminOrdersSection />}
            {section === "products" && <ProductsSection />}
            {section === "categories" && <CategoriesSection />}
            {section === "customers" && <CustomersSection />}
            {section === "coupons" && <AdminCouponsSection />}
            {section === "reviews" && <AdminReviewsSection />}
            {section === "tickets" && <TicketsSection />}
            {section === "reports" && <ReportsSection />}
            {section === "messages" && <MessagesSection />}
            {section === "settings" && <AdminSettingsSection />}
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
