import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider, useToast } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { ProductQuickView } from './components/product/ProductQuickView';
import { AuthModal } from './pages/AuthModal';

import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutUsPage, FAQPage, ContactPage, TermsPrivacyPage } from './pages/InformationalPages';
import { AdminPortal } from './pages/admin/AdminPortal';
import { AdminPasswordGate } from './components/admin/AdminPasswordGate';

import { StoreService } from './services/storeService';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_SETTINGS,
  seedDatabaseIfEmpty,
} from './firebase/seed';
import { Product, Category, Banner, StoreSettings, Order } from './types';

// Helper to determine page & param from window location URL
const getPageFromCurrentUrl = (): { page: string; param: string } => {
  try {
    // 1. Explicit standalone Admin Website mode via env variable
    if (import.meta.env.VITE_APP_MODE === 'admin') {
      return { page: 'admin', param: '' };
    }

    // 2. Subdomain routing (e.g., admin.jahangarments.com or admin-*)
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.startsWith('admin.') || hostname.startsWith('admin-')) {
      return { page: 'admin', param: '' };
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const page = params.get('page');
    const param = params.get('param') || '';
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (view === 'admin' || pathname === '/admin' || hash === '#/admin' || hash === '#admin') {
      return { page: 'admin', param: '' };
    }
    if (page) {
      return { page, param };
    }
    if (view === 'store' || view === 'customer' || view === 'home') {
      return { page: 'home', param: '' };
    }
  } catch (err) {
    console.warn('URL parse notice:', err);
  }
  return { page: 'home', param: '' };
};

// Helper to push state to browser URL
const updateBrowserUrl = (page: string, param?: string) => {
  try {
    const url = new URL(window.location.href);
    if (page === 'admin') {
      url.searchParams.set('view', 'admin');
      url.searchParams.delete('page');
      url.searchParams.delete('param');
    } else {
      url.searchParams.set('view', 'store');
      if (page === 'home') {
        url.searchParams.delete('page');
        url.searchParams.delete('param');
      } else {
        url.searchParams.set('page', page);
        if (param) {
          url.searchParams.set('param', param);
        } else {
          url.searchParams.delete('param');
        }
      }
    }
    window.history.pushState(null, '', url.toString());
  } catch (err) {
    console.warn('URL update notice:', err);
  }
};

function StoreApp() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const { setIsCartOpen } = useCart();

  // Initial routing from URL
  const initialNav = getPageFromCurrentUrl();
  const [currentPage, setCurrentPage] = useState<string>(initialNav.page);
  const [pageParam, setPageParam] = useState<string>(initialNav.param);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Admin password gate session state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('jg_admin_unlocked') === 'true' ||
        sessionStorage.getItem('jg_admin_unlocked') === 'true'
      );
    } catch {
      return false;
    }
  });

  // Store data states - initialize immediately with zero blocking delay
  const [products, setProducts] = useState<Product[]>(() =>
    StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS)
  );
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Manual refresh helper
  const loadStoreData = async () => {
    try {
      const [prods, cats, bans, sets] = await Promise.all([
        StoreService.getActiveProducts(),
        StoreService.getCategories(),
        StoreService.getActiveBanners(),
        StoreService.getStoreSettings(),
      ]);

      if (prods && prods.length > 0) setProducts(prods);
      if (cats && cats.length > 0) setCategories(cats);
      if (bans && bans.length > 0) setBanners(bans);
      if (sets) setSettings(sets);
    } catch (err) {
      console.warn('Store data background refresh notice:', err);
    }
  };

  useEffect(() => {
    // 1. Subscribe to real-time updates for products, categories, banners, settings
    const unsubProducts = StoreService.subscribeProducts((prods) => {
      if (prods && prods.length > 0) setProducts(prods);
    });
    const unsubCategories = StoreService.subscribeCategories((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
    const unsubBanners = StoreService.subscribeBanners((bans) => {
      if (bans && bans.length > 0) setBanners(bans);
    });
    const unsubSettings = StoreService.subscribeSettings((sets) => {
      if (sets) setSettings(sets);
    });

    // 2. Initial background sync & optional seed check without blocking UI
    seedDatabaseIfEmpty().catch(() => {});

    // 3. Listen to browser history navigation (back/forward)
    const handlePopState = () => {
      const { page, param } = getPageFromCurrentUrl();
      setCurrentPage(page);
      setPageParam(param);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubProducts?.();
      unsubCategories?.();
      unsubBanners?.();
      unsubSettings?.();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Navigation helper with bidirectional URL synchronization
  const navigate = (page: string, param?: string) => {
    setCurrentPage(page);
    setPageParam(param || '');
    updateBrowserUrl(page, param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle product page routing
    if (page === 'product' && param) {
      const prod = products.find((p) => p.id === param);
      if (prod) {
        setSelectedProduct(prod);
      }
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product');
    setPageParam(product.id);
    updateBrowserUrl('product', product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: Order) => {
    setLatestPlacedOrder(order);
    setCurrentPage('order-confirmation');
    updateBrowserUrl('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    const storeUrl = import.meta.env.VITE_STORE_URL;
    if (storeUrl) {
      window.location.href = storeUrl;
      return;
    }
    if (import.meta.env.VITE_APP_MODE === 'admin') {
      showToast('This website is running as a standalone Admin Portal.', 'info');
      return;
    }
    navigate('home');
  };

  // If currently in Admin Portal view
  if (currentPage === 'admin') {
    // Check password protection: store.of.jahan
    if (!isAdminUnlocked) {
      return (
        <AdminPasswordGate
          onUnlock={() => {
            setIsAdminUnlocked(true);
            showToast('Admin access verified. Welcome to Jahan Garments!', 'success');
          }}
          onBackToStore={handleBackToStore}
        />
      );
    }

    return (
      <AdminPortal
        onBackToStore={handleBackToStore}
        onLockAdmin={() => {
          try {
            localStorage.removeItem('jg_admin_unlocked');
            sessionStorage.removeItem('jg_admin_unlocked');
          } catch {}
          setIsAdminUnlocked(false);
          showToast('Admin session locked.', 'info');
        }}
        categories={categories}
        initialProducts={products}
        settings={settings}
        onRefreshData={loadStoreData}
      />
    );
  }

  // Parse catalog params if applicable
  const catalogGender = pageParam.startsWith('gender=')
    ? pageParam.split('=')[1]
    : undefined;
  const catalogFilter = pageParam.startsWith('filter=')
    ? pageParam.split('=')[1]
    : undefined;
  const catalogSearch = pageParam.startsWith('search=')
    ? decodeURIComponent(pageParam.split('=')[1])
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Navigation Header */}
      <Navbar
        onNavigate={navigate}
        currentPage={currentPage}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        products={products}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            banners={banners}
            onNavigate={navigate}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentPage === 'catalog' && (
          <CatalogPage
            products={products}
            categories={categories}
            initialGender={catalogGender}
            initialFilter={catalogFilter}
            initialSearch={catalogSearch}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentPage === 'product' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            allProducts={products}
            onSelectProduct={handleSelectProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onOrderSuccess={handleOrderSuccess}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'order-confirmation' && latestPlacedOrder && (
          <OrderConfirmationPage
            order={latestPlacedOrder}
            onNavigate={navigate}
          />
        )}

        {(currentPage === 'track-order' || currentPage === 'orders') && (
          <OrderTrackingPage
            initialOrderNumber={pageParam || undefined}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'account' && (
          <CustomerAccountPage
            onNavigate={navigate}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentPage === 'wishlist' && (
          <WishlistPage
            onSelectProduct={handleSelectProduct}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'about' && <AboutUsPage />}
        {currentPage === 'faq' && <FAQPage />}
        {currentPage === 'contact' && <ContactPage />}
        {(currentPage === 'privacy' || currentPage === 'terms') && <TermsPrivacyPage />}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigate} settings={settings} />

      {/* Persistent Slide-Out Cart Drawer */}
      <CartDrawer
        onCheckout={() => navigate('checkout')}
        onExplore={() => navigate('catalog')}
      />

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onViewFullDetails={handleSelectProduct}
      />

      {/* Customer Auth Modal (Sign in / Register / Forgot / Demo) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <StoreApp />
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
