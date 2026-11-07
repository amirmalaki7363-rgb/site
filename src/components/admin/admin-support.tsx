"use client";

import { useMemo, useState } from "react";
import {
  Ticket as TicketIcon, Megaphone, MessageSquare, Trash2, SendHorizontal,
  CircleCheck, CircleAlert, Bell,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState, Field, SectionHeader } from "@/components/panel/shared";
import { usePanel } from "@/components/panel/panel-context";
import { panelMutate } from "@/lib/panel-api";
import { faNumber, faRelative, faDateTime } from "@/lib/format";
import {
  TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS,
} from "@/lib/types";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-gold-soft text-gold-dark",
  answered: "bg-sage-soft text-sage-dark",
  closed: "bg-cream-dark text-charcoal/60",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-[#fbe4e3] text-[#c0392b]",
  normal: "bg-blush-soft text-blush-dark",
  low: "bg-cream-dark text-charcoal/60",
};

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "open", label: "باز" },
  { key: "answered", label: "پاسخ داده شده" },
  { key: "closed", label: "بسته" },
];

// ==================== Tickets Section (admin) ====================
export function TicketsSection() {
  const { data, refresh, toast } = usePanel();
  const [tab, setTab] = useState("all");
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: data.tickets.length,
      open: data.tickets.filter((t) => t.status === "open").length,
      answered: data.tickets.filter((t) => t.status === "answered").length,
      closed: data.tickets.filter((t) => t.status === "closed").length,
    }),
    [data.tickets]
  );
  const list = tab === "all" ? data.tickets : data.tickets.filter((t) => t.status === tab);
  const activeTicket = data.tickets.find((t) => t.id === openTicketId) ?? null;

  async function sendReply() {
    if (!activeTicket || !reply.trim()) return;
    setSaving(true);
    const res = await panelMutate("ticket.reply", {
      id: activeTicket.id,
      data: { body: reply, sender: "admin", senderName: "پشتیبانی گلستان حافظ" },
    });
    setSaving(false);
    if (res.success) {
      setReply("");
      await refresh();
      toast("پاسخ شما ارسال شد و وضعیت تیکت به «پاسخ داده شده» تغییر کرد.");
    } else {
      toast(res.error ?? "خطا در ارسال پاسخ", true);
    }
  }

  async function setStatus(status: string) {
    if (!activeTicket) return;
    const res = await panelMutate("ticket.setStatus", { id: activeTicket.id, status });
    if (res.success) {
      await refresh();
      toast(status === "closed" ? "تیکت بسته شد." : "وضعیت تیکت به‌روزرسانی شد.");
    } else {
      toast(res.error ?? "خطا در تغییر وضعیت", true);
    }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    const res = await panelMutate("ticket.delete", { id: deleteTarget });
    if (res.success) {
      if (openTicketId === deleteTarget) setOpenTicketId(null);
      await refresh();
      toast("تیکت حذف شد.");
    } else {
      toast(res.error ?? "خطا در حذف تیکت", true);
    }
  }

  return (
    <div>
      <SectionHeader
        title="تیکت‌های پشتیبانی"
        desc={`${faNumber(counts.open)} تیکت باز در انتظار پاسخ تیم شماست.`}
      />

      {/* tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              tab === t.key ? "bg-charcoal text-white" : "bg-white border border-border text-charcoal/70 hover:bg-cream"
            }`}
          >
            {t.label}
            <span
              className={`grid place-items-center min-w-5 h-5 px-1 rounded-full text-[10px] ${
                tab === t.key ? "bg-blush text-charcoal" : "bg-cream-dark text-charcoal/60"
              }`}
            >
              {faNumber(counts[t.key as keyof typeof counts] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<TicketIcon className="size-7" />} title="تیکتی در این دسته نیست" desc="تیکت‌های پشتیبانی مشتریان از پنل کاربری آن‌ها اینجا نمایش داده می‌شوند." />
      ) : (
        <div className="space-y-3">
          {list.map((t) => {
            const lastAdminReply = [...t.messages].reverse().find((m) => m.sender === "admin");
            const waiting = t.status === "open";
            return (
              <div key={t.id} className={`rounded-3xl border p-4 ${waiting ? "bg-gold-soft/25 border-gold/30" : "bg-white border-border"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <button onClick={() => setOpenTicketId(t.id)} className="text-right min-w-0 flex-1 group">
                    <p className="font-bold text-sm text-charcoal group-hover:text-blush-dark transition-colors flex items-center gap-2">
                      <MessageSquare className="size-4 text-blush-dark shrink-0" />
                      {t.subject}
                      {waiting && <span className="size-2 rounded-full bg-gold animate-pulse" aria-label="در انتظار پاسخ" />}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-charcoal/80">{t.userName}</span>
                      <span dir="ltr">{t.phone}</span>
                      <span>•</span>
                      <span className="font-mono" dir="ltr">{t.code}</span>
                      <span>•</span>
                      <span>{TICKET_CATEGORY_LABELS[t.category] ?? t.category}</span>
                      <span>•</span>
                      <span>{faRelative(t.updatedAt)}</span>
                    </p>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.normal}`}>
                      {TICKET_PRIORITY_LABELS[t.priority] ?? t.priority}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[t.status] ?? STATUS_STYLES.open}`}>
                      {TICKET_STATUS_LABELS[t.status] ?? t.status}
                    </span>
                    <button
                      onClick={() => setOpenTicketId(t.id)}
                      className="rounded-full bg-charcoal text-white px-3.5 py-1.5 text-[11px] font-bold hover:bg-charcoal/85 transition-colors"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t.id)}
                      className="grid place-items-center size-8 rounded-full text-muted-foreground hover:bg-[#fbe4e3] hover:text-[#c0392b] transition-colors"
                      aria-label="حذف تیکت"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {lastAdminReply && (
                  <p className="mt-2.5 text-xs text-charcoal/60 leading-6 line-clamp-2 rounded-2xl bg-sage-soft/40 px-3 py-2">
                    <span className="font-bold text-sage-dark">پاسخ شما:</span> {lastAdminReply.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* thread dialog */}
      <Dialog open={!!activeTicket} onOpenChange={(v) => !v && setOpenTicketId(null)}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[85vh] flex flex-col" aria-describedby="admin-ticket-desc">
          {activeTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right flex items-center gap-2 text-charcoal">
                  <TicketIcon className="size-5 text-blush-dark" /> {activeTicket.subject}
                </DialogTitle>
                <DialogDescription id="admin-ticket-desc" className="text-right">
                  <span className="font-bold">{activeTicket.userName}</span> — <span dir="ltr">{activeTicket.phone}</span> — کد تیکت:{" "}
                  <span className="font-mono" dir="ltr">{activeTicket.code}</span> — {faDateTime(activeTicket.createdAt)}
                </DialogDescription>
              </DialogHeader>

              {/* thread */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-1 max-h-[38vh]">
                {activeTicket.messages.map((m) => {
                  const isAdmin = m.sender === "admin";
                  return (
                    <div key={m.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                          isAdmin
                            ? "bg-sage-soft text-charcoal rounded-tr-md"
                            : "bg-blush-soft text-charcoal rounded-tl-md"
                        }`}
                      >
                        <p className="text-[10px] font-bold mb-1 opacity-70">
                          {isAdmin ? "پشتیبانی گلستان حافظ" : activeTicket.userName}
                          <span className="font-normal"> — {faDateTime(m.createdAt)}</span>
                        </p>
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* reply + status */}
              {activeTicket.status !== "closed" ? (
                <div className="pt-3 border-t border-border space-y-2.5">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className={`${inputCls} min-h-11 max-h-24 resize-none py-3`}
                      placeholder="پاسخ حرفه‌ای و محترمانه خود را بنویسید..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <button
                      onClick={sendReply}
                      disabled={saving || !reply.trim()}
                      className="grid place-items-center size-11 rounded-2xl bg-charcoal text-white hover:bg-charcoal/85 transition-colors disabled:opacity-50 shrink-0"
                      aria-label="ارسال پاسخ"
                    >
                      <SendHorizontal className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CircleCheck className="size-3.5 text-sage-dark" />
                      با ارسال پاسخ، وضعیت خودکار به «پاسخ داده شده» تغییر می‌کند.
                    </p>
                    <button
                      onClick={() => setStatus("closed")}
                      className="rounded-full bg-cream-dark text-charcoal px-4 py-2 text-xs font-bold hover:bg-border transition-colors"
                    >
                      بستن تیکت
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground">این تیکت بسته شده است.</p>
                  <button
                    onClick={() => setStatus("open")}
                    className="rounded-full bg-blush-soft text-blush-dark px-4 py-2 text-xs font-bold hover:bg-blush/50 transition-colors"
                  >
                    بازگشایی تیکت
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف تیکت"
        message="آیا از حذف این تیکت و تمام پیام‌های آن مطمئن هستید؟ این عمل قابل بازگشت نیست."
        onConfirm={doDelete}
      />
    </div>
  );
}

// ==================== Notification Composer (admin) ====================
export function NotifyComposerButton() {
  const { refresh, toast, data } = usePanel();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "promo" });

  const customersCount = data.customers.length;

  async function send() {
    if (!form.title.trim() || !form.body.trim()) {
      toast("عنوان و متن اعلان الزامی است.", true);
      return;
    }
    setSaving(true);
    const res = await panelMutate("notification.create", {
      data: { title: form.title, body: form.body, type: form.type },
    });
    setSaving(false);
    if (res.success) {
      toast("اعلان برای مشتریان ارسال شد 📣");
      setOpen(false);
      setForm({ title: "", body: "", type: "promo" });
      await refresh();
    } else {
      toast(res.error ?? "خطا در ارسال اعلان", true);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-blush-soft text-blush-dark px-4 py-2 text-xs font-bold hover:bg-blush/60 transition-colors"
      >
        <Megaphone className="size-3.5" /> اعلان جدید
      </button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="notify-desc">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-charcoal">
              <Megaphone className="size-5 text-blush-dark" /> ارسال اعلان به مشتریان
            </DialogTitle>
            <DialogDescription id="notify-desc" className="text-right">
              اعلان در بخش «اعلان‌ها»ی پنل {faNumber(customersCount)} مشتری نمایش داده می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <Field label="عنوان اعلان" required>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
                placeholder="مثلاً: تخفیف ویژه آخر هفته 🌷"
              />
            </Field>
            <Field label="متن اعلان" required>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={`${inputCls} min-h-24 resize-none leading-7`}
                placeholder="متن پیام تبلیغاتی یا اطلاع‌رسانی را بنویسید..."
              />
            </Field>
            <Field label="نوع اعلان">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={inputCls}
              >
                <option value="promo">تبلیغاتی — تخفیف‌ها و پیشنهادها</option>
                <option value="system">سیستمی — اطلاع‌رسانی عمومی</option>
                <option value="order">سفارش — تغییر وضعیت سفارش</option>
              </select>
            </Field>
            <div className="flex gap-2 justify-start">
              <button
                onClick={send}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-5 py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60"
              >
                <Bell className="size-4" /> {saving ? "در حال ارسال..." : "ارسال اعلان"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-cream-dark text-charcoal px-5 py-2.5 text-sm font-bold hover:bg-border transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== Dashboard quick KPI for tickets ====================
export function TicketAlertChip({ pendingTickets, onGo }: { pendingTickets: number; onGo: () => void }) {
  if (pendingTickets <= 0) return null;
  return (
    <button
      onClick={onGo}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-dark px-3.5 py-2 text-xs font-bold hover:bg-sage/40 transition-colors"
    >
      <CircleAlert className="size-3.5" /> {faNumber(pendingTickets)} تیکت باز پشتیبانی
    </button>
  );
}
