import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StoreService } from '../services/storeService';
import { GmailService } from '../services/gmailService';
import { Order, LahoreArea } from '../types';

interface CheckoutPageProps {
  onOrderSuccess: (order: Order) => void;
  onOpenAuth: () => void;
  onNavigate: (page: string) => void;
}

const LAHORE_AREAS: LahoreArea[] = [
  'Gulberg',
  'DHA Phase 1-5',
  'DHA Phase 6-9',
  'Johar Town',
  'Model Town',
  'Cantt / Saddar',
  'Bahria Town',
  'Faisal Town / Garden Town',
  'Wapda Town',
  'Iqbal Town',
  'Samanabad',
  'Mall Road / Anarkali',
  'Cavalry Ground',
  'Shadman',
  'Valencia / Lake City',
  'Other Lahore Area',
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onOrderSuccess,
  onOpenAuth,
  onNavigate,
}) => {
  const { items, subtotal, deliveryCharges, grandTotal, clearCart } = useCart();
  const { currentUser, userProfile, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [area, setArea] = useState<LahoreArea>('Gulberg');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill details from customer profile if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName) setCustomerName(userProfile.displayName);
      if (userProfile.phone) setCustomerPhone(userProfile.phone);
      if (userProfile.email) setCustomerEmail(userProfile.email);
      if (userProfile.savedAddress) {
        setStreetAddress(userProfile.savedAddress.streetAddress || '');
        setArea(userProfile.savedAddress.area || 'Gulberg');
        setLandmark(userProfile.savedAddress.landmark || '');
      }
    } else if (currentUser) {
      if (currentUser.displayName) setCustomerName(currentUser.displayName);
      if (currentUser.email) setCustomerEmail(currentUser.email);
    }
  }, [userProfile, currentUser]);

  // If cart is empty, redirect
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-xs text-zinc-500">
          Please add clothing items before proceeding to checkout.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="py-2.5 px-6 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-semibold text-xs"
        >
          Browse Garments
        </button>
      </div>
    );
  }

  // NO GUEST CHECKOUT constraint
  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-left">
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Customer Sign-In Required
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              At Jahan Grments, we ensure secure Lahore order dispatch and real-time InDrive tracking. Guest checkout is disabled. Please log in or create an account to proceed.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={onOpenAuth}
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-amber-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm shadow-md transition-colors"
            >
              Sign In or Register
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      setError('Please provide a valid Pakistani phone number (e.g., 03001234567) so the InDrive rider can contact you.');
      return;
    }
    if (!streetAddress.trim()) {
      setError('Please enter your full street address and house number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> = {
        userId: currentUser?.uid || userProfile?.uid || 'user-1',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || currentUser?.email || 'customer@jahangarments.pk',
        customerPhone: customerPhone.trim(),
        shippingAddress: {
          fullName: customerName.trim(),
          phone: customerPhone.trim(),
          area,
          streetAddress: streetAddress.trim(),
          city: 'Lahore',
          province: 'Punjab',
          postalCode: '54000',
          landmark: landmark.trim() || undefined,
          deliveryInstructions: deliveryNotes.trim() || undefined,
        },
        items: [...items],
        subtotal,
        deliveryFee: deliveryCharges,
        discount: 0,
        totalAmount: grandTotal,
        paymentMethod: 'cod',
        orderStatus: 'pending',
      };

      // Call StoreService which uses atomic Firestore transaction to verify and decrement stock!
      const createdOrder = await StoreService.createOrder(orderPayload);
      clearCart();
      showToast('Your order has been placed successfully!', 'success');

      // Dispatch order notification emails via Gmail API
      try {
        await GmailService.sendNewOrderNotifications(createdOrder);
      } catch (gmailErr) {
        console.warn('Gmail notification dispatch notice:', gmailErr);
      }

      onOrderSuccess(createdOrder);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to place order. Please verify stock availability.');
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      <div className="mb-8">
        <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
          Complete Your Order
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Cash on Delivery (COD) • Verified InDrive Dispatch in Lahore
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery Address & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <MapPin className="w-5 h-5 text-amber-900 dark:text-amber-400" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Lahore Delivery Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Recipient Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Hamza Malik"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Pakistani Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Required for InDrive rider contact</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Lahore Town / Area *
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as LahoreArea)}
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                >
                  {LAHORE_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Ghalib Market, Behind Mosque"
                  className="w-full py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Complete Street Address & House / Flat No. *
              </label>
              <textarea
                required
                rows={2}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. House 42-B, Street 7, Block K..."
                className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Delivery Instructions for Rider (Optional)
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Call before coming, leave at gate"
                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-800 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Payment Method: Cash on Delivery (COD)
              </h3>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
              To guarantee total peace of mind, all orders are shipped strictly with <strong>Cash on Delivery (COD)</strong>. You will pay the total amount directly to the InDrive dispatch rider upon receiving your package at your Lahore address.
            </p>
          </div>
        </div>

        {/* Right Column: Order Summary & Placement (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
              Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} Items)
            </h2>

            {/* Item list */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto pr-1 space-y-3">
              {items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex gap-3">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-14 h-18 object-cover rounded-xl bg-zinc-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {item.productName}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {item.color} • {item.size} • Qty: {item.quantity}
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-amber-300 mt-1">
                      Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Lahore InDrive Delivery Fee</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {deliveryCharges === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">FREE</span>
                  ) : (
                    `Rs. ${deliveryCharges}`
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-bold text-zinc-900 dark:text-white">
                <span>Total Amount to Pay Rider (COD)</span>
                <span className="text-amber-900 dark:text-amber-400">
                  Rs. {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin inline-block mr-2">⟳</span>
                  <span>Verifying Stock & Placing Order...</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Place Order (Cash on Delivery)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-400 text-center">
              By placing this order, you agree to inspect your garments upon rider arrival and pay the exact amount in cash.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
