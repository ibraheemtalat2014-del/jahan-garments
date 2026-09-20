import React, { useState } from 'react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { Order } from '../../types';

interface CancelOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  'Changed my mind',
  'Want to order a different size or color',
  'Entered incorrect address or contact number',
  'Delivery time is not suitable',
  'Ordered by mistake / duplicate order',
  'Other reason',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Check if eligible for customer cancellation (before dispatch)
  const isEligible =
    order.orderStatus === 'pending' ||
    order.orderStatus === 'confirmed' ||
    order.orderStatus === 'processing';

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) {
      setError('This order is already dispatched and cannot be cancelled online.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const fullReason =
        selectedReason === 'Other reason'
          ? customNotes.trim() || 'Other reason'
          : customNotes.trim()
          ? `${selectedReason} - ${customNotes.trim()}`
          : selectedReason;

      await onConfirmCancel(order.id, fullReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not cancel order. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-left animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Order Cancellation
            </span>
            <h3 className="text-xl font-bold font-serif-brand text-zinc-900 dark:text-white mt-0.5">
              Cancel Order #{order.orderNumber}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Lahore Cash on Delivery • Rs. {order.totalAmount.toLocaleString()} ({order.items.length} items)
            </p>
          </div>
        </div>

        {!isEligible ? (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs">
            <p className="font-bold">Cancellation Not Available</p>
            <p className="mt-1">
              This order status is currently <strong>{order.orderStatus.toUpperCase()}</strong>. Orders can only be cancelled before dispatch with an InDrive rider.
              Please reach out to our Lahore customer support via WhatsApp or phone.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCancelSubmit} className="mt-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold text-zinc-900 dark:text-white">Note:</span> You may cancel your order at any time before it is handed over to our Lahore InDrive courier.
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-900"
              >
                {COMMON_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Additional Comments (Optional)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
                placeholder="Let us know if there's anything we could have done differently..."
                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-900 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors"
              >
                Keep My Order
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
