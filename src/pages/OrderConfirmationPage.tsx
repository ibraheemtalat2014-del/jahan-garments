import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  ArrowRight,
  Printer,
  Mail,
  Send,
} from 'lucide-react';
import { Order } from '../types';
import { GmailService } from '../services/gmailService';

interface OrderConfirmationPageProps {
  order: Order;
  onNavigate: (page: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onNavigate,
}) => {
  const [isSendingCopy, setIsSendingCopy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const handleResendConfirmation = async () => {
    setIsSendingCopy(true);
    setEmailStatus(null);
    try {
      const res = await GmailService.sendNewOrderNotifications(order);
      if (res.customerSent || res.ownerSent) {
        setEmailStatus('Confirmation sent to your email and store owner!');
      } else {
        setEmailStatus('Notification logged. Connect Google Account in Admin Portal for instant delivery.');
      }
    } catch (e: any) {
      setEmailStatus('Could not send: ' + (e.message || 'Error occurred'));
    } finally {
      setIsSendingCopy(false);
    }
  };
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 text-left">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            Order Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Shukriya! Your order has been placed. Our Lahore dispatch team is preparing your package for InDrive rider dispatch.
          </p>
          <div className="inline-block py-1.5 px-4 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 font-mono text-xs font-bold">
            Order Reference: {order.orderNumber}
          </div>
        </div>

        {/* InDrive Dispatch Notice */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex items-start gap-3">
          <Truck className="w-5 h-5 text-amber-900 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-zinc-900 dark:text-white">Lahore InDrive Dispatch</h4>
            <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Your parcel will be delivered by an InDrive rider to <strong>{order.shippingAddress.area}, Lahore</strong>. Please keep <strong>Rs. {order.totalAmount.toLocaleString()}</strong> ready in cash for payment upon delivery.
            </p>
          </div>
        </div>

        {/* Gmail Notification Card */}
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 dark:bg-amber-800/40 text-amber-900 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>Gmail Order Notifications</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-300 rounded font-semibold">Active</span>
              </h4>
              <p className="text-zinc-600 dark:text-zinc-300 mt-0.5">
                Order details & InDrive tracking updates are delivered to <strong>{order.customerEmail}</strong> and Store Owner (<span className="font-mono text-[11px]">ibraheemtalat2014@gmail.com</span>).
              </p>
              {emailStatus && (
                <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {emailStatus}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={isSendingCopy}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSendingCopy ? 'Sending...' : 'Resend to Gmail'}</span>
          </button>
        </div>

        {/* Order Details Breakdown */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Purchased Garments
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {order.items.map((item) => (
              <div key={item.variantId} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-12 h-14 object-cover rounded-lg bg-zinc-100 shrink-0"
                  />
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      {item.productName}
                    </h4>
                    <p className="text-zinc-500">
                      Color: {item.color} • Size: {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="font-bold text-zinc-900 dark:text-white">
                  Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Items Subtotal</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                Rs. {order.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Lahore InDrive Delivery</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                {order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
              <span>Amount Due (Cash on Delivery)</span>
              <span className="text-amber-900 dark:text-amber-400">
                Rs. {order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address recap */}
        <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="font-bold text-zinc-900 dark:text-white">Delivery Recipient:</p>
          <p>{order.shippingAddress.fullName} ({order.shippingAddress.phone})</p>
          <p>{order.shippingAddress.streetAddress}, {order.shippingAddress.area}, Lahore</p>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => onNavigate('track-order', order.orderNumber)}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
