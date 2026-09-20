import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

interface CartDrawerProps {
  onCheckout: () => void;
  onExplore: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, onExplore }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    deliveryCharges,
    grandTotal,
    freeDeliveryThreshold,
  } = useCart();
  const { t } = useLanguage();

  if (!isCartOpen) return null;

  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryPercent = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 text-left">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-900 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {t('cart')} ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lahore Free Delivery Progress Bar */}
          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 border-b border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between text-xs font-medium text-amber-900 dark:text-amber-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                {remainingForFreeDelivery === 0 ? (
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    🎉 You unlocked FREE Lahore InDrive Delivery!
                  </strong>
                ) : (
                  <span>
                    Add <strong>Rs. {remainingForFreeDelivery.toLocaleString()}</strong> more for Free Lahore Delivery
                  </span>
                )}
              </span>
              <span className="font-bold">{Math.round(freeDeliveryPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-800 dark:bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${freeDeliveryPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    {t('empty_cart')}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    Explore our latest Eastern & Western attire tailored for families in Lahore.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExplore();
                  }}
                  className="py-2.5 px-6 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-semibold text-xs transition-colors hover:bg-zinc-800"
                >
                  {t('continue_shopping')}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-18 h-22 object-cover rounded-xl bg-zinc-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {item.productName}
                      </h4>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                        <span className="font-medium">Color: {item.color}</span>
                        <span>•</span>
                        <span className="font-medium">Size: {item.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        >
                          -
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      {/* Price & Delete */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-zinc-900 dark:text-amber-300">
                          Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t('subtotal')}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t('delivery_fee')}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {deliveryCharges === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-[11px]">
                        FREE
                      </span>
                    ) : (
                      `Rs. ${deliveryCharges}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base font-bold text-zinc-900 dark:text-white">
                  <span>{t('grand_total')}</span>
                  <span className="text-amber-900 dark:text-amber-400">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="py-2 px-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <span>Cash on Delivery (COD) in Lahore only.</span>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>{t('checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
