"use client";

import { useEffect } from "react";
import { useView } from "@/lib/panel-store";
import { useAuthInit } from "@/lib/auth-client";
import UserPanel from "@/components/user/user-panel";
import AdminPanel from "@/components/admin/admin-panel";
import AuthModal from "@/components/auth/auth-modal";
import Header from "@/components/store/header";
import Hero from "@/components/store/hero";
import Features from "@/components/store/features";
import Categories from "@/components/store/categories";
import Products from "@/components/store/products";
import Occasions from "@/components/store/occasions";
import Services from "@/components/store/services";
import HafezSection from "@/components/store/hafez";
import Blog from "@/components/store/blog";
import Testimonials from "@/components/store/testimonials";
import Faq from "@/components/store/faq";
import About from "@/components/store/about";
import Footer from "@/components/store/footer";
import CartDrawer from "@/components/store/cart-drawer";
import WishlistDrawer from "@/components/store/wishlist-drawer";
import CheckoutDialog from "@/components/store/checkout-dialog";
import OrderTracking from "@/components/store/order-tracking";
import PaymentGateway from "@/components/store/payment-gateway";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/shop-options";

function ShopPage({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Categories />
        <Products />
        <Occasions />
        <Services />
        <HafezSection />
        <Blog />
        <Testimonials />
        <Faq />
        <About />
        {/* server-rendered, crawlable catalogue index (sits inside <main>, above the real footer) */}
        {children}
      </main>
      <Footer />

      {/* دکمه شناور ثبت سفارش در واتس‌آپ */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`ثبت سفارش در واتس‌آپ — ${WHATSAPP_NUMBER}`}
        title={`ثبت سفارش در واتس‌آپ — ${WHATSAPP_NUMBER}`}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-sage-dark pl-4 pr-3 py-3 text-white shadow-lg shadow-sage-dark/30 hover:bg-charcoal transition-colors"
      >
        <MessageCircle className="size-5 shrink-0" />
        <span className="text-xs font-extrabold leading-none hidden sm:block">ثبت سفارش در واتس‌آپ</span>
      </a>

      <CartDrawer />
      <WishlistDrawer />
      <CheckoutDialog />
      <OrderTracking />
    </div>
  );
}

export default function AppShell({ children }: { children?: React.ReactNode }) {
  useAuthInit();
  const view = useView((s) => s.view);

  // Deep-link support: #admin → admin panel, #user → user panel, #pay/<authority> → payment gateway
  useEffect(() => {
    function applyHash() {
      const h = window.location.hash.replace("#", "");
      if (h.startsWith("pay/")) {
        const authority = h.slice(4).trim();
        if (authority) {
          useView.getState().openGateway(authority);
          return;
        }
      }
      if (h === "admin") useView.getState().setView("admin");
      else if (h === "user" || h === "panel") useView.getState().setView("user");
      else if (h === "shop" || h === "") {
        // only fall back to shop if the hash was explicitly #shop
        if (h === "shop" && useView.getState().view !== "gateway") useView.getState().setView("shop");
      }
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return (
    <>
      {view === "user" ? (
        <UserPanel />
      ) : view === "admin" ? (
        <AdminPanel />
      ) : view === "gateway" ? (
        <PaymentGateway />
      ) : (
        <ShopPage>{children}</ShopPage>
      )}
      <AuthModal />
    </>
  );
}
