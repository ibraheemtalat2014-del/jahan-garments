import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Heart, Check, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../common/Toast';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onViewFullDetails: (product: Product) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  onClose,
  onViewFullDetails,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      const firstAvailableVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
      if (firstAvailableVariant) {
        setSelectedColor(firstAvailableVariant.color);
        setSelectedSize(firstAvailableVariant.size);
      } else {
        setSelectedColor(product.colors[0] || '');
        setSelectedSize(product.sizes[0] || '');
      }
      setSelectedImageIndex(0);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  // Find currently matched variant
  const currentVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const isFavorited = isInWishlist(product.id);
  const currentPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.regularPrice;
  const currentStock = currentVariant ? currentVariant.stock : 0;
  const isVariantOutOfStock = currentStock <= 0;

  const handleAdd = () => {
    if (!currentVariant || isVariantOutOfStock) {
      showToast('This size & color combination is out of stock.', 'error');
      return;
    }
    const ok = addToCart(product, currentVariant, quantity);
    if (ok) {
      showToast(`Added ${quantity}x ${product.name} (${selectedColor} / ${selectedSize}) to cart!`, 'success');
      onClose();
    } else {
      showToast(`Cannot exceed available stock of ${currentStock}.`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Gallery View */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col justify-between gap-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-700">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-amber-900 dark:border-amber-400'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Form */}
          <div className="p-6 flex flex-col justify-between gap-6 text-left">
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                {product.gender} • {product.subcategory || product.category}
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {product.name}
              </h2>

              <div className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-bold text-zinc-900 dark:text-amber-300">
                  Rs. {currentPrice.toLocaleString()}
                </span>
                {product.salePrice && product.salePrice < product.regularPrice && (
                  <span className="text-sm text-zinc-400 line-through">
                    Rs. {product.regularPrice.toLocaleString()}
                  </span>
                )}
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-md ml-auto">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              <div className="mt-5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Color: <strong className="text-zinc-900 dark:text-white">{selectedColor}</strong></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    // Check if any size exists in this color
                    const hasAnyStock = product.variants.some((v) => v.color === color && v.stock > 0);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selectedColor === color
                            ? 'border-amber-900 dark:border-amber-400 bg-amber-900/10 text-amber-950 dark:text-amber-200 font-bold'
                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
                        } ${!hasAnyStock ? 'opacity-50 line-through' : ''}`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mt-5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Size: <strong className="text-zinc-900 dark:text-white">{selectedSize}</strong></span>
                  <span className="text-[11px] text-zinc-500 font-normal">Lahore Standard Fitting</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const variantForSize = product.variants.find(
                      (v) => v.color === selectedColor && v.size === size
                    );
                    const stockForSize = variantForSize ? variantForSize.stock : 0;
                    const isAvailable = stockForSize > 0;

                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={!variantForSize}
                        className={`min-w-[44px] h-10 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all ${
                          selectedSize === size
                            ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                            : isAvailable
                            ? 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900/50 line-through cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Variant Stock Status */}
              <div className="mt-4 text-xs flex items-center gap-1.5">
                {isVariantOutOfStock ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" /> Out of stock in this size & color
                  </span>
                ) : currentStock <= 4 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Low Stock: Only {currentStock} left!
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> In Stock ({currentStock} available)
                  </span>
                )}
              </div>

              {/* Quantity */}
              {!isVariantOutOfStock && (
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Quantity:</span>
                  <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-zinc-600 dark:text-zinc-300 hover:text-black font-bold"
                    >
                      -
                    </button>
                    <span className="px-2 text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      className="px-3 py-1 text-zinc-600 dark:text-zinc-300 hover:text-black font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={isVariantOutOfStock || !currentVariant}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-amber-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isVariantOutOfStock ? 'Variant Out of Stock' : 'Add to Cart (COD)'}</span>
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isFavorited
                      ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950 dark:border-rose-800'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                  title="Save to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-rose-600' : ''}`} />
                </button>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onViewFullDetails(product);
                }}
                className="w-full text-center text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-1 underline font-medium"
              >
                View Full Product Details, Fabric & Care Instructions →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
