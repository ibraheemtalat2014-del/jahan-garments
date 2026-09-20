import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Save,
  Ban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StoreService } from '../services/storeService';
import { Order, LahoreArea } from '../types';
import { CancelOrderModal } from '../components/orders/CancelOrderModal';

interface CustomerAccountPageProps {
  onNavigate: (page: string, param?: string) => void;
  onOpenAuth: () => void;
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

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  const { currentUser, userProfile, isAuthenticated, logout, updateUserProfile } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Address edit state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState<LahoreArea>('Gulberg');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      if (userProfile.savedAddress) {
        setArea(userProfile.savedAddress.area || 'Gulberg');
        setStreetAddress(userProfile.savedAddress.streetAddress || '');
        setLandmark(userProfile.savedAddress.landmark || '');
      }
    }
  }, [userProfile]);

  const fetchUserOrders = () => {
    const uid = currentUser?.uid || userProfile?.uid;
    if (uid) {
      setLoadingOrders(true);
      StoreService.getOrdersForUser(uid).then((res) => {
        setOrders(res);
        setLoadingOrders(false);
      });
    }
  };

  useEffect(() => {
    fetchUserOrders();

    const handleOrdersChanged = () => {
      fetchUserOrders();
    };
    window.addEventListener('jg_orders_changed', handleOrdersChanged);

    return () => {
      window.removeEventListener('jg_orders_changed', handleOrdersChanged);
    };
  }, [currentUser, userProfile]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Customer Account</h2>
        <p className="text-xs text-zinc-500">
          Please sign in to view your orders and saved Lahore delivery address.
        </p>
        <button
          onClick={onOpenAuth}
          className="py-3 px-6 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-bold text-xs shadow-md"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateUserProfile({
        displayName: name.trim(),
        phone: phone.trim(),
        savedAddress: {
          fullName: name.trim(),
          phone: phone.trim(),
          area,
          streetAddress: streetAddress.trim(),
          city: 'Lahore',
          province: 'Punjab',
          postalCode: '54000',
          landmark: landmark.trim() || undefined,
        },
      });
      showToast('Profile & Lahore address updated!', 'success');
    } catch (err: any) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
            Account Center
          </span>
          <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            Welcome, {userProfile?.displayName || currentUser?.email}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your personal profile, InDrive Lahore delivery address, and order records
          </p>
        </div>

        <button
          onClick={async () => {
            await logout();
            onNavigate('home');
          }}
          className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-rose-600 flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Saved Lahore Address Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <MapPin className="w-4 h-4 text-amber-900 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Saved Lahore Address
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number (For Rider Contact)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Lahore Town / Area
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as LahoreArea)}
                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              >
                {LAHORE_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Street Address & House / Apartment
              </label>
              <textarea
                rows={2}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. House 14, Street 3, Block G..."
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Commercial Market"
                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-amber-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Update Default Address'}</span>
            </button>
          </form>
        </div>

        {/* Right: Order History (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-900 dark:text-amber-400" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                My Order History ({orders.length})
              </h2>
            </div>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Package className="w-10 h-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No Orders Placed Yet</h3>
              <p className="text-xs text-zinc-500">
                You haven't ordered any clothing from Jahan Grments yet.
              </p>
              <button
                onClick={() => onNavigate('catalog')}
                className="py-2 px-4 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 text-xs font-semibold"
              >
                Explore Collections
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.orderStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.orderStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {ord.orderStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 mt-1">
                      {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} items • {ord.shippingAddress.area}
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-amber-300 mt-0.5">
                      COD Total: Rs. {ord.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Pre-dispatch Cancel Button */}
                    {ord.orderStatus !== 'shipped' &&
                      ord.orderStatus !== 'delivered' &&
                      ord.orderStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setOrderToCancel(ord)}
                          className="py-2 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          title="Cancel order before InDrive dispatch"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Cancel</span>
                        </button>
                      )}

                    <button
                      onClick={() => onNavigate('track-order', ord.orderNumber)}
                      className="py-2 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Track Status</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Cancellation Modal */}
      {orderToCancel && (
        <CancelOrderModal
          order={orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onCancelled={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setOrderToCancel(null);
          }}
        />
      )}
    </div>
  );
};
