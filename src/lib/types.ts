export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  isBestseller: boolean;
  isNew: boolean;
  isActive: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  all: "همه محصولات",
  bouquet: "دسته‌گل",
  box: "باکس گل",
  plant: "گیاه آپارتمانی",
  seasonal: "گل‌های فصلی",
  dried: "گل خشک",
};

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface OrderAddon {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  code: string;
  userId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  deliveryDate: string;
  deliverySlot: string;
  cardMessage: string;
  addons: OrderAddon[];
  couponCode: string;
  paymentMethod: string;
  shippingCost: number;
  discount: number;
  pointsEarned: number;
  note: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paidAt: string | null;
  paymentRef: string;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "در انتظار تأیید",
  confirmed: "تأیید شده",
  preparing: "در حال آماده‌سازی",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export const PAYMENT_LABELS: Record<string, string> = {
  online: "پرداخت آنلاین",
  wallet: "کیف پول",
  cod: "پرداخت در محل",
};

export const PAYMENT_GATEWAY_LABELS: Record<string, string> = {
  sandbox: "درگاه آزمایشی (تست)",
  zarinpal: "زرین‌پال",
};

export interface Profile {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string;
  gender: string;
  avatarHue: number;
  walletBalance: number;
  points: number;
  emailOffers: boolean;
  smsOffers: boolean;
  memberSince: string;
}

export interface Address {
  id: string;
  title: string;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  postal: string;
  line: string;
  isDefault: boolean;
}

export interface WalletTx {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number;
  used: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Favorite {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  author: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  wallet: number;
  points: number;
  note: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrder?: string | null;
}

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  city: string;
  birthday: string;
  gender: string;
  avatarHue: number;
  walletBalance: number;
  points: number;
  emailOffers: boolean;
  smsOffers: boolean;
  note: string;
  isBanned: boolean;
  memberSince: string;
}

export interface Settings {
  shopName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  shippingFee: number;
  freeShippingMin: number;
  announcement: string;
  isOpen: boolean;
  autoAccept: boolean;
  paymentGateway: string;
  zarinpalMerchantId: string;
}

export interface Message {
  id: string;
  name: string;
  phone: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface TicketMsg {
  id: string;
  sender: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  code: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  userName: string;
  phone: string;
  messages: TicketMsg[];
  createdAt: string;
  updatedAt: string;
}

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "باز — در انتظار پاسخ",
  answered: "پاسخ داده شده",
  closed: "بسته شده",
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: "کم",
  normal: "معمولی",
  high: "فوری",
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  general: "پرسش عمومی",
  order: "سفارش و ارسال",
  payment: "پرداخت و کیف پول",
  product: "کیفیت محصول",
  refund: "مرجوعی و بازگشت وجه",
};

export interface SalesPoint {
  date: string;
  label: string;
  total: number;
  count: number;
}

export interface PanelStats {
  salesToday: number;
  salesMonth: number;
  ordersToday: number;
  ordersMonth: number;
  customersCount: number;
  productsActive: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockProducts: Product[];
  salesByDay: SalesPoint[];
  statusCounts: Record<string, number>;
  topProducts: { id: string; name: string; image: string; qty: number; revenue: number }[];
  categoryStats: { category: string; count: number; value: number; avg: number; sold: number }[];
}

export interface PanelData {
  profile: Profile;
  addresses: Address[];
  walletTx: WalletTx[];
  coupons: Coupon[];
  favorites: Favorite[];
  reviews: Review[];
  notifications: Notification[];
  customers: Customer[];
  orders: Order[];
  products: Product[];
  settings: Settings;
  messages: Message[];
  tickets: Ticket[];
  stats: PanelStats;
}
