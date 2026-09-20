import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  Search,
  Check,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { Product, Category, Gender } from '../types';
import { ProductCard } from '../components/product/ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface CatalogPageProps {
  products: Product[];
  categories: Category[];
  initialGender?: string;
  initialFilter?: string;
  initialSearch?: string;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  categories,
  initialGender,
  initialFilter,
  initialSearch,
  onSelectProduct,
  onQuickView,
}) => {
  const { t } = useLanguage();

  const [search, setSearch] = useState<string>(initialSearch || '');
  const [selectedGender, setSelectedGender] = useState<string>(initialGender || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [onlySale, setOnlySale] = useState<boolean>(initialFilter === 'sale');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [priceMax, setPriceMax] = useState<number>(10000);

  // Sync props if changed
  useEffect(() => {
    if (initialGender) setSelectedGender(initialGender);
  }, [initialGender]);

  useEffect(() => {
    if (initialFilter === 'sale') setOnlySale(true);
    if (initialFilter === 'new') setSortBy('newest');
  }, [initialFilter]);

  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);

  // Extract all unique sizes and colors available in product database
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [products]);

  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q) ||
          p.fabric?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Gender / Audience
      if (selectedGender !== 'all' && p.gender !== selectedGender) {
        return false;
      }

      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Price limit
      const price = p.salePrice && p.salePrice > 0 ? p.salePrice : p.regularPrice;
      if (price > priceMax) {
        return false;
      }

      // Sale filter
      if (onlySale && (!p.salePrice || p.salePrice >= p.regularPrice)) {
        return false;
      }

      // Size filter
      if (selectedSize !== 'all' && !p.sizes.includes(selectedSize)) {
        return false;
      }

      // Color filter
      if (selectedColor !== 'all' && !p.colors.includes(selectedColor)) {
        return false;
      }

      // In stock only
      if (onlyInStock) {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
        if (totalStock <= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice && a.salePrice > 0 ? a.salePrice : a.regularPrice;
      const priceB = b.salePrice && b.salePrice > 0 ? b.salePrice : b.regularPrice;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'popular') return (b.reviewCount || 0) - (a.reviewCount || 0);
      // Newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    products,
    search,
    selectedGender,
    selectedCategory,
    priceMax,
    onlySale,
    selectedSize,
    selectedColor,
    onlyInStock,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearch('');
    setSelectedGender('all');
    setSelectedCategory('all');
    setSelectedSize('all');
    setSelectedColor('all');
    setOnlySale(false);
    setOnlyInStock(false);
    setPriceMax(10000);
    setSortBy('newest');
  };

  const hasActiveFilters =
    search !== '' ||
    selectedGender !== 'all' ||
    selectedCategory !== 'all' ||
    selectedSize !== 'all' ||
    selectedColor !== 'all' ||
    onlySale ||
    onlyInStock ||
    priceMax < 10000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Page Title & Breadcrumb */}
      <div className="mb-6">
        <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
          {selectedGender === 'all'
            ? 'Complete Clothing Collection'
            : `${selectedGender.toUpperCase()} Collection`}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Showing {filteredProducts.length} premium garments available for Lahore delivery
        </p>
      </div>

      {/* Gender Tab Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {[
          { id: 'all', label: 'All Garments' },
          { id: 'men', label: 'Men' },
          { id: 'women', label: 'Women' },
          { id: 'boys', label: 'Boys' },
          { id: 'girls', label: 'Girls' },
          { id: 'kids', label: 'Kids & Toddlers' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedGender(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGender === tab.id
                ? 'bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Filters Trigger & Sorting Bar */}
      <div className="flex items-center justify-between gap-4 py-3 border-y border-zinc-200 dark:border-zinc-800 mb-8">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters {hasActiveFilters && '• Active'}</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 ml-auto text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-900 text-xs"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Top Customer Rated</option>
          </select>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-6">
          {/* Search inside catalog */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs focus:outline-none focus:ring-2 focus:ring-amber-900/30"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left py-1 px-2 rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left py-1 px-2 rounded-lg transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
              <span>Max Price</span>
              <span className="text-amber-900 dark:text-amber-400 font-semibold">
                Rs. {priceMax.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={1500}
              max={10000}
              step={200}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-amber-900 dark:accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>Rs. 1,500</span>
              <span>Rs. 10,000+</span>
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Size
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSize('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selectedSize === 'all'
                    ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                All
              </button>
              {allSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedSize === size
                      ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Color
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedColor('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selectedColor === 'all'
                    ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                All
              </button>
              {allColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedColor === color
                      ? 'border-amber-900 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-200 font-bold'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={onlySale}
                onChange={(e) => setOnlySale(e.target.checked)}
                className="rounded text-amber-900 focus:ring-amber-900"
              />
              <span>Sale Products Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded text-amber-900 focus:ring-amber-900"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="py-16 px-4 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                No matching garments found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Try clearing your search query or selecting a broader category and size.
              </p>
              <button
                onClick={resetFilters}
                className="py-2.5 px-6 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-semibold text-xs transition-colors hover:bg-zinc-800"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Slide-over Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden animate-in fade-in duration-200">
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white dark:bg-zinc-900 shadow-2xl flex flex-col p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Filter Products
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile filter controls */}
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase mb-2 block">
                  Audience
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['all', 'men', 'women', 'boys', 'girls', 'kids'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g)}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize border ${
                        selectedGender === g
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase mb-2 block">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={onlySale}
                    onChange={(e) => setOnlySale(e.target.checked)}
                  />
                  <span>Sale Items Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 text-xs font-bold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
