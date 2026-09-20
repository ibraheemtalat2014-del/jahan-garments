import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  ExternalLink,
  Ban,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { StoreService } from '../services/storeService';
import { useAuth } from '../context/AuthContext';
import { CancelOrderModal } from '../components/orders/CancelOrderModal';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  onNavigate: (page: string) => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'Order Placed', desc: 'Order received in our system' },
  { status: 'confirmed', label: 'Order Confirmed', desc: 'Verified by Lahore store manager' },
  { status: 'processing', label: 'Preparing Garments', desc: 'Packed & ironed at Lahore workshop' },
  { status: 'shipped', label: 'InDrive Dispatched', desc: 'Rider on the way to your address' },
  { status: 'delivered', label: 'Delivered', desc: 'Completed & Cash on Delivery collected' },
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderNumber,
  onNavigate,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    if (initialOrderNumber) {
      handleSearch(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  // Load customer's past orders if signed in
  useEffect(() => {
    const uid = currentUser?.uid || userProfile?.uid;
    if (uid) {
      StoreService.getOrdersForUser(uid).then((orders) => {
        setUserOrders(orders);
        if (!initialOrderNumber && orders.length > 0) {
          setCurrentOrder(orders[0]);
        }
      });
    }
  }, [currentUser, userProfile, initialOrderNumber]);

  // Real-time synchronization for the currently tracked order
  useEffect(() => {
    if (!currentOrder?.orderNumber) return;

    const orderNum = currentOrder.orderNumber;
    const unsub = StoreService.subscribeOrderByNumber(orderNum, (updated) => {
      if (updated) {
        setCurrentOrder(updated);
      }
    });

    const handleOrdersChanged = () => {
      StoreService.getOrderByNumber(orderNum).then((found) => {
        if (found) setCurrentOrder(found);
      });
    };
    window.addEventListener('jg_orders_changed', handleOrdersChanged);

    return () => {
      unsub?.();
      window.removeEventListener('jg_orders_changed', handleOrdersChanged);
    };
  }, [currentOrder?.orderNumber]);

  const handleSearch = async (numToSearch?: string) => {
    const term = (numToSearch || orderNumberInput).trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    try {
      const found = await StoreService.getOrderByNumber(term);
      if (found) {
        setCurrentOrder(found);
      } else {
        setError(`No order found matching "${term}". Please verify your order number (e.g. JG-123456).`);
        setCurrentOrder(null);
      }
    } catch (err: any) {
      setError('Failed to look up order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = currentOrder ? getStepIndex(currentOrder.orderStatus) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      <div>
        <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
          Track Your Lahore Order
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Follow your package journey from our Gulberg workshop to your doorstep via InDrive
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              placeholder="Enter Order Number (e.g. JG-839210)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-900/40"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-2xl bg-zinc-900 dark:bg-amber-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-spin">⟳</span> : <Package className="w-4 h-4" />}
            <span>Track Order</span>
          </button>
        </form>

        {/* Recent orders quick chips if signed in */}
        {userOrders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400">Your recent orders:</span>
            {userOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setOrderNumberInput(o.orderNumber);
                  setCurrentOrder(o);
                }}
                className={`px-3 py-1 rounded-lg border font-mono font-medium transition-colors ${
                  currentOrder?.orderNumber === o.orderNumber
                    ? 'border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {o.orderNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Status Display */}
      {currentOrder && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-8">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                Order Reference
              </span>
              <h2 className="text-xl font-mono font-bold text-zinc-900 dark:text-white">
                {currentOrder.orderNumber}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Placed on {new Date(currentOrder.createdAt).toLocaleDateString()} at{' '}
                {new Date(currentOrder.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentOrder.orderStatus === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : currentOrder.orderStatus === 'cancelled'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                Status: {currentOrder.orderStatus.replace('_', ' ')}
              </span>

              {/* Pre-dispatch Customer Cancellation Button */}
              {currentOrder.orderStatus !== 'shipped' &&
                currentOrder.orderStatus !== 'delivered' &&
                currentOrder.orderStatus !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-all shadow-xs"
                    title="Cancel order before InDrive rider dispatch"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Cancel Order</span>
                  </button>
                )}
            </div>
          </div>

          {/* Stepper Timeline */}
          {currentOrder.orderStatus === 'cancelled' ? (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300">
                This order has been cancelled before dispatch. No payment is due and no rider will be dispatched.
              </p>
              {currentOrder.cancellationReason && (
                <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-rose-200/60 dark:border-rose-900/40 text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Reason: </span>
                  <span>{currentOrder.cancellationReason}</span>
                  {currentOrder.cancelledBy && (
                    <span className="text-zinc-400 text-[11px] ml-2 font-mono">
                      (by {currentOrder.cancelledBy})
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              <div className="relative">
                {/* Horizontal line */}
                <div className="hidden md:block absolute top-5 left-10 right-10 h-0.5 bg-zinc-200 dark:bg-zinc-800" />
                <div
                  className="hidden md:block absolute top-5 left-10 h-0.5 bg-amber-900 dark:bg-amber-400 transition-all duration-500"
                  style={{ width: `${(currentStep / 4) * 80}%` }}
                />

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={step.status} className="flex md:flex-col items-center gap-3 text-left md:text-center relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold z-10 transition-colors ${
                            isCompleted
                              ? 'bg-amber-900 text-white dark:bg-amber-400 dark:text-zinc-950 ring-4 ring-amber-100 dark:ring-amber-950'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div>
                          <h4
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-amber-900 dark:text-amber-400'
                                : isCompleted
                                ? 'text-zinc-900 dark:text-white'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* InDrive Dispatch Details Box if shipped */}
          {currentOrder.orderStatus === 'shipped' && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <Truck className="w-4 h-4" />
                <span>Rider Dispatched via InDrive</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300">
                An InDrive rider has picked up your clothing parcel from our Gulberg branch and is navigating toward {currentOrder.shippingAddress.area}, Lahore.
              </p>
              {currentOrder.trackingNumber && (
                <div className="pt-1 flex items-center gap-2 font-mono text-zinc-800 dark:text-zinc-200">
                  <span>Tracking / Rider ID:</span>
                  <strong>{currentOrder.trackingNumber}</strong>
                </div>
              )}
            </div>
          )}

          {/* Delivery & Address Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                Lahore Destination
              </h4>
              <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {currentOrder.shippingAddress.fullName}
                </p>
                <p>Phone: {currentOrder.shippingAddress.phone}</p>
                <p>{currentOrder.shippingAddress.streetAddress}</p>
                <p>{currentOrder.shippingAddress.area}, Lahore, Pakistan</p>
                {currentOrder.shippingAddress.deliveryInstructions && (
                  <p className="text-amber-800 dark:text-amber-400 italic">
                    Note: "{currentOrder.shippingAddress.deliveryInstructions}"
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                Payment Breakdown (COD)
              </h4>
              <div className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    Rs. {currentOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lahore InDrive Delivery:</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {currentOrder.deliveryFee === 0 ? 'FREE' : `Rs. ${currentOrder.deliveryFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
                  <span>Cash on Delivery Due:</span>
                  <span className="text-amber-900 dark:text-amber-400">
                    Rs. {currentOrder.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Garments in this order */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
              Order Items ({currentOrder.items.length})
            </h4>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {currentOrder.items.map((item) => (
                <div key={item.variantId} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-12 object-cover rounded-lg bg-zinc-100 shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">{item.productName}</p>
                      <p className="text-zinc-500">
                        {item.color} • {item.size} • Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Cancel Modal */}
      {isCancelModalOpen && currentOrder && (
        <CancelOrderModal
          order={currentOrder}
          onClose={() => setIsCancelModalOpen(false)}
          onCancelled={(updated) => {
            setCurrentOrder(updated);
            setIsCancelModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
