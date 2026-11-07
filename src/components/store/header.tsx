"use client";

import { useEffect, useRef, useState } from "react";
import {
  Flower2, Menu, Search, ShoppingBag, Truck, X, Heart, PackageSearch,
  UserRound, LogIn, LogOut, Wallet, Package, Shield, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartTotalCount } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { useView } from "@/lib/panel-store";
import { authLogout } from "@/lib/auth-client";
import { faPrice } from "@/lib/format";
import SearchDialog from "@/components/store/search-dialog";

const NAV_ITEMS = [
  { href: "#home", label: "خانه" },
  { href: "#categories", label: "دسته‌بندی" },
  { href: "#products", label: "محصولات" },
  { href: "#occasions", label: "مناسبت‌ها" },
  { href: "#services", label: "خدمات ویژه" },
  { href: "#blog", label: "مجله گل" },
  { href: "#hafez", label: "فال حافظ" },
  { href: "#faq", label: "سوالات" },
  { href: "#about", label: "درباره ما" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.openCart);
  const wishlistItems = useWishlist((s) => s.items);
  const openWishlist = useWishlist((s) => s.openWishlist);
  const setView = useView((s) => s.setView);
  const user = useView((s) => s.user);
  const openAuthModal = useView((s) => s.openAuthModal);
  const setUser = useView((s) => s.setUser);
  const count = cartTotalCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function openTracking() {
    window.dispatchEvent(new CustomEvent("gh:open-tracking"));
  }

  async function handleLogout() {
    await authLogout();
    setUser(null);
    setMenuOpen(false);
    setView("shop");
    window.dispatchEvent(
      new CustomEvent("gh:panel-toast", { detail: { msg: "از حساب خود خارج شدید. به امید دیدار!" } })
    );
  }

  const avatarColors = ["#e8b4b8", "#a8c5a0", "#d4a574", "#b8a7d9", "#8fb8d9"];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_2px_20px_rgba(44,44,44,0.08)]"
          : "bg-transparent"
      }`}
    >
      {/* top bar */}
      <div className="hidden md:block bg-charcoal text-white/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <p className="flex items-center gap-1.5">
            <Truck className="size-3 text-gold" />
            تحویل در محل انتخابی شما
          </p>
          <div className="flex items-center gap-4">
            {user?.role === "admin" && (
              <>
                <button
                  onClick={() => setView("admin")}
                  className="flex items-center gap-1.5 hover:text-gold transition-colors"
                  aria-label="پنل مدیریت فروشگاه"
                >
                  <Shield className="size-3 text-gold" />
                  پنل مدیریت
                </button>
                <span className="text-white/30">|</span>
              </>
            )}
            <button
              onClick={openTracking}
              className="flex items-center gap-1.5 hover:text-gold transition-colors"
              aria-label="رهگیری سفارش"
            >
              <PackageSearch className="size-3.5 text-gold" />
              رهگیری سفارش
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* logo */}
        <a href="#home" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center size-10 rounded-2xl bg-blush text-charcoal shadow-md shadow-blush/40">
            <Flower2 className="size-6" />
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold text-lg text-charcoal">گلستان حافظ</span>
            <span className="block text-[10px] text-muted-foreground tracking-wide">
              گل، شعر و عشق در هر سفارش
            </span>
          </span>
        </a>

        {/* desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="ناوبری اصلی">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-2.5 py-2 rounded-full text-[13px] font-medium text-charcoal/80 hover:text-charcoal hover:bg-blush-soft transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="rounded-full text-charcoal hover:bg-blush-soft"
            aria-label="جستجوی محصولات"
          >
            <Search className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={openWishlist}
            className="relative rounded-full text-charcoal hover:bg-blush-soft"
            aria-label={`علاقه‌مندی‌ها، ${wishlistItems.length} گل`}
          >
            <Heart className={`size-5 ${wishlistItems.length > 0 ? "fill-blush-dark text-blush-dark" : ""}`} />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -left-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-blush-dark text-white text-[10px] font-bold shadow">
                {new Intl.NumberFormat("fa-IR").format(wishlistItems.length)}
              </span>
            )}
          </Button>

          {/* auth area */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-blush-soft/70 border border-blush pl-2 pr-1.5 py-1.5 hover:bg-blush-soft transition-colors"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="منوی حساب کاربری"
              >
                <span
                  className="grid place-items-center size-7 rounded-full text-xs font-extrabold text-white"
                  style={{ background: avatarColors[user.avatarHue % avatarColors.length] }}
                >
                  {user.name.charAt(0)}
                </span>
                <span className="hidden sm:block text-xs font-bold text-charcoal max-w-24 truncate">
                  {user.name}
                </span>
                <ChevronDown className="size-3.5 text-charcoal/60" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-2 w-64 rounded-3xl bg-white border border-border shadow-[0_12px_40px_rgba(44,44,44,0.14)] p-2 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-dashed border-border mb-1">
                    <p className="text-sm font-extrabold text-charcoal">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{user.phone}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-soft/70 px-2 py-0.5 text-[10px] font-bold text-gold-dark">
                      <Wallet className="size-3" /> کیف پول: {faPrice(user.walletBalance)}
                    </p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); setView("user"); }}
                    className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-charcoal hover:bg-cream transition-colors"
                    role="menuitem"
                  >
                    <UserRound className="size-4 text-blush-dark" /> پنل کاربری من
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setView("user"); useView.getState().setUserSection("orders"); }}
                    className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-charcoal hover:bg-cream transition-colors"
                    role="menuitem"
                  >
                    <Package className="size-4 text-sage-dark" /> سفارش‌های من
                  </button>
                  {user.role === "admin" && (
                    <button
                      onClick={() => { setMenuOpen(false); setView("admin"); }}
                      className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-charcoal hover:bg-cream transition-colors"
                      role="menuitem"
                    >
                      <Shield className="size-4 text-gold-dark" /> پنل مدیریت
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-bold text-[#c0392b] hover:bg-[#fbe4e3] transition-colors border-t border-dashed border-border mt-1"
                    role="menuitem"
                  >
                    <LogOut className="size-4" /> خروج از حساب
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => openAuthModal("login")}
              className="rounded-full bg-charcoal text-white hover:bg-charcoal/85 gap-2 h-10 px-4"
              aria-label="ورود یا ثبت‌نام"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline text-sm font-semibold">ورود / ثبت‌نام</span>
            </Button>
          )}

          <Button
            onClick={openCart}
            className="relative rounded-full bg-gold hover:bg-gold-dark text-white gap-2 h-10 px-4"
            aria-label={`سبد خرید، ${count} کالا`}
          >
            <ShoppingBag className="size-5" />
            <span className="hidden sm:inline text-sm font-semibold">سبد خرید</span>
            {count > 0 && (
              <span className="absolute -top-1 -left-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-charcoal text-white text-[10px] font-bold shadow">
                {new Intl.NumberFormat("fa-IR").format(count)}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-charcoal hover:bg-blush-soft lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="منوی موبایل"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* mobile nav */}
      {mobileOpen && (
        <nav
          className="lg:hidden bg-white/95 backdrop-blur-md border-t border-border px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto"
          aria-label="ناوبری موبایل"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-2xl text-sm font-medium text-charcoal hover:bg-blush-soft transition-colors"
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={() => { setMobileOpen(false); openTracking(); }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-charcoal hover:bg-blush-soft transition-colors text-right"
          >
            <PackageSearch className="size-4 text-gold-dark" />
            رهگیری سفارش
          </button>
          {user ? (
            <>
              <button
                onClick={() => { setMobileOpen(false); setView("user"); }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-charcoal hover:bg-blush-soft transition-colors text-right"
              >
                <UserRound className="size-4 text-gold-dark" />
                پنل کاربری من — {user.name}
              </button>
              {user.role === "admin" && (
                <button
                  onClick={() => { setMobileOpen(false); setView("admin"); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-charcoal hover:bg-blush-soft transition-colors text-right"
                >
                  <Shield className="size-4 text-gold-dark" />
                  پنل مدیریت فروشگاه
                </button>
              )}
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-[#c0392b] hover:bg-[#fbe4e3] transition-colors text-right"
              >
                <LogOut className="size-4" />
                خروج از حساب
              </button>
            </>
          ) : (
            <button
              onClick={() => { setMobileOpen(false); openAuthModal("login"); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-charcoal text-white hover:bg-charcoal/85 transition-colors text-right"
            >
              <LogIn className="size-4" />
              ورود / ثبت‌نام
            </button>
          )}
        </nav>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
