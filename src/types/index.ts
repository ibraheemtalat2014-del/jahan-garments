export type Gender = 'men' | 'women' | 'boys' | 'girls' | 'kids' | 'unisex';

export type LahoreArea =
  | 'Gulberg'
  | 'DHA Phase 1-5'
  | 'DHA Phase 6-9'
  | 'Johar Town'
  | 'Model Town'
  | 'Cantt / Saddar'
  | 'Bahria Town'
  | 'Faisal Town / Garden Town'
  | 'Wapda Town'
  | 'Iqbal Town'
  | 'Samanabad'
  | 'Mall Road / Anarkali'
  | 'Cavalry Ground'
  | 'Shadman'
  | 'Valencia / Lake City'
  | 'Other Lahore Area';

export interface ProductVariant {
  id: string; // e.g. 'blk-s'
  color: string; // e.g. 'Charcoal Black'
  colorHex?: string; // e.g. '#1e1e1e'
  size: string; // e.g. 'S', 'M', 'L', 'XL', '2-3Y', '32'
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  nameUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  category: string; // Category ID or slug
  subcategory?: string;
  gender: Gender;
  regularPrice: number; // in PKR
  salePrice?: number; // in PKR
  images: string[];
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
  fabric?: string;
  careInstructions?: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  nameUrdu?: string;
  slug: string;
  gender: Gender | 'all';
  image: string;
  isActive: boolean;
  order: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  productImage: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  area: LahoreArea | string;
  streetAddress: string;
  city: 'Lahore';
  province?: string;
  postalCode?: string;
  landmark?: string;
  deliveryInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city?: 'Lahore';
  area?: string;
  address?: string;
  shippingAddress: ShippingAddress;
  instructions?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryCharges?: number;
  discount: number;
  totalAmount: number;
  grandTotal?: number;
  paymentMethod: 'cod';
  orderStatus: OrderStatus;
  status?: OrderStatus;
  statusHistory?: OrderStatusHistory[];
  riderName?: string;
  riderPhone?: string;
  trackingNumber?: string;
  riderNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  displayName: string;
  phone?: string;
  city?: string;
  area?: string;
  address?: string;
  savedAddress?: ShippingAddress;
  role: 'customer' | 'admin' | 'owner';
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  taglineUrdu?: string;
  whatsappNumber: string;
  supportPhone?: string;
  supportEmail?: string;
  deliveryFeeLahore: number;
  lahoreDeliveryFee?: number;
  freeDeliveryThreshold: number;
  lowStockThreshold?: number;
  announcementText?: string;
  announcement?: string;
  announcementUrdu?: string;
  storeAddress: string;
  gmailNotificationSettings?: {
    notifyOwnerNewOrders: boolean;
    notifyCustomerConfirmation: boolean;
    notifyCustomerDispatch: boolean;
    ownerNotificationEmail: string;
  };
}

export interface GmailNotificationLog {
  id: string;
  orderNumber?: string;
  recipient: string;
  recipientType: 'customer' | 'owner' | 'both';
  subject: string;
  type: 'order_placed' | 'status_update' | 'dispatched' | 'test' | 'low_stock';
  status: 'sent' | 'failed' | 'queued';
  timestamp: string;
  details?: string;
}

export interface Banner {
  id: string;
  title: string;
  titleUrdu: string;
  subtitle: string;
  subtitleUrdu: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  isActive: boolean;
  order: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  expiryDate: string;
  usageCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'info';
  timestamp: string;
  read: boolean;
  link?: string;
}
