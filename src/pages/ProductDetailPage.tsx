import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StoreService } from '../services/storeService';
import { ProductCard } from '../components/product/ProductCard';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onSelectProduct: (p: Product) => void;
  onQuickView: (p: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onSelectProduct,
  onQuickView,
  onNavigate,
}) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review submission state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reset variant selection when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    const firstWithStock = product.variants.find((v) => v.stock > 0) || product.variants[0];
    if (firstWithStock) {
      setSelectedColor(firstWithStock.color);
      setSelectedSize(firstWithStock.size);
    } else {
      setSelectedColor(product.colors[0] || '');
      setSelectedSize(product.sizes[0] || '');
    }
    setQuantity(1);

    // Fetch reviews
    setLoadingReviews(true);
    StoreService.getReviewsForProduct(product.id).then((res) => {
      setReviews(res);
      setLoadingReviews(false);
    });
  }, [product]);

  // Matched variant
  const currentVariant: ProductVariant | undefined = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const isFavorited = isInWishlist(product.id);
  const currentPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.regularPrice;
  const currentStock = currentVariant ? currentVariant.stock : 0;
  const isOutOfStock = currentStock <= 0;

  const discountPercent =
    product.salePrice && product.salePrice < product.regularPrice
      ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    if (!currentVariant || isOutOfStock) {
      showToast('This size and color combination is out of stock.', 'error');
      return;
    }
    const ok = addToCart(product, currentVariant, quantity);
    if (ok) {
      showToast(`Added ${quantity}x ${product.name} to cart!`, 'success');
      setIsCartOpen(true);
    } else {
      showToast(`Cannot add more than available stock (${currentStock}).`, 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} at Jahan Grments Lahore!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'info');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewData: Omit<Review, 'id' | 'createdAt'> = {
        productId: product.id,
        userId: currentUser?.uid || 'guest-reviewer',
        userName: userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Lahore Customer',
        rating: newRating,
        comment: newReviewComment.trim(),
        verifiedPurchase: true,
        isApproved: true,
      };

      await StoreService.addReview(reviewData);
      setReviews((prev) => [
        { ...reviewData, id: 'rev-' + Date.now(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setNewReviewComment('');
      setShowReviewForm(false);
      showToast('Thank you! Your review has been published.', 'success');
    } catch (err: any) {
      showToast('Failed to post review. Please try again.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Related products from same category or gender
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <button onClick={() => onNavigate('home')} className="hover:text-zinc-900 dark:hover:text-white">
          Home
        </button>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => onNavigate('catalog', `gender=${product.gender}`)}
          className="capitalize hover:text-zinc-900 dark:hover:text-white"
        >
          {product.gender}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-zinc-900 dark:text-white font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Product Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-md">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discountPercent > 0 && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 text-white shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
              {product.isNewArrival && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-900 text-amber-100 shadow-md">
                  New Arrival
                </span>
              )}
            </div>

            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs text-zinc-700 dark:text-zinc-300 hover:bg-white shadow-xs transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-amber-900 dark:border-amber-400 ring-2 ring-amber-900/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchasing Options (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
              <span className="capitalize font-semibold text-amber-900 dark:text-amber-400">
                {product.gender} • {product.subcategory || product.category}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">SKU: {currentVariant?.sku || product.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-zinc-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">
                {(product.rating || 5.0).toFixed(1)}
              </span>
              <span className="text-xs text-zinc-400">
                ({product.reviewCount || reviews.length} customer reviews)
              </span>
            </div>

            {/* Price Box */}
            <div className="mt-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-zinc-950 dark:text-amber-300">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {discountPercent > 0 && (
                <span className="text-base text-zinc-400 line-through">
                  Rs. {product.regularPrice.toLocaleString()}
                </span>
              )}
              <span className="ml-auto text-xs text-emerald-600 font-semibold">
                Cash on Delivery
              </span>
            </div>

            {/* Color selection */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
                Color: <span className="font-normal text-zinc-500">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((col) => {
                  const hasStockInColor = product.variants.some((v) => v.color === col && v.stock > 0);
                  return (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        selectedColor === col
                          ? 'border-amber-900 dark:border-amber-400 bg-amber-900/10 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                      } ${!hasStockInColor ? 'opacity-40 line-through' : ''}`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size selection */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Size: <span className="font-normal text-zinc-500">{selectedSize}</span>
                </label>
                <span className="text-[11px] text-zinc-400">Lahore Tailored Fit</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const variantForSize = product.variants.find(
                    (v) => v.color === selectedColor && v.size === s
                  );
                  const stock = variantForSize ? variantForSize.stock : 0;
                  const available = stock > 0;

                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      disabled={!variantForSize}
                      className={`min-w-[48px] h-11 px-3 rounded-xl text-xs font-bold border flex items-center justify-center transition-all ${
                        selectedSize === s
                          ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                          : available
                          ? 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-zinc-100 dark:bg-zinc-900 line-through cursor-not-allowed'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Variant Stock Status */}
            <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-xs flex items-center justify-between">
              {isOutOfStock ? (
                <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Out of stock for this size & color combination</span>
                </div>
              ) : currentStock <= 4 ? (
                <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Hurry! Only {currentStock} pieces left in our Lahore warehouse</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>In Stock — Ready for prompt InDrive dispatch ({currentStock} available)</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="mt-6 flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    -
                  </button>
                  <span className="px-3 text-zinc-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock}
                    className="px-3.5 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || !currentVariant}
                className="flex-1 py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isOutOfStock ? 'Sold Out in Selected Variant' : 'Add to Cart — Cash on Delivery'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 rounded-2xl border transition-colors ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950 dark:border-rose-900'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-rose-600' : ''}`} />
              </button>
            </div>

            {/* Lahore Delivery Assurance Callout */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <Truck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Lahore InDrive Local Dispatch</span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                Standard delivery: Rs. 250 (Free for orders over Rs. 5,000). Inspect packaging upon arrival and pay cash to the rider.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Fabric Care Tabs */}
      <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 space-y-6">
        <h2 className="font-serif-brand text-xl font-bold text-zinc-900 dark:text-white">
          Product Details & Fabric Specifications
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
          {product.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-400 block uppercase font-bold text-[10px]">Fabric / Material</span>
            <span className="text-zinc-900 dark:text-white font-medium text-sm mt-0.5 block">
              {product.fabric || 'Premium Blended Fabric'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block uppercase font-bold text-[10px]">Fitting</span>
            <span className="text-zinc-900 dark:text-white font-medium text-sm mt-0.5 block">
              Regular / Traditional
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block uppercase font-bold text-[10px]">Care Instructions</span>
            <span className="text-zinc-900 dark:text-white font-medium text-sm mt-0.5 block">
              {product.careInstructions || 'Gentle machine wash with like colors'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block uppercase font-bold text-[10px]">Origin & Dispatch</span>
            <span className="text-zinc-900 dark:text-white font-medium text-sm mt-0.5 block">
              Lahore, Pakistan
            </span>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif-brand text-xl font-bold text-zinc-900 dark:text-white">
              Customer Reviews ({reviews.length})
            </h2>
            <p className="text-xs text-zinc-500">Verified feedback from customers in Lahore</p>
          </div>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Share Your Experience</h3>

            {/* Stars */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Your Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setNewRating(star)}
                    className="text-amber-500 p-0.5"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= newRating ? 'fill-current' : 'text-zinc-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              required
              rows={3}
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              placeholder="Tell other Lahore shoppers about the fabric quality, stitching, and fit..."
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-900/40"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 rounded-xl bg-amber-900 text-white font-semibold text-xs disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </form>
        )}

        {/* Review List */}
        {loadingReviews ? (
          <div className="text-xs text-zinc-400 py-4">Loading verified reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            No reviews yet for this garment. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-zinc-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300">{r.comment}</p>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {r.userName}
                  </span>
                  {r.verifiedPurchase && (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-medium">
                      Verified Lahore Purchase
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="font-serif-brand text-xl font-bold text-zinc-900 dark:text-white">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
