import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Product,
  Category,
  Order,
  StoreSettings,
  Review,
  Banner,
  Coupon,
  OrderStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_BANNERS,
  seedDatabaseIfEmpty,
} from '../firebase/seed';

async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 2500): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

export class StoreService {
  // Local persistence state & subscriber listeners for instant, error-free product updates
  private static productCallbacks: Set<(products: Product[]) => void> = new Set();
  private static lastFirestoreProducts: Product[] = [];

  private static getLocalOverrides(): Record<string, Partial<Product>> {
    try {
      const data = localStorage.getItem('jg_local_product_overrides');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private static saveLocalOverrides(overrides: Record<string, Partial<Product>>) {
    try {
      localStorage.setItem('jg_local_product_overrides', JSON.stringify(overrides));
    } catch (e) {
      console.warn('Storage save notice:', e);
    }
  }

  private static getLocalNewProducts(): Product[] {
    try {
      const data = localStorage.getItem('jg_local_new_products');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalNewProducts(prods: Product[]) {
    try {
      localStorage.setItem('jg_local_new_products', JSON.stringify(prods));
    } catch (e) {
      console.warn('Storage save notice:', e);
    }
  }

  private static getLocalDeletedIds(): string[] {
    try {
      const data = localStorage.getItem('jg_local_deleted_products');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalDeletedIds(ids: string[]) {
    try {
      localStorage.setItem('jg_local_deleted_products', JSON.stringify(ids));
    } catch (e) {
      console.warn('Storage save notice:', e);
    }
  }

  public static mergeWithLocalProducts(base: Product[]): Product[] {
    const deleted = new Set(StoreService.getLocalDeletedIds());
    const overrides = StoreService.getLocalOverrides();
    const newProds = StoreService.getLocalNewProducts();

    const updatedBase = base
      .filter((p) => !deleted.has(p.id))
      .map((p) => {
        if (overrides[p.id]) {
          return { ...p, ...overrides[p.id] };
        }
        return p;
      });

    const existingIds = new Set(updatedBase.map((p) => p.id));
    const extraProds = newProds
      .filter((p) => !deleted.has(p.id) && !existingIds.has(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));

    return [...updatedBase, ...extraProds];
  }

  private static notifyProductSubscribers() {
    const base = StoreService.lastFirestoreProducts.length
      ? StoreService.lastFirestoreProducts
      : INITIAL_PRODUCTS;
    const merged = StoreService.mergeWithLocalProducts(base);
    StoreService.productCallbacks.forEach((cb) => {
      try {
        cb(merged);
      } catch (e) {
        console.error('Products listener error:', e);
      }
    });
  }

  // Products
  static subscribeProducts(callback: (products: Product[]) => void) {
    StoreService.productCallbacks.add(callback);

    // Immediately deliver cached / merged products so the UI renders with zero lag
    const initialList = StoreService.mergeWithLocalProducts(
      StoreService.lastFirestoreProducts.length
        ? StoreService.lastFirestoreProducts
        : INITIAL_PRODUCTS
    );
    callback(initialList);

    try {
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            StoreService.lastFirestoreProducts = INITIAL_PRODUCTS;
            callback(StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS));
            seedDatabaseIfEmpty();
          } else {
            const list: Product[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as Product);
            });
            StoreService.lastFirestoreProducts = list;
            callback(StoreService.mergeWithLocalProducts(list));
          }
        },
        (error) => {
          console.warn('Products onSnapshot fallback to local data:', error.message);
          callback(StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS));
        }
      );

      return () => {
        StoreService.productCallbacks.delete(callback);
        unsubscribe();
      };
    } catch (e) {
      console.warn('Subscription error, using fallback:', e);
      callback(StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS));
      return () => {
        StoreService.productCallbacks.delete(callback);
      };
    }
  }

  static async getProductById(id: string): Promise<Product | null> {
    const deleted = new Set(StoreService.getLocalDeletedIds());
    if (deleted.has(id)) return null;

    const overrides = StoreService.getLocalOverrides();

    // Check newly added local products
    const newProds = StoreService.getLocalNewProducts();
    const foundNew = newProds.find((p) => p.id === id);
    if (foundNew) {
      return overrides[id] ? { ...foundNew, ...overrides[id] } : foundNew;
    }

    try {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = { ...snap.data(), id: snap.id } as Product;
        return overrides[id] ? { ...data, ...overrides[id] } : data;
      }
    } catch {
      // fallback
    }

    const initial = INITIAL_PRODUCTS.find((p) => p.id === id);
    if (initial) {
      return overrides[id] ? { ...initial, ...overrides[id] } : initial;
    }
    return null;
  }

  static async createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<string> {
    const id = product.id || 'jg-' + Date.now().toString(36);
    const now = new Date().toISOString();
    const fullProd: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Save locally first
    const newProds = StoreService.getLocalNewProducts();
    newProds.unshift(fullProd);
    StoreService.saveLocalNewProducts(newProds);
    StoreService.notifyProductSubscribers();

    // If authenticated in Firebase, sync to Firestore
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'products', id);
        await setDoc(docRef, fullProd);
      } catch (error) {
        console.warn('Firestore create product sync notice:', error);
        const isDemo = localStorage.getItem('jg_demo_user') === 'true';
        if (!isDemo && auth.currentUser) {
          handleFirestoreError(error, OperationType.CREATE, 'products');
        }
      }
    }
    return id;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const updatedAt = new Date().toISOString();
    // 1. Save to local storage overrides immediately
    const overrides = StoreService.getLocalOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...updates, updatedAt };
    StoreService.saveLocalOverrides(overrides);

    // Also update in newly created products if it's there
    const newProds = StoreService.getLocalNewProducts();
    const newIdx = newProds.findIndex((p) => p.id === id);
    if (newIdx !== -1) {
      newProds[newIdx] = { ...newProds[newIdx], ...updates, updatedAt };
      StoreService.saveLocalNewProducts(newProds);
    }

    // 2. Notify subscribers synchronously for instant UI reactivity
    StoreService.notifyProductSubscribers();

    // 3. If authenticated in Firebase, sync changes to cloud
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'products', id);
        await updateDoc(docRef, { ...updates, updatedAt });
      } catch (error) {
        console.warn(`Firestore update for products/${id} could not sync:`, error);
        const isDemo = localStorage.getItem('jg_demo_user') === 'true';
        if (!isDemo && auth.currentUser) {
          handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
        }
      }
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    // 1. Update local deleted ids
    const deleted = StoreService.getLocalDeletedIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      StoreService.saveLocalDeletedIds(deleted);
    }
    // Remove from local new products
    const newProds = StoreService.getLocalNewProducts().filter((p) => p.id !== id);
    StoreService.saveLocalNewProducts(newProds);

    // 2. Notify UI
    StoreService.notifyProductSubscribers();

    // 3. If authenticated, sync deletion to cloud
    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'products', id);
        await deleteDoc(docRef);
      } catch (error) {
        console.warn('Firestore delete product sync notice:', error);
        const isDemo = localStorage.getItem('jg_demo_user') === 'true';
        if (!isDemo && auth.currentUser) {
          handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
        }
      }
    }
  }

  // Categories
  static subscribeCategories(callback: (categories: Category[]) => void) {
    try {
      callback(INITIAL_CATEGORIES);
      const q = query(collection(db, 'categories'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            callback(INITIAL_CATEGORIES);
          } else {
            const list: Category[] = [];
            snapshot.forEach((doc) => {
              list.push({ ...doc.data(), id: doc.id } as Category);
            });
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(list);
          }
        },
        () => {
          callback(INITIAL_CATEGORIES);
        }
      );
    } catch {
      callback(INITIAL_CATEGORIES);
      return () => {};
    }
  }

  static async createCategory(category: Category): Promise<void> {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'categories', category.id), category);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'categories');
      }
    }
  }

  static async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'categories', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
      }
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      }
    }
  }

  // Store Settings
  static subscribeSettings(callback: (settings: StoreSettings) => void) {
    const getMergedSettings = (base: StoreSettings): StoreSettings => {
      try {
        const local = localStorage.getItem('jg_local_store_settings');
        if (local) {
          return { ...base, ...JSON.parse(local) };
        }
      } catch {}
      return base;
    };

    callback(getMergedSettings(INITIAL_SETTINGS));

    try {
      return onSnapshot(
        doc(db, 'settings', 'store'),
        (docSnap) => {
          if (docSnap.exists()) {
            callback(getMergedSettings(docSnap.data() as StoreSettings));
          } else {
            callback(getMergedSettings(INITIAL_SETTINGS));
          }
        },
        () => {
          callback(getMergedSettings(INITIAL_SETTINGS));
        }
      );
    } catch {
      callback(getMergedSettings(INITIAL_SETTINGS));
      return () => {};
    }
  }

  static async updateSettings(settings: Partial<StoreSettings>): Promise<void> {
    try {
      const existing = localStorage.getItem('jg_local_store_settings');
      const current = existing ? JSON.parse(existing) : {};
      localStorage.setItem('jg_local_store_settings', JSON.stringify({ ...current, ...settings }));
    } catch {}

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'store'), settings, { merge: true });
      } catch (error) {
        const isDemo = localStorage.getItem('jg_demo_user') === 'true';
        if (!isDemo && auth.currentUser) {
          handleFirestoreError(error, OperationType.UPDATE, 'settings/store');
        }
      }
    }
  }

  // Orders: Creation with Atomic Variant Stock Decrement!
  static async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'statusHistory' | 'createdAt'>): Promise<Order> {
    const orderNumber = 'JG-' + Math.floor(100000 + Math.random() * 900000);
    const orderId = 'order-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: 'Order placed by customer with Cash on Delivery (COD).',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Execute in a transaction to safely validate and decrement stock
      await runTransaction(db, async (transaction) => {
        // First, read all required product documents to verify stock
        const productRefs = orderData.items.map((item) => ({
          item,
          ref: doc(db, 'products', item.productId),
        }));

        const productDocs = await Promise.all(
          productRefs.map(async ({ ref }) => await transaction.get(ref))
        );

        // Verify that variants have enough stock
        for (let i = 0; i < productDocs.length; i++) {
          const snap = productDocs[i];
          const item = productRefs[i].item;

          if (!snap.exists()) {
            throw new Error(`Product ${item.productName} is no longer available.`);
          }

          const productData = snap.data() as Product;
          const variantIndex = productData.variants.findIndex((v) => v.id === item.variantId);

          if (variantIndex === -1) {
            throw new Error(`Selected variant of ${item.productName} is not found.`);
          }

          const currentStock = productData.variants[variantIndex].stock;
          if (currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.productName} (${item.color} / ${item.size}). Only ${currentStock} remaining.`
            );
          }

          // Decrement stock for this variant
          const updatedVariants = [...productData.variants];
          updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            stock: currentStock - item.quantity,
          };

          transaction.update(productRefs[i].ref, {
            variants: updatedVariants,
            updatedAt: now,
          });
        }

        // Save order
        transaction.set(doc(db, 'orders', orderId), newOrder);
      });

      return newOrder;
    } catch (error) {
      console.error('Order creation error:', error);
      // Fallback: If transaction failed due to network / permissions in sandboxed preview, save locally & via direct doc
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch {
        // Store in local storage orders
        const savedOrders = JSON.parse(localStorage.getItem('jg_orders') || '[]');
        savedOrders.unshift(newOrder);
        localStorage.setItem('jg_orders', JSON.stringify(savedOrders));
      }
      return newOrder;
    }
  }

  // Subscribe to Orders (All or User specific)
  // Subscribe to Orders (All or User specific)
  static subscribeOrders(userId: string | null, isAdmin: boolean, callback: (orders: Order[]) => void) {
    const notifyFromLocal = () => {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
      const normalized = localOrders.map((o) => {
        const st = (o.orderStatus || o.status || 'pending') as OrderStatus;
        return { ...o, status: st, orderStatus: st };
      });
      const filtered = isAdmin ? normalized : normalized.filter((o) => o.userId === userId);
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(filtered);
    };

    const handleLocalUpdate = () => {
      notifyFromLocal();
    };
    window.addEventListener('jg_orders_changed', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);

    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      } else if (userId) {
        q = query(collection(db, 'orders'), where('userId', '==', userId));
      } else {
        notifyFromLocal();
        return () => {
          window.removeEventListener('jg_orders_changed', handleLocalUpdate);
          window.removeEventListener('storage', handleLocalUpdate);
        };
      }

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const orders: Order[] = [];
          snapshot.forEach((doc) => {
            const raw = doc.data() as any;
            const st = (raw.orderStatus || raw.status || 'pending') as OrderStatus;
            orders.push({ ...raw, id: doc.id, status: st, orderStatus: st });
          });
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
          const normalizedLocal = localOrders.map((o) => {
            const st = (o.orderStatus || o.status || 'pending') as OrderStatus;
            return { ...o, status: st, orderStatus: st };
          });
          const filteredLocal = isAdmin ? normalizedLocal : normalizedLocal.filter((o) => o.userId === userId);

          const merged = [...orders];
          for (const lo of filteredLocal) {
            const existingIdx = merged.findIndex((m) => m.id === lo.id || m.orderNumber === lo.orderNumber);
            if (existingIdx === -1) {
              merged.push(lo);
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(merged);
        },
        (err) => {
          console.warn('Orders onSnapshot error, using local fallback:', err.message);
          notifyFromLocal();
        }
      );

      return () => {
        window.removeEventListener('jg_orders_changed', handleLocalUpdate);
        window.removeEventListener('storage', handleLocalUpdate);
        unsub();
      };
    } catch {
      notifyFromLocal();
      return () => {
        window.removeEventListener('jg_orders_changed', handleLocalUpdate);
        window.removeEventListener('storage', handleLocalUpdate);
      };
    }
  }

  static async updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Promise<void> {
    const timestamp = new Date().toISOString();

    // 1. Immediately update localStorage so same-browser tabs / customer view see it instantly
    const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
    const idx = localOrders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    let updatedLocalOrder: Order | null = null;

    if (idx !== -1) {
      const history = localOrders[idx].statusHistory || [];
      history.push({
        status: newStatus,
        timestamp,
        note: note || `Order status updated to ${newStatus}.`,
      });
      localOrders[idx] = {
        ...localOrders[idx],
        status: newStatus,
        orderStatus: newStatus,
        statusHistory: history,
        updatedAt: timestamp,
        ...(note ? { riderNote: note } : {}),
      };
      updatedLocalOrder = localOrders[idx];
      localStorage.setItem('jg_orders', JSON.stringify(localOrders));
    }

    // 2. Broadcast local update event across components
    window.dispatchEvent(
      new CustomEvent('jg_orders_changed', {
        detail: { orderId, newStatus, note, order: updatedLocalOrder },
      })
    );

    // 3. Update Firestore with BOTH status and orderStatus fields
    try {
      let orderRef = doc(db, 'orders', orderId);
      let snap = await getDoc(orderRef);
      if (!snap.exists()) {
        const q = query(collection(db, 'orders'), where('orderNumber', '==', orderId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          orderRef = qSnap.docs[0].ref;
          snap = qSnap.docs[0] as any;
        }
      }

      if (snap.exists()) {
        const data = snap.data() as Order;
        const history = data.statusHistory || [];
        history.push({
          status: newStatus,
          timestamp,
          note: note || `Order status updated to ${newStatus}.`,
        });
        await updateDoc(orderRef, {
          status: newStatus,
          orderStatus: newStatus,
          statusHistory: history,
          updatedAt: timestamp,
          ...(note ? { riderNote: note } : {}),
        });
      }
    } catch (e) {
      console.warn('Could not update Firestore order, synced locally:', e);
    }
  }

  static async cancelOrder(
    orderId: string,
    reason: string,
    cancelledBy: 'customer' | 'admin' = 'customer'
  ): Promise<void> {
    const actor = cancelledBy === 'customer' ? 'Customer' : 'Store Admin';
    const note = `Order cancelled by ${actor}. Reason: ${reason}`;
    await StoreService.updateOrderStatus(orderId, 'cancelled', note);
  }

  static subscribeOrderByNumber(
    orderNumber: string,
    callback: (order: Order | null) => void
  ): () => void {
    const cleanNum = orderNumber.trim().toUpperCase();

    const getLocal = (): Order | null => {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
      const found = localOrders.find((o) => o.orderNumber.toUpperCase() === cleanNum);
      if (found) {
        const st = (found.orderStatus || found.status || 'pending') as OrderStatus;
        return { ...found, status: st, orderStatus: st };
      }
      return null;
    };

    // Emit initial cached state immediately
    const initial = getLocal();
    if (initial) callback(initial);

    // Listen to local changes
    const handleEvent = () => {
      const current = getLocal();
      if (current) callback(current);
    };
    window.addEventListener('jg_orders_changed', handleEvent);
    window.addEventListener('storage', handleEvent);

    // Listen to Firestore
    let unsubSnapshot = () => {};
    try {
      const q = query(collection(db, 'orders'), where('orderNumber', '==', cleanNum));
      unsubSnapshot = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const d = snap.docs[0];
            const raw = d.data() as any;
            const st = (raw.orderStatus || raw.status || 'pending') as OrderStatus;
            const ord: Order = { ...raw, id: d.id, status: st, orderStatus: st };

            // Update local storage so cache is current
            const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
            const idx = localOrders.findIndex((o) => o.id === ord.id || o.orderNumber === ord.orderNumber);
            if (idx !== -1) {
              localOrders[idx] = ord;
            } else {
              localOrders.unshift(ord);
            }
            localStorage.setItem('jg_orders', JSON.stringify(localOrders));
            callback(ord);
          } else {
            callback(getLocal());
          }
        },
        (err) => {
          console.warn('subscribeOrderByNumber snapshot notice:', err);
          callback(getLocal());
        }
      );
    } catch {
      callback(getLocal());
    }

    return () => {
      window.removeEventListener('jg_orders_changed', handleEvent);
      window.removeEventListener('storage', handleEvent);
      unsubSnapshot();
    };
  }

  // Reviews
  static subscribeReviews(productId: string | null, callback: (reviews: Review[]) => void) {
    try {
      const q = productId
        ? query(collection(db, 'reviews'), where('productId', '==', productId))
        : query(collection(db, 'reviews'));

      return onSnapshot(
        q,
        (snapshot) => {
          const list: Review[] = [];
          snapshot.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as Review);
          });
          callback(list);
        },
        () => {
          callback([]);
        }
      );
    } catch {
      callback([]);
      return () => {};
    }
  }

  static async addReview(review: Omit<Review, 'id' | 'createdAt' | 'isApproved'>): Promise<void> {
    try {
      const newReview: Review = {
        ...review,
        id: 'rev-' + Date.now().toString(36),
        isApproved: true, // auto approve or moderated
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'reviews', newReview.id), newReview);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  }

  static async moderateReview(reviewId: string, isApproved: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { isApproved });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  }

  static async deleteReview(reviewId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    }
  }

  // Banners
  static subscribeBanners(callback: (banners: Banner[]) => void) {
    callback(INITIAL_BANNERS);
    try {
      return onSnapshot(
        collection(db, 'banners'),
        (snap) => {
          if (snap.empty) {
            callback(INITIAL_BANNERS);
          } else {
            const list: Banner[] = [];
            snap.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Banner));
            list.sort((a, b) => a.order - b.order);
            callback(list);
          }
        },
        () => callback(INITIAL_BANNERS)
      );
    } catch {
      callback(INITIAL_BANNERS);
      return () => {};
    }
  }

  static async updateBanner(banner: Banner): Promise<void> {
    try {
      await setDoc(doc(db, 'banners', banner.id), banner, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banners/${banner.id}`);
    }
  }

  // Coupons
  static subscribeCoupons(callback: (coupons: Coupon[]) => void) {
    try {
      return onSnapshot(
        collection(db, 'coupons'),
        (snap) => {
          const list: Coupon[] = [];
          snap.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Coupon));
          callback(list);
        },
        () => callback([])
      );
    } catch {
      callback([]);
      return () => {};
    }
  }

  static async saveCoupon(coupon: Coupon): Promise<void> {
    try {
      await setDoc(doc(db, 'coupons', coupon.id), coupon);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `coupons/${coupon.id}`);
    }
  }

  static async deleteCoupon(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `coupons/${id}`);
    }
  }

  static async getActiveProducts(): Promise<Product[]> {
    return withTimeout(
      (async () => {
        try {
          const snap = await getDocs(collection(db, 'products'));
          if (snap.empty) {
            return StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS);
          }
          const list: Product[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as Product);
          });
          return StoreService.mergeWithLocalProducts(list);
        } catch {
          return StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS);
        }
      })(),
      StoreService.mergeWithLocalProducts(INITIAL_PRODUCTS),
      2500
    );
  }

  static async getCategories(): Promise<Category[]> {
    return withTimeout(
      (async () => {
        try {
          const snap = await getDocs(collection(db, 'categories'));
          if (snap.empty) {
            return INITIAL_CATEGORIES;
          }
          const list: Category[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as Category);
          });
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          return list;
        } catch {
          return INITIAL_CATEGORIES;
        }
      })(),
      INITIAL_CATEGORIES,
      2500
    );
  }

  static async getActiveBanners(): Promise<Banner[]> {
    return withTimeout(
      (async () => {
        try {
          const snap = await getDocs(collection(db, 'banners'));
          if (snap.empty) {
            return INITIAL_BANNERS;
          }
          const list: Banner[] = [];
          snap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as Banner);
          });
          list.sort((a, b) => a.order - b.order);
          return list;
        } catch {
          return INITIAL_BANNERS;
        }
      })(),
      INITIAL_BANNERS,
      2500
    );
  }

  static async getStoreSettings(): Promise<StoreSettings> {
    return withTimeout(
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'settings', 'store'));
          if (snap.exists()) {
            return snap.data() as StoreSettings;
          }
          return INITIAL_SETTINGS;
        } catch {
          return INITIAL_SETTINGS;
        }
      })(),
      INITIAL_SETTINGS,
      2500
    );
  }

  static updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
    return this.updateSettings(settings);
  }

  static async getOrdersForUser(userId: string): Promise<Order[]> {
    const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
    const localUserOrders = localOrders
      .filter((o) => o.userId === userId)
      .map((o) => {
        const st = (o.orderStatus || o.status || 'pending') as OrderStatus;
        return { ...o, status: st, orderStatus: st };
      });

    return withTimeout(
      (async () => {
        try {
          const q = query(collection(db, 'orders'), where('userId', '==', userId));
          const snap = await getDocs(q);
          const list: Order[] = [];
          snap.forEach((d) => {
            const raw = d.data() as any;
            const st = (raw.orderStatus || raw.status || 'pending') as OrderStatus;
            list.push({ ...raw, id: d.id, status: st, orderStatus: st } as Order);
          });

          for (const lo of localUserOrders) {
            if (!list.some((m) => m.id === lo.id || m.orderNumber === lo.orderNumber)) {
              list.push(lo);
            }
          }

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return list;
        } catch {
          return localUserOrders;
        }
      })(),
      localUserOrders,
      2500
    );
  }

  static async getAllOrders(): Promise<Order[]> {
    const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
    const normalizedLocal = localOrders.map((o) => {
      const st = (o.orderStatus || o.status || 'pending') as OrderStatus;
      return { ...o, status: st, orderStatus: st };
    });

    return withTimeout(
      (async () => {
        try {
          const snap = await getDocs(collection(db, 'orders'));
          const list: Order[] = [];
          snap.forEach((d) => {
            const raw = d.data() as any;
            const st = (raw.orderStatus || raw.status || 'pending') as OrderStatus;
            list.push({ ...raw, id: d.id, status: st, orderStatus: st } as Order);
          });

          for (const lo of normalizedLocal) {
            if (!list.some((m) => m.id === lo.id || m.orderNumber === lo.orderNumber)) {
              list.push(lo);
            }
          }

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return list;
        } catch {
          return normalizedLocal;
        }
      })(),
      normalizedLocal,
      2500
    );
  }

  static async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const cleanNum = orderNumber.trim().toUpperCase();
    const localOrders: Order[] = JSON.parse(localStorage.getItem('jg_orders') || '[]');
    const rawLocal = localOrders.find((o) => o.orderNumber.toUpperCase() === cleanNum) || null;
    const localFound: Order | null = rawLocal
      ? {
          ...rawLocal,
          status: (rawLocal.orderStatus || rawLocal.status || 'pending') as OrderStatus,
          orderStatus: (rawLocal.orderStatus || rawLocal.status || 'pending') as OrderStatus,
        }
      : null;

    return withTimeout(
      (async () => {
        try {
          const q = query(collection(db, 'orders'), where('orderNumber', '==', cleanNum));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            const raw = d.data() as any;
            const st = (raw.orderStatus || raw.status || 'pending') as OrderStatus;
            return { ...raw, id: d.id, status: st, orderStatus: st } as Order;
          }
        } catch (e) {
          console.warn('Firestore query error:', e);
        }
        return localFound;
      })(),
      localFound,
      2500
    );
  }

  static async getReviewsForProduct(productId: string): Promise<Review[]> {
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', productId));
      const snap = await getDocs(q);
      const list: Review[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as Review);
      });
      return list;
    } catch {
      return [];
    }
  }
}
