import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { Product } from '../types';

interface WishlistPageProps {
  onSelectProduct: (p: Product) => void;
  onNavigate: (page: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onSelectProduct,
  onNavigate,
}) => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const handleMoveToCart = (product: Product) => {
    const availableVariant = product.variants.find((v) => v.stock > 0);
    if (!availableVariant) {
      showToast('All variants of this item are currently out of stock.', 'error');
      return;
    }
    const ok = addToCart(product, availableVariant, 1);
    if (ok) {
      removeFromWishlist(product.id);
      showToast(`Moved ${product.name} to cart!`, 'success');
      setIsCartOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            My Saved Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Garments you have bookmarked for later consideration
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs text-rose-600 hover:underline font-medium"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Explore our collections and tap the heart icon on any outfit you love.
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="py-2.5 px-6 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-bold text-xs"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const hasStock = product.variants.some((v) => v.stock > 0);
            const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.regularPrice;

            return (
              <div
                key={product.id}
                className="group relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div
                  onClick={() => onSelectProduct(product)}
                  className="aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer relative"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-zinc-900/80 text-rose-600 hover:bg-white transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-[11px] text-zinc-400 uppercase font-semibold">
                    {product.gender} • {product.category}
                  </div>
                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 cursor-pointer hover:underline"
                  >
                    {product.name}
                  </h3>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-sm font-bold text-zinc-950 dark:text-amber-300">
                      Rs. {price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {hasStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleMoveToCart(product)}
                    disabled={!hasStock}
                    className="w-full mt-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
