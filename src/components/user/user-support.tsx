"use client";

import { useMemo, useState } from "react";
import {
  LifeBuoy, MessageSquarePlus, Clock, Instagram, Send, SendHorizontal,
  MessageCircle, Ticket as TicketIcon, CircleAlert, CheckCircle2, Store,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Field, SectionHeader } from "@/components/panel/shared";
import { usePanel } from "@/components/panel/panel-context";
import { panelMutate } from "@/lib/panel-api";
import { faDateTime, faRelative, faNumber } from "@/lib/format";
import { WHATSAPP_LINK, WHATSAPP_NUMBER, INSTAGRAM_LINK } from "@/lib/shop-options";
import {
  TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS,
} from "@/lib/types";

const inputCls =
  "w-full rounded-2xl border border-input bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blush transition-shadow";

const FAQ_ITEMS = [
  {
    q: "سفارش من چه زمانی ارسال می‌شود؟",
    a: "سفارش‌های ثبت‌شده در محل انتخابی شما ارسال می‌شوند. در زمان ثبت سفارش می‌توانید بازه ساعتی دلخواه را انتخاب کنید و از بخش «سفارش‌های من» هم لحظه‌به‌لحظه وضعیت را دنبال کنید.",
  },
  {
    q: "اگر گل‌ها آسیب‌دیده برسند چه می‌شود؟",
    a: "تازگی گل‌ها تضمین‌شده است. اگر سفارش آسیب‌دیده یا پژمرده به دستتان رسید، حداکثر تا ۱۲ ساعت پس از تحویل از همین بخش تیکت ثبت کنید و عکس بفرستید؛ همکاران ما پس از بررسی، گل را مجدد ارسال یا مبلغ را کامل به کیف پول شما بازمی‌گردانند.",
  },
  {
    q: "چطور می‌توانم سفارشم را لغو کنم؟",
    a: "سفارش‌های «در انتظار تأیید» از بخش سفارش‌های من قابل لغو فوری هستند و مبلغ بلافاصله به کیف پول برمی‌گردد. اگر سفارش وارد مرحله آماده‌سازی شده باشد، کافی است تیکت ثبت کنید تا کارشناسان پیگیری کنند.",
  },
  {
    q: "امتیاز باشگاه مشتریان چگونه کار می‌کند؟",
    a: "به ازای هر ۱۰٬۰۰۰ تومان خرید، ۱ امتیاز دریافت می‌کنید. با رسیدن به ۵۰۰ امتیاز عضویت شما نقره‌ای و با ۲٬۰۰۰ امتیاز طلایی می‌شود؛ اعضای طلایی همیشه تخفیف‌های اختصاصی و هدایای ویژه دارند.",
  },
];

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

// ==================== Support Section (user) ====================
export default function SupportSection() {
  const { data, refresh, toast } = usePanel();
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", body: "" });

  const myTickets = useMemo(
    () => data.tickets.filter((t) => t.phone === data.profile.phone),
    [data.tickets, data.profile.phone]
  );
  const activeTicket = myTickets.find((t) => t.id === openTicketId) ?? null;

  async function createTicket() {
    if (!form.subject.trim() || !form.body.trim()) {
      toast("موضوع و متن تیکت را کامل کنید.", true);
      return;
    }
    setSaving(true);
    const res = await panelMutate("ticket.create", {
      data: {
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        body: form.body,
        userName: data.profile.name,
        phone: data.profile.phone,
      },
    });
    setSaving(false);
    if (res.success) {
      toast("تیکت شما ثبت شد؛ کارشناسان ما در اولین فرصت پاسخ می‌دهند. 🌸");
      setNewOpen(false);
      setForm({ subject: "", category: "general", priority: "normal", body: "" });
      await refresh();
    } else {
      toast(res.error ?? "خطا در ثبت تیکت", true);
    }
  }

  async function sendReply() {
    if (!activeTicket || !reply.trim()) return;
    setSaving(true);
    const res = await panelMutate("ticket.reply", {
      id: activeTicket.id,
      data: { body: reply, sender: "user", senderName: data.profile.name },
    });
    setSaving(false);
    if (res.success) {
      setReply("");
      await refresh();
    } else {
      toast(res.error ?? "خطا در ارسال پاسخ", true);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="پشتیبانی"
        desc="هر سوالی دارید بپرسید؛ تیم پشتیبانی گلستان حافظ همیشه کنار شماست."
        action={
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-4 py-2 text-xs font-bold hover:bg-charcoal/85 transition-colors"
          >
            <MessageSquarePlus className="size-3.5" /> تیکت جدید
          </button>
        }
      />

      {/* contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-3xl bg-white border border-border p-4 flex items-center gap-3 hover:border-sage-dark transition-colors"
          title="ثبت سفارش و پشتیبانی در واتس‌آپ"
        >
          <span className="grid place-items-center size-11 rounded-2xl bg-sage-soft text-sage-dark shrink-0">
            <MessageCircle className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">واتس‌آپ پشتیبانی</p>
            <p className="text-sm font-extrabold text-charcoal" dir="ltr">{WHATSAPP_NUMBER}</p>
          </div>
        </a>
        <div className="rounded-3xl bg-white border border-border p-4 flex items-center gap-3">
          <span className="grid place-items-center size-11 rounded-2xl bg-blush-soft text-blush-dark shrink-0">
            <Clock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">ساعات پاسخگویی</p>
            <p className="text-sm font-extrabold text-charcoal">هر روز ۹ صبح تا ۹ شب</p>
          </div>
        </div>
        <a
          href={INSTAGRAM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-3xl bg-white border border-border p-4 flex items-center gap-3 hover:border-gold-dark transition-colors"
          title="اینستاگرام گلستان حافظ"
        >
          <span className="grid place-items-center size-11 rounded-2xl bg-gold-soft text-gold-dark shrink-0">
            <Instagram className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">اینستاگرام</p>
            <p className="text-sm font-extrabold text-charcoal" dir="ltr">@GolestaneHafez</p>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div className="rounded-3xl bg-white border border-border p-5">
        <h3 className="font-extrabold text-charcoal mb-1 flex items-center gap-2">
          <LifeBuoy className="size-4.5 text-blush-dark" /> سوال‌های پرتکرار
        </h3>
        <p className="text-xs text-muted-foreground mb-3">قبل از ثبت تیکت، پاسخ سوال‌های رایج را اینجا ببینید.</p>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/70">
              <AccordionTrigger className="text-right text-sm font-bold text-charcoal hover:no-underline hover:text-blush-dark py-3.5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-charcoal/70">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* my tickets */}
      <div>
        <h3 className="font-extrabold text-charcoal mb-3 flex items-center gap-2">
          <TicketIcon className="size-4.5 text-blush-dark" /> تیکت‌های من
          {myTickets.length > 0 && (
            <span className="rounded-full bg-blush-soft text-blush-dark text-[11px] font-bold px-2.5 py-0.5">
              {faNumber(myTickets.length)} تیکت
            </span>
          )}
        </h3>
        {myTickets.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="size-7" />}
            title="هنوز تیکتی ثبت نکرده‌اید"
            desc="برای هر پرسش یا درخواستی، یک تیکت بسازید؛ پاسخ کارشناسان را همین‌جا ببینید."
            action={
              <button
                onClick={() => setNewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-blush text-charcoal px-5 py-2.5 text-sm font-bold hover:bg-blush-dark hover:text-white transition-colors"
              >
                <MessageSquarePlus className="size-4" /> ثبت اولین تیکت
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {myTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setOpenTicketId(t.id)}
                className="w-full rounded-3xl bg-white border border-border p-4 text-right hover:border-blush hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-charcoal">{t.subject}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-mono" dir="ltr">{t.code}</span>
                      <span>•</span>
                      <span>{TICKET_CATEGORY_LABELS[t.category] ?? t.category}</span>
                      <span>•</span>
                      <span>{t.messages.length} پیام</span>
                      <span>•</span>
                      <span>{faRelative(t.updatedAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.normal}`}>
                      {t.priority === "high" ? "فوری" : t.priority === "low" ? "کم" : "معمولی"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[t.status] ?? STATUS_STYLES.open}`}>
                      {TICKET_STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* new ticket dialog */}
      <Dialog open={newOpen} onOpenChange={(v) => !v && setNewOpen(false)}>
        <DialogContent className="max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto" aria-describedby="new-ticket-desc">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-charcoal">
              <MessageSquarePlus className="size-5 text-blush-dark" /> ثبت تیکت جدید
            </DialogTitle>
            <DialogDescription id="new-ticket-desc" className="text-right">
              پاسخ کارشناسان ما معمولاً کمتر از ۳ ساعت طول می‌کشد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <Field label="موضوع تیکت" required>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className={inputCls}
                placeholder="مثلاً: درخواست فاکتور رسمی سفارش ارکیده"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="دسته‌بندی">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputCls}
                >
                  {Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="اولویت">
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className={inputCls}
                >
                  <option value="low">کم</option>
                  <option value="normal">معمولی</option>
                  <option value="high">فوری</option>
                </select>
              </Field>
            </div>
            <Field label="متن پیام" required>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={`${inputCls} min-h-28 resize-none leading-7`}
                placeholder="توضیح کامل درخواست خود را بنویسید؛ هرچه دقیق‌تر، پاسخ سریع‌تر."
              />
            </Field>
            <div className="rounded-2xl bg-cream/80 p-3 text-[11px] leading-5 text-charcoal/60 flex items-start gap-2">
              <CircleAlert className="size-4 shrink-0 text-gold-dark mt-0.5" />
              تیکت شما با شماره <span dir="ltr" className="font-bold">{data.profile.phone}</span> ثبت می‌شود و پاسخ در همین بخش قابل مشاهده است.
            </div>
            <div className="flex gap-2 justify-start">
              <button
                onClick={createTicket}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-charcoal text-white px-5 py-2.5 text-sm font-bold hover:bg-charcoal/85 transition-colors disabled:opacity-60"
              >
                <Send className="size-4" /> {saving ? "در حال ارسال..." : "ارسال تیکت"}
              </button>
              <button
                onClick={() => setNewOpen(false)}
                className="rounded-full bg-cream-dark text-charcoal px-5 py-2.5 text-sm font-bold hover:bg-border transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* conversation dialog */}
      <Dialog open={!!activeTicket} onOpenChange={(v) => !v && setOpenTicketId(null)}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[85vh] flex flex-col" aria-describedby="ticket-thread-desc">
          {activeTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right flex items-center justify-between gap-2 flex-wrap text-charcoal">
                  <span className="flex items-center gap-2">
                    <TicketIcon className="size-5 text-blush-dark" /> {activeTicket.subject}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${STATUS_STYLES[activeTicket.status] ?? STATUS_STYLES.open}`}>
                    {TICKET_STATUS_LABELS[activeTicket.status] ?? activeTicket.status}
                  </span>
                </DialogTitle>
                <DialogDescription id="ticket-thread-desc" className="text-right">
                  کد تیکت: <span className="font-mono" dir="ltr">{activeTicket.code}</span> — {TICKET_CATEGORY_LABELS[activeTicket.category] ?? activeTicket.category} — {faDateTime(activeTicket.createdAt)}
                </DialogDescription>
              </DialogHeader>

              {/* thread */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-1 max-h-[45vh]">
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
                        <p className="text-[10px] font-bold mb-1 flex items-center gap-1.5 opacity-70">
                          {isAdmin ? (
                            <>
                              <CheckCircle2 className="size-3" /> {m.senderName}
                            </>
                          ) : (
                            <>
                              <Store className="size-3" /> شما
                            </>
                          )}
                          <span className="font-normal">{faDateTime(m.createdAt)}</span>
                        </p>
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* reply */}
              {activeTicket.status !== "closed" ? (
                <div className="pt-3 border-t border-border flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className={`${inputCls} min-h-11 max-h-24 resize-none py-3`}
                    placeholder="پاسخ خود را بنویسید..."
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
              ) : (
                <p className="pt-3 border-t border-border text-xs text-muted-foreground text-center">
                  این تیکت بسته شده است. برای موضوع جدید تیکت جدیدی بسازید.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
