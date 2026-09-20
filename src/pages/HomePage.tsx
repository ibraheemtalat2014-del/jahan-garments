import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { Product, Category, Banner } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  onNavigate: (page: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  banners,
  onNavigate,
  onSelectProduct,
  onQuickView,
}) => {
  const { t, language } = useLanguage();
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  const activeBanners = banners.filter((b) => b.isActive);
  const currentBanner = activeBanners[currentBannerIdx] || activeBanners[0];

  const nextBanner = () => {
    setCurrentBannerIdx((prev) => (prev + 1) % activeBanners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  // Filter products
  const newArrivals = products.filter((p) => p.isNewArrival && p.isActive).slice(0, 4);
  const featuredProducts = products.filter((p) => p.isFeatured && p.isActive).slice(0, 4);
  const saleProducts = products.filter((p) => p.salePrice && p.salePrice < p.regularPrice && p.isActive).slice(0, 4);

  const audienceCategories = [
    {
      title: 'Men',
      titleUrdu: 'مردانہ',
      desc: 'Shalwar Kameez, Kurtas, Polos & Trousers',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
      gender: 'men',
    },
    {
      title: 'Women',
      titleUrdu: 'خواتین',
      desc: '3-Piece Festive Suits, Lawn Kurtis & Pret',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      gender: 'women',
    },
    {
      title: 'Boys',
      titleUrdu: 'لڑکے',
      desc: 'Festive Kurta Pajama & Casual Sets',
      image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
      gender: 'boys',
    },
    {
      title: 'Girls',
      titleUrdu: 'بچیاں',
      desc: 'Embroidered Frocks, Kurtis & Tulip Shalwars',
      image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80',
      gender: 'girls',
    },
    {
      title: 'Kids',
      titleUrdu: 'چھوٹے بچے',
      desc: 'Pure Combed Cotton Summer Sets',
      image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80',
      gender: 'kids',
    },
  ];

  return (
    <div className="space-y-16 pb-20 text-left">
      {/* Hero Banner Carousel */}
      {currentBanner && (
        <section className="relative w-full overflow-hidden bg-zinc-900 min-h-[480px] sm:min-h-[560px] flex items-center">
          <div className="absolute inset-0 z-0">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center opacity-40 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lahore Exclusive Fashion</span>
            </div>

            <h1 className="font-serif-brand text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {language === 'ur' && currentBanner.titleUrdu
                ? currentBanner.titleUrdu
                : currentBanner.title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 mb-8 leading-relaxed">
              {language === 'ur' && currentBanner.subtitleUrdu
                ? currentBanner.subtitleUrdu
                : currentBanner.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('catalog')}
                className="px-7 py-3.5 rounded-xl bg-amber-100 hover:bg-white text-zinc-950 font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <span>{currentBanner.ctaText || t('explore_now')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('catalog', 'filter=new')}
                className="px-6 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 font-semibold text-sm transition-all"
              >
                {t('new_arrivals')}
              </button>
            </div>
          </div>

          {/* Carousel Arrows */}
          {activeBanners.length > 1 && (
            <div className="absolute right-6 bottom-6 z-10 flex items-center gap-2">
              <button
                onClick={prevBanner}
                className="p-2.5 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-800 border border-zinc-700 transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextBanner}
                className="p-2.5 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-800 border border-zinc-700 transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Shop by Audience (Men, Women, Boys, Girls, Kids) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold tracking-widest text-amber-900 dark:text-amber-400 uppercase">
              Curated For Everyone
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
              {t('shop_by_category')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-amber-900 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            View Entire Store <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {audienceCategories.map((cat) => (
            <button
              key={cat.gender}
              onClick={() => onNavigate('catalog', `gender=${cat.gender}`)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 text-left"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              <div className="absolute inset-x-3 bottom-3 text-white">
                <span className="text-[11px] text-amber-300 font-semibold tracking-wider uppercase block">
                  {language === 'ur' ? cat.titleUrdu : 'Collection'}
                </span>
                <h3 className="font-serif-brand text-lg sm:text-xl font-bold">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5 opacity-90">
                  {cat.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-900 dark:text-amber-400 uppercase">
                Fresh From The Workshop
              </span>
              <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                {t('new_arrivals')}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('catalog', 'filter=new')}
              className="text-xs font-semibold text-amber-900 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              See All New <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* Lahore Express Dispatch Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 p-8 sm:p-12 text-white border border-amber-900/50 shadow-xl">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/70 border border-amber-600/30 text-amber-300 text-xs font-semibold">
              <Truck className="w-4 h-4" />
              <span>Lahore InDrive Dispatch Service</span>
            </div>
            <h2 className="font-serif-brand text-2xl sm:text-4xl font-extrabold tracking-tight">
              Direct to Your Doorstep in Lahore
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              We exclusively serve the city of Lahore. Orders are dispatched quickly with verified InDrive riders so you can inspect your garments and pay conveniently with Cash on Delivery (COD).
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-amber-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cash on Delivery (COD)
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Fast Rider Fulfillment
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-400" /> Free Delivery over Rs. 5,000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-900 dark:text-amber-400 uppercase">
                Customer Favorites
              </span>
              <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                {t('featured')}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs font-semibold text-amber-900 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Browse All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-amber-900 dark:text-amber-400 uppercase">
            Testimonials
          </span>
          <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
            {t('customer_feedback')}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Read authentic feedback from families across Lahore who shop with Jahan Grments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
              "The Royal Wash & Wear Shalwar Kameez fits like bespoke tailoring. Delivered to our house in DHA Phase 5 via InDrive in perfect condition. Truly exceptional quality for the price."
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Farhan Siddiqui</p>
              <p className="text-[11px] text-zinc-500">DHA Phase 5, Lahore • Verified Purchase</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
              "Ordered the Jacquard 3-Piece suit for a family wedding in Gulberg. The color and zari weave are even more graceful in person than on the website. Paid COD without hassle."
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Ayesha Tariq</p>
              <p className="text-[11px] text-zinc-500">Gulberg III, Lahore • Verified Purchase</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
              "Purchased Eid sets for my two sons and little daughter. Soft, pure cotton fabric that didn't shrink or fade after washing. Jahan Grments is our family's go-to clothing brand now."
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Usman Raza</p>
              <p className="text-[11px] text-zinc-500">Johar Town, Lahore • Verified Purchase</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
