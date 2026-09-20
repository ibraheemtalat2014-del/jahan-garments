import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag, Star, Check } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../common/Toast';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickView,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const isFavorited = isInWishlist(product.id);

  // Total stock across all variants
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const isOutOfStock = totalStock <= 0;

  // Calculate discount percentage
  const discountPercent =
    product.salePrice && product.salePrice < product.regularPrice
      ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
      : 0;

  const currentPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.regularPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const availableVariant = product.variants.find((v) => v.stock > 0);
    if (!availableVariant) {
      showToast('All variants of this product are currently out of stock.', 'error');
      return;
    }
    const ok = addToCart(product, availableVariant, 1);
    if (ok) {
      showToast(`Added ${product.name} (${availableVariant.color} / ${availableVariant.size}) to cart!`, 'success');
    } else {
      showToast('Cannot add more of this variant than available stock.', 'error');
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={
            isHovered && product.images.length > 1
              ? product.images[1]
              : product.images[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'
          }
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-rose-600 text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-amber-900 text-amber-100 shadow-xs">
              New
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-300 shadow-xs">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-xs z-10 ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
              : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 hover:bg-white'
          }`}
          title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-600' : ''}`} />
        </button>

        {/* Quick View Hover Action */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white text-xs font-semibold shadow-md hover:bg-white dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 backdrop-blur-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          {!isOutOfStock && (
            <button
              onClick={handleQuickAdd}
              className="p-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-white shadow-md transition-colors"
              title="Quick Add to Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="capitalize font-medium">{product.gender} • {product.subcategory || product.category}</span>
            {product.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          {/* Color & Size Indicators */}
          <div className="mt-2 flex items-center justify-between gap-2">
            {product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                {product.colors.slice(0, 3).map((col, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    {col.split(' ')[0]}
                  </span>
                ))}
                {product.colors.length > 3 && (
                  <span className="text-[10px] text-zinc-400">+{product.colors.length - 3}</span>
                )}
              </div>
            )}
            {product.sizes.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                {product.sizes.slice(0, 4).join(' • ')}
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-zinc-950 dark:text-amber-300">
              Rs. {currentPrice.toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-zinc-400 line-through">
                Rs. {product.regularPrice.toLocaleString()}
              </span>
            )}
          </div>

          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {isOutOfStock ? (
              <span className="text-zinc-400">Sold Out</span>
            ) : totalStock <= 4 ? (
              <span className="text-amber-600">Only {totalStock} left</span>
            ) : (
              'In Stock'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
