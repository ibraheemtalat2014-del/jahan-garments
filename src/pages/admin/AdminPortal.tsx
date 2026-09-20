import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sliders,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Truck,
  AlertTriangle,
  Search,
  ExternalLink,
  DollarSign,
  ArrowLeft,
  X,
  Save,
  Check,
  Phone,
  MapPin,
  RefreshCw,
  Mail,
  Send,
  Ban,
  Lock,
  Copy,
} from 'lucide-react';
import {
  Product,
  ProductVariant,
  Order,
  OrderStatus,
  StoreSettings,
  Category,
  Gender,
  LahoreArea,
  GmailNotificationLog,
} from '../../types';
import { StoreService } from '../../services/storeService';
import { GmailService } from '../../services/gmailService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { ProductImageUploader } from '../../components/admin/ProductImageUploader';

interface AdminPortalProps {
  onBackToStore: () => void;
  onLockAdmin?: () => void;
  categories: Category[];
  initialProducts: Product[];
  settings: StoreSettings | null;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'overview' | 'products' | 'orders' | 'inventory' | 'gmail' | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToStore,
  onLockAdmin,
  categories,
  initialProducts,
  settings: initialSettings,
  onRefreshData,
}) => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    isOwner,
    isCloudOwner,
    isDemoUser,
    loginAsDemoAdmin,
    signInWithGoogle,
    connectGmail,
    disconnectGmail,
    isGmailConnected,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(initialSettings);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Admin Order Cancellation State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState('Customer requested cancellation via phone/WhatsApp');
  const [adminCancelCustomNote, setAdminCancelCustomNote] = useState('');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Gmail Notifications state
  const [gmailLogs, setGmailLogs] = useState<GmailNotificationLog[]>(() => GmailService.getLogs());
  const [testEmailRecipient, setTestEmailRecipient] = useState('ibraheemtalat2014@gmail.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [sendingOrderEmailId, setSendingOrderEmailId] = useState<string | null>(null);

  const refreshGmailLogs = () => {
    setGmailLogs(GmailService.getLogs());
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await GmailService.sendTestEmail(testEmailRecipient);
      if (res.success) {
        showToast(`Test email dispatched successfully to ${testEmailRecipient}!`, 'success');
      } else {
        showToast(res.error || 'Failed to dispatch test email', 'error');
      }
      refreshGmailLogs();
    } catch (err: any) {
      showToast(err.message || 'Error sending test email', 'error');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSendOrderEmail = async (order: Order) => {
    setSendingOrderEmailId(order.id);
    try {
      const res = await GmailService.sendNewOrderNotifications(order);
      if (res.customerSent || res.ownerSent) {
        showToast(`Order details emailed via Gmail to ${order.customerEmail}!`, 'success');
      } else {
        showToast(res.errors?.[0] || 'Order notification queued', 'info');
      }
      refreshGmailLogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch email', 'error');
    } finally {
      setSendingOrderEmailId(null);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      const token = await connectGmail();
      if (token) {
        showToast('Google Workspace Gmail successfully authorized!', 'success');
      } else {
        showToast('Gmail authorization completed.', 'info');
      }
      refreshGmailLogs();
    } catch (err: any) {
      showToast(err.message || 'Gmail connection cancelled or failed', 'error');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  // Filter & Search states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Modals
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);

  // InDrive dispatch modal state
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [indriveTrackingId, setIndriveTrackingId] = useState('');

  // Sync products
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Load all orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const ords = await StoreService.getAllOrders();
      setOrders(ords);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Dashboard calculations
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const inTransitCount = orders.filter((o) => o.orderStatus === 'shipped').length;

  const lowStockVariants = products.flatMap((p) =>
    p.variants
      .filter((v) => v.stock <= 3)
      .map((v) => ({
        productName: p.name,
        productId: p.id,
        color: v.color,
        size: v.size,
        stock: v.stock,
      }))
  );

  // ----------------------------------------------------
  // Product CRUD
  // ----------------------------------------------------
  const handleOpenAddProduct = () => {
    setEditingProduct({
      name: '',
      description: '',
      regularPrice: 2999,
      salePrice: 0,
      gender: 'men',
      category: categories[0]?.id || 'men-eastern',
      subcategory: 'Shalwar Kameez',
      fabric: 'Wash & Wear Cotton',
      careInstructions: 'Machine wash cool, tumble dry low',
      colors: ['White', 'Black'],
      sizes: ['M', 'L', 'XL'],
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
      ],
      variants: [
        {
          id: `var-${Date.now()}-1`,
          size: 'M',
          color: 'White',
          stock: 10,
          sku: 'JG-M-WHT-01',
        },
        {
          id: `var-${Date.now()}-2`,
          size: 'L',
          color: 'White',
          stock: 10,
          sku: 'JG-L-WHT-02',
        },
      ],
      isActive: true,
      isFeatured: false,
      isNewArrival: true,
      rating: 5.0,
      reviewCount: 0,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    const productToSave = {
      ...editingProduct,
      images:
        editingProduct.images && editingProduct.images.length > 0
          ? editingProduct.images
          : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
    };

    try {
      if (editingProduct.id) {
        await StoreService.updateProduct(editingProduct.id, productToSave);
        showToast('Product updated successfully!', 'success');
      } else {
        await StoreService.createProduct(productToSave as any);
        showToast('New garment added to catalog!', 'success');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await StoreService.deleteProduct(id);
      showToast('Product deleted from database.', 'info');
      await onRefreshData();
    } catch (err: any) {
      showToast('Failed to delete product.', 'error');
    }
  };

  // ----------------------------------------------------
  // Order Status Updates & InDrive Dispatch
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await StoreService.updateOrderStatus(orderId, newStatus);
      const targetOrder = orders.find((o) => o.id === orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      showToast(`Order status updated to "${newStatus}".`, 'success');

      if (targetOrder) {
        const updated = { ...targetOrder, orderStatus: newStatus };
        try {
          await GmailService.sendOrderStatusUpdate(updated, newStatus);
          refreshGmailLogs();
        } catch (mailErr) {
          console.warn('Gmail status notify notice:', mailErr);
        }
      }
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    }
  };

  const handleSaveInDriveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch) return;

    const tracking = indriveTrackingId.trim() || `IND-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await StoreService.updateOrderStatus(
        selectedOrderForDispatch.id,
        'shipped',
        tracking
      );
      const updatedOrder = {
        ...selectedOrderForDispatch,
        orderStatus: 'shipped' as OrderStatus,
        trackingNumber: tracking,
      };
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrderForDispatch.id ? updatedOrder : o))
      );
      showToast('InDrive rider assigned and order dispatched!', 'success');

      // Dispatch Gmail notification to customer and owner
      try {
        await GmailService.sendOrderStatusUpdate(
          updatedOrder,
          'shipped',
          `Dispatched with InDrive rider (${riderName || 'Express Rider'}, Phone: ${riderPhone || 'Lahore Dispatch Team'}). Tracking Reference: ${tracking}`
        );
        refreshGmailLogs();
      } catch (mailErr) {
        console.warn('Gmail InDrive notification notice:', mailErr);
      }

      setSelectedOrderForDispatch(null);
    } catch (err) {
      showToast('Failed to assign rider.', 'error');
    }
  };

  // ----------------------------------------------------
  // Admin Order Cancellation
  // ----------------------------------------------------
  const handleAdminConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToCancel) return;
    setIsCancellingOrder(true);
    try {
      const fullReason =
        adminCancelReason === 'Other reason'
          ? adminCancelCustomNote.trim() || 'Admin cancelled'
          : adminCancelCustomNote.trim()
          ? `${adminCancelReason} - ${adminCancelCustomNote.trim()}`
          : adminCancelReason;

      await StoreService.cancelOrder(orderToCancel.id, fullReason, 'admin');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderToCancel.id
            ? { ...o, status: 'cancelled', orderStatus: 'cancelled' }
            : o
        )
      );
      showToast(`Order #${orderToCancel.orderNumber} cancelled successfully.`, 'info');

      // Send status update email via Gmail
      try {
        const updatedOrder = {
          ...orderToCancel,
          orderStatus: 'cancelled' as OrderStatus,
          status: 'cancelled' as OrderStatus,
        };
        await GmailService.sendOrderStatusUpdate(
          updatedOrder,
          'cancelled',
          `Order was cancelled by store management: ${fullReason}`
        );
        refreshGmailLogs();
      } catch (mailErr) {
        console.warn('Mail notification notice:', mailErr);
      }

      setOrderToCancel(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel order.', 'error');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // ----------------------------------------------------
  // Quick Variant Stock Update
  // ----------------------------------------------------
  const handleQuickStockChange = async (
    product: Product,
    variantId: string,
    newStock: number
  ) => {
    if (newStock < 0) return;
    try {
      const updatedVariants = product.variants.map((v) =>
        v.id === variantId ? { ...v, stock: newStock } : v
      );
      await StoreService.updateProduct(product.id, { variants: updatedVariants });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, variants: updatedVariants } : p))
      );
      showToast('Variant stock saved.', 'success');
    } catch (err) {
      showToast('Failed to update stock.', 'error');
    }
  };

  // ----------------------------------------------------
  // Settings Update
  // ----------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await StoreService.updateStoreSettings(settings);
      showToast('Store settings updated!', 'success');
    } catch (err) {
      showToast('Failed to update settings.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-left">
      {/* Admin Top Navigation */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 transition-colors shadow-xs"
              title="Navigate to Customer View (?view=store)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
              <span className="hidden md:inline font-mono text-[10px] text-zinc-400">?view=store</span>
            </button>
            <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-serif-brand font-bold text-lg text-zinc-900 dark:text-white">
                Jahan Grments Admin
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded">
                Store Owner Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?view=admin`);
                showToast('Admin URL copied: ?view=admin', 'success');
              }}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Copy direct URL to Admin View"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>?view=admin</span>
            </button>

            {onLockAdmin && (
              <button
                type="button"
                onClick={onLockAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-xs"
                title="Lock admin portal (requires store.of.jahan passcode)"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Admin</span>
              </button>
            )}

            <span className="hidden lg:inline text-zinc-500">
              Admin: <strong>{userProfile?.displayName || currentUser?.email}</strong>
            </span>
            <button
              onClick={async () => {
                await onRefreshData();
                await fetchOrders();
                showToast('Store data re-synced.', 'info');
              }}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Store Owner Authentication & Quick Actions Banner */}
      <div className="bg-zinc-900 text-white px-4 sm:px-8 py-2.5 text-xs border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudOwner
                  ? 'bg-emerald-400 animate-pulse'
                  : isDemoUser
                  ? 'bg-amber-400'
                  : 'bg-zinc-500'
              }`}
            />
            <span className="text-zinc-300">
              Store Owner: <strong className="text-white">ibraheemtalat2014@gmail.com</strong>
            </span>

            {isCloudOwner ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <span>●</span> Live Cloud Sync Active
              </span>
            ) : isDemoUser ? (
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-medium flex items-center gap-1">
                <span>●</span> Demo Sandbox (Instant Local Edits)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                Preview Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isCloudOwner && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    showToast('Signed in to Live Firebase as Store Owner!', 'success');
                  } catch (err: any) {
                    showToast(err.message || 'Google sign in cancelled or failed', 'info');
                  }
                }}
                className="px-2.5 py-1 rounded bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Sign In</span>
              </button>
            )}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => {
                  loginAsDemoAdmin();
                  showToast('Entered Store Owner Demo Sandbox!', 'success');
                }}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] transition-colors"
              >
                Demo Admin Access
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                handleOpenAddProduct();
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'inventory', label: 'Variant Inventory Matrix', icon: Sliders },
            {
              id: 'gmail',
              label: 'Gmail Notifications',
              icon: Mail,
              badge: isGmailConnected ? 'Live' : 'Active',
            },
            { id: 'settings', label: 'Store Settings (Lahore)', icon: SettingsIcon },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-zinc-900 text-white dark:bg-amber-100 dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      t.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* ======================================================== */}
        {/* 1. OVERVIEW TAB */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Total Revenue (PKR)
                </span>
                <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                  Rs. {totalRevenue.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">From completed & pending orders</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Total Orders
                </span>
                <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                  {orders.length}
                </div>
                <p className="text-[11px] text-amber-600 mt-1">
                  {pendingOrdersCount} pending verification
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  InDrive In Transit
                </span>
                <div className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-400">
                  {inTransitCount}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Active deliveries on Lahore roads</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Low Stock Variants
                </span>
                <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {lowStockVariants.length}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Variants with 3 or fewer items</p>
              </div>
            </div>

            {/* Low Stock Warning Banner */}
            {lowStockVariants.length > 0 && (
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Low Stock Alert for {lowStockVariants.length} Variants</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockVariants.slice(0, 6).map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium text-[11px]"
                    >
                      {item.productName} ({item.color}/{item.size}) — <strong>{item.stock} left</strong>
                    </span>
                  ))}
                  {lowStockVariants.length > 6 && (
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="text-rose-700 dark:text-rose-300 font-bold underline text-xs"
                    >
                      +{lowStockVariants.length - 6} more in Inventory tab
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recent Orders Overview */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Recent Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-amber-900 dark:text-amber-400 font-semibold hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No orders recorded yet. Test an order from the storefront!
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {orders.slice(0, 5).map((ord) => (
                    <div
                      key={ord.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900 dark:text-white">
                            {ord.orderNumber}
                          </span>
                          <span className="text-zinc-500">
                            • {ord.customerName} ({ord.shippingAddress.phone})
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {ord.shippingAddress.area}, Lahore • {ord.items.length} items • COD: Rs.{' '}
                          {ord.totalAmount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.orderStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ord.orderStatus === 'shipped'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : ord.orderStatus === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>

                        <button
                          onClick={() => {
                            setActiveTab('orders');
                            setOrderSearch(ord.orderNumber);
                          }}
                          className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 text-[11px] font-medium"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ORDERS MANAGEMENT TAB */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-zinc-900 dark:text-white">
                  Order Management
                </h2>
                <p className="text-xs text-zinc-500">
                  Update statuses, schedule InDrive riders, and verify Cash on Delivery payments
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer name, phone..."
                  className="py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs w-64"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">InDrive Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="p-4">Order # / Date</th>
                      <th className="p-4">Customer & Phone</th>
                      <th className="p-4">Lahore Address</th>
                      <th className="p-4">Garments Ordered</th>
                      <th className="p-4">COD Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {orders
                      .filter((o) => {
                        if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) {
                          return false;
                        }
                        if (orderSearch.trim()) {
                          const q = orderSearch.toLowerCase();
                          return (
                            o.orderNumber.toLowerCase().includes(q) ||
                            o.customerName.toLowerCase().includes(q) ||
                            o.customerPhone.includes(q) ||
                            o.shippingAddress.area.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="p-4">
                            <span className="font-mono font-bold text-zinc-900 dark:text-white">
                              {o.orderNumber}
                            </span>
                            <div className="text-[10px] text-zinc-400">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-900 dark:text-white">
                              {o.customerName}
                            </div>
                            <div className="text-zinc-500">{o.customerPhone}</div>
                          </td>
                          <td className="p-4 max-w-[200px]">
                            <div className="font-medium text-zinc-800 dark:text-zinc-200">
                              {o.shippingAddress.area}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {o.shippingAddress.streetAddress}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1 max-w-[200px]">
                              {o.items.map((i) => (
                                <div key={i.variantId} className="truncate text-zinc-700 dark:text-zinc-300">
                                  {i.quantity}x {i.productName} ({i.color}/{i.size})
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-amber-900 dark:text-amber-300">
                              Rs. {o.totalAmount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-zinc-400 uppercase">COD</div>
                          </td>
                          <td className="p-4">
                            <select
                              value={o.orderStatus}
                              onChange={(e) =>
                                handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)
                              }
                              className={`py-1 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                                o.orderStatus === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                  : o.orderStatus === 'shipped'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300'
                                  : o.orderStatus === 'cancelled'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">InDrive Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleSendOrderEmail(o)}
                                disabled={sendingOrderEmailId === o.id}
                                className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Send order confirmation and invoice email via Gmail"
                              >
                                <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{sendingOrderEmailId === o.id ? 'Sending...' : 'Email'}</span>
                              </button>

                              {o.orderStatus !== 'shipped' && o.orderStatus !== 'delivered' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderForDispatch(o);
                                    setIndriveTrackingId(
                                      o.trackingNumber ||
                                        `IND-${Math.floor(100000 + Math.random() * 900000)}`
                                    );
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow-xs"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Dispatch Rider</span>
                                </button>
                              )}

                              {o.orderStatus !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderToCancel(o);
                                    setAdminCancelReason('Customer requested cancellation via phone/WhatsApp');
                                    setAdminCancelCustomNote('');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                                  title="Cancel this order"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. PRODUCTS MANAGEMENT TAB */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-zinc-900 dark:text-white">
                  Product Catalog
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage clothing garments, imagery, prices, and variant combinations
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter garments..."
                  className="py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs w-52"
                />
                <button
                  onClick={handleOpenAddProduct}
                  className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Garment</span>
                </button>
              </div>
            </div>

            {/* Product Table */}
            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="p-4">Image</th>
                      <th className="p-4">Garment Title</th>
                      <th className="p-4">Audience / Category</th>
                      <th className="p-4">Price (PKR)</th>
                      <th className="p-4">Variants & Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {products
                      .filter((p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.category.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((p) => {
                        const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);

                        return (
                          <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                            <td className="p-4">
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-12 h-14 object-cover rounded-xl bg-zinc-100"
                              />
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-zinc-900 dark:text-white">{p.name}</div>
                              <div className="text-[11px] text-zinc-500">
                                Fabric: {p.fabric || 'Standard'}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="capitalize font-semibold text-zinc-800 dark:text-zinc-200">
                                {p.gender}
                              </span>
                              <div className="text-[11px] text-zinc-400">
                                {p.subcategory || p.category}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-zinc-950 dark:text-amber-300">
                                Rs. {(p.salePrice || p.regularPrice).toLocaleString()}
                              </div>
                              {p.salePrice && p.salePrice < p.regularPrice && (
                                <div className="text-[10px] text-zinc-400 line-through">
                                  Rs. {p.regularPrice.toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-zinc-900 dark:text-white">
                                {totalStock} total items
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                {p.variants.length} variant combinations
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  p.isActive
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-zinc-200 text-zinc-600'
                                }`}
                              >
                                {p.isActive ? 'Active' : 'Draft'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. VARIANT INVENTORY MATRIX TAB */}
        {/* ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-zinc-900 dark:text-white">
                Variant Inventory Matrix
              </h2>
              <p className="text-xs text-zinc-500">
                View real-time stock levels and perform quick stock adjustments for each Color + Size variant
              </p>
            </div>

            <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase font-bold text-zinc-500">
                    <tr>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Color</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4">Stock Status</th>
                      <th className="p-4 text-right">Quick Stock Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {products.flatMap((prod) =>
                      prod.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="p-4 font-semibold text-zinc-900 dark:text-white">
                            {prod.name}
                          </td>
                          <td className="p-4 font-medium text-zinc-700 dark:text-zinc-300">
                            {v.color}
                          </td>
                          <td className="p-4 font-bold text-zinc-900 dark:text-white">
                            {v.size}
                          </td>
                          <td className="p-4 font-mono text-[11px] text-zinc-400">
                            {v.sku}
                          </td>
                          <td className="p-4 font-bold text-sm">
                            {v.stock}
                          </td>
                          <td className="p-4">
                            {v.stock <= 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Out of Stock
                              </span>
                            ) : v.stock <= 3 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Optimal
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  handleQuickStockChange(prod, v.id, Math.max(0, v.stock - 1))
                                }
                                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold">{v.stock}</span>
                              <button
                                onClick={() => handleQuickStockChange(prod, v.id, v.stock + 1)}
                                className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. STORE SETTINGS TAB */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="font-serif-brand text-2xl font-bold text-zinc-900 dark:text-white">
                Store Settings & Lahore Delivery
              </h2>
              <p className="text-xs text-zinc-500">
                Configure WhatsApp support contact, InDrive local dispatch rates, and announcement messaging
              </p>
            </div>

            {settings && (
              <form
                onSubmit={handleSaveSettings}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5 text-xs"
              >
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Store Brand Name
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      WhatsApp Support Number
                    </label>
                    <input
                      type="text"
                      value={settings.whatsappNumber}
                      onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      placeholder="03001234567"
                      className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Lahore InDrive Delivery Fee (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.deliveryFeeLahore}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryFeeLahore: Number(e.target.value),
                        })
                      }
                      className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Free Delivery Threshold (PKR)
                  </label>
                  <input
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        freeDeliveryThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Orders at or above this amount receive free delivery in Lahore
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Store Physical Address
                  </label>
                  <input
                    type="text"
                    value={settings.storeAddress}
                    onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Top Announcement Bar Message
                  </label>
                  <textarea
                    rows={2}
                    value={settings.announcementText}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-zinc-900 dark:bg-amber-100 hover:bg-zinc-800 text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Store Settings</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. GMAIL NOTIFICATIONS TAB */}
        {/* ======================================================== */}
        {activeTab === 'gmail' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif-brand text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
                  <Mail className="w-6 h-6 text-amber-500" />
                  <span>Gmail Notifications Hub</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Automated email routing for customer receipts, InDrive rider dispatches, and store owner alerts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshGmailLogs}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Feed</span>
                </button>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Google Workspace Connection
                    </span>
                    {isGmailConnected ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Gmail API Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Authorization Ready
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-zinc-900 dark:text-white">
                    Store Owner Account:{' '}
                    <span className="font-mono text-amber-800 dark:text-amber-400 font-semibold">
                      ibraheemtalat2014@gmail.com
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    All notifications and customer order confirmations are sent from this verified Google account with official store styling.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isGmailConnected ? (
                    <>
                      <button
                        type="button"
                        onClick={handleConnectGmail}
                        disabled={isConnectingGmail}
                        className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors"
                      >
                        {isConnectingGmail ? 'Re-authorizing...' : 'Refresh Token'}
                      </button>
                      <button
                        type="button"
                        onClick={disconnectGmail}
                        className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGmail}
                      disabled={isConnectingGmail}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>{isConnectingGmail ? 'Connecting...' : 'Authorize Google Account for Gmail'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Instant Test Dispatcher */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
                <div className="text-xs font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-500" />
                  <span>Send Immediate Test Email</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Recipient email address..."
                    className="w-full sm:flex-1 py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail || !testEmailRecipient.trim()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingTestEmail ? 'Dispatching...' : 'Send Live Test Email'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Sends a formatted verification message to confirm RFC 2822 encoding and Gmail API delivery.
                </p>
              </div>
            </div>

            {/* Automated Workflow Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                  Customer Receipt
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Sent immediately on checkout to customer's email with itemized garment sizes, colors, and Lahore COD invoice.
                </p>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  ● Automatic Trigger
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                  Owner Order Alert
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Instant alert dispatched to <strong className="text-zinc-700 dark:text-zinc-300">ibraheemtalat2014@gmail.com</strong> with customer phone and address.
                </p>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                  ● Automatic Trigger
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                  InDrive Dispatch Notice
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Triggered when you assign a Lahore rider. Includes tracking reference and rider contact info.
                </p>
                <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">
                  ● Dispatch Trigger
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                  Status Milestones
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Automated emails whenever an order status is updated to Confirmed, Processing, or Delivered.
                </p>
                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                  ● Status Trigger
                </div>
              </div>
            </div>

            {/* Notification Activity Log Table */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Recent Gmail Notification Dispatches ({gmailLogs.length})
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Live log of all customer emails and store owner alerts
                  </p>
                </div>

                {gmailLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      GmailService.clearLogs();
                      refreshGmailLogs();
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {gmailLogs.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  No Gmail notifications dispatched in this session yet. Place a test order or click "Send Live Test Email" above to view live dispatches.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase font-bold text-zinc-500">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {gmailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="p-3 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString('en-PK', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase">
                              {log.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">
                            <div>{log.recipient}</div>
                            <div className="text-[10px] text-zinc-400 capitalize">
                              {log.recipientType}
                            </div>
                          </td>
                          <td className="p-3 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                            {log.subject}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                                log.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : log.status === 'queued'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {log.status === 'sent' && '✓ Sent'}
                              {log.status === 'queued' && '⏳ Queued'}
                              {log.status === 'failed' && '✕ Failed'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                showToast(`Resending to ${log.recipient}...`, 'info');
                                await GmailService.sendEmail(
                                  log.recipient,
                                  log.subject,
                                  `<div>Resent notification: ${log.subject}</div>`,
                                  { type: log.type, recipientType: log.recipientType }
                                );
                                refreshGmailLogs();
                                showToast('Resent via Gmail!', 'success');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium"
                            >
                              Resend
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ======================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              {editingProduct.id ? 'Edit Garment' : 'Add New Garment'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Garment Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Royal Embroidered Wash & Wear Kurta"
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Target Audience *</label>
                  <select
                    value={editingProduct.gender || 'men'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, gender: e.target.value as Gender })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 capitalize"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editingProduct.subcategory || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, subcategory: e.target.value })
                    }
                    placeholder="e.g. Shalwar Kameez, Frock"
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Regular Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.regularPrice || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        regularPrice: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Sale Price (PKR) (0 for regular)</label>
                  <input
                    type="number"
                    value={editingProduct.salePrice || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        salePrice: Number(e.target.value),
                      })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  placeholder="Describe stitching quality, detailing, embroidery..."
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Fabric & Material</label>
                  <input
                    type="text"
                    value={editingProduct.fabric || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, fabric: e.target.value })
                    }
                    placeholder="e.g. 100% Combed Cotton"
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Care Instructions</label>
                  <input
                    type="text"
                    value={editingProduct.careInstructions || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, careInstructions: e.target.value })
                    }
                    placeholder="e.g. Machine wash cold"
                    className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
              </div>

              {/* Product Picture Management (Upload, URL, Presets & Gallery) */}
              <div className="pt-2">
                <ProductImageUploader
                  images={editingProduct.images || []}
                  onChange={(newImages) =>
                    setEditingProduct({
                      ...editingProduct,
                      images: newImages,
                    })
                  }
                  maxImages={6}
                />
              </div>

              {/* Variant Stock Management */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    Garment Variants (Color + Size + Stock)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: ProductVariant = {
                        id: `var-${Date.now()}`,
                        color: editingProduct.colors?.[0] || 'White',
                        size: 'M',
                        stock: 5,
                        sku: `JG-VAR-${Date.now().toString().slice(-4)}`,
                      };
                      setEditingProduct({
                        ...editingProduct,
                        variants: [...(editingProduct.variants || []), newVar],
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold text-amber-900 dark:text-amber-300"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editingProduct.variants?.map((v, idx) => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 grid grid-cols-4 gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="Color"
                        value={v.color}
                        onChange={(e) => {
                          const updated = [...(editingProduct.variants || [])];
                          updated[idx] = { ...v, color: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="py-1 px-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Size"
                        value={v.size}
                        onChange={(e) => {
                          const updated = [...(editingProduct.variants || [])];
                          updated[idx] = { ...v, size: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="py-1 px-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.stock}
                        onChange={(e) => {
                          const updated = [...(editingProduct.variants || [])];
                          updated[idx] = { ...v, stock: Number(e.target.value) };
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="py-1 px-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingProduct.variants?.filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="text-rose-600 hover:text-rose-700 font-bold text-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-bold"
                >
                  Save Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INDRIVE RIDER DISPATCH */}
      {/* ======================================================== */}
      {selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <button
              onClick={() => setSelectedOrderForDispatch(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-900 dark:text-amber-400" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Dispatch InDrive Rider
              </h3>
            </div>

            <p className="text-xs text-zinc-500">
              Assigning rider for order <strong>{selectedOrderForDispatch.orderNumber}</strong> destined for{' '}
              <strong>{selectedOrderForDispatch.shippingAddress.area}, Lahore</strong>.
            </p>

            <form onSubmit={handleSaveInDriveDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Rider Phone Number</label>
                <input
                  type="tel"
                  required
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  placeholder="0312-3456789"
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">InDrive Tracking / Ride ID</label>
                <input
                  type="text"
                  value={indriveTrackingId}
                  onChange={(e) => setIndriveTrackingId(e.target.value)}
                  placeholder="IND-829104"
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px]">
                Rider will collect <strong>Rs. {selectedOrderForDispatch.totalAmount.toLocaleString()}</strong> in cash from the customer upon delivery.
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDispatch(null)}
                  className="flex-1 py-2.5 rounded-xl border font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-bold"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL: ADMIN CANCEL ORDER */}
      {/* ======================================================== */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs text-left">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <button
              type="button"
              onClick={() => setOrderToCancel(null)}
              disabled={isCancellingOrder}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Admin Action
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Cancel Order #{orderToCancel.orderNumber}
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {orderToCancel.shippingAddress.fullName} ({orderToCancel.shippingAddress.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Destination:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {orderToCancel.shippingAddress.area}, Lahore
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total COD:</span>
                <span className="font-bold text-amber-900 dark:text-amber-300">
                  Rs. {orderToCancel.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleAdminConfirmCancel} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={adminCancelReason}
                  onChange={(e) => setAdminCancelReason(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                >
                  <option value="Customer requested cancellation via phone/WhatsApp">
                    Customer requested cancellation (Phone / WhatsApp)
                  </option>
                  <option value="Fabric / size out of stock in Gulberg workshop">
                    Fabric / size out of stock in Gulberg workshop
                  </option>
                  <option value="Customer unreachable on phone for COD verification">
                    Customer unreachable on phone for COD verification
                  </option>
                  <option value="Delivery address incomplete / outside service area">
                    Delivery address incomplete / outside service area
                  </option>
                  <option value="Suspected fake or duplicate test order">
                    Suspected fake or duplicate test order
                  </option>
                  <option value="Customer refused order upon dispatch contact">
                    Customer refused order upon dispatch contact
                  </option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Admin Internal Notes / Explanations
                </label>
                <textarea
                  rows={2}
                  value={adminCancelCustomNote}
                  onChange={(e) => setAdminCancelCustomNote(e.target.value)}
                  placeholder="Provide additional details regarding why this order is cancelled..."
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-[11px]">
                Cancelling this order immediately notifies the customer view, stops InDrive dispatch, and sends an updated cancellation email via Gmail.
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={isCancellingOrder}
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Keep Order Active
                </button>
                <button
                  type="submit"
                  disabled={isCancellingOrder}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {isCancellingOrder ? 'Cancelling...' : 'Confirm Order Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
