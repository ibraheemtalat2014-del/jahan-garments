import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Truck,
  Phone,
  ChevronDown,
  ArrowRight,
  LogOut,
  Package,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';

interface NavbarProps {
  onNavigate: (page: string, param?: string) => void;
  currentPage: string;
  onOpenAuth: () => void;
  products: Product[];
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentPage,
  onOpenAuth,
  products,
}) => {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { totalItemsCount, setIsCartOpen, subtotal } = useCart();
  const { wishlist } = useWishlist();
  const { currentUser, userProfile, isAdmin, logout, loginAsDemoCustomer, loginAsDemoAdmin } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.subcategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.fabric?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onNavigate('catalog', `search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: t('home'), page: 'home', param: '' },
    { label: t('men'), page: 'catalog', param: 'gender=men' },
    { label: t('women'), page: 'catalog', param: 'gender=women' },
    { label: t('boys'), page: 'catalog', param: 'gender=boys' },
    { label: t('girls'), page: 'catalog', param: 'gender=girls' },
    { label: t('kids'), page: 'catalog', param: 'gender=kids' },
    { label: t('sale'), page: 'catalog', param: 'filter=sale', highlight: true },
    { label: t('new_arrivals'), page: 'catalog', param: 'filter=new' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Top Announcement Bar for Lahore Express Delivery */}
      <div className="bg-amber-950 text-amber-100 text-xs py-2 px-4 border-b border-amber-900/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="font-semibold text-amber-300">Lahore Express Delivery:</strong> Fulfilled via InDrive local rider dispatch. Cash on Delivery (COD) available on all orders!
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-amber-300 font-medium">
              <span>0300-1234567</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-medium transition-colors text-[11px]"
                title="Switch Language"
              >
                {language === 'en' ? 'اردو (Urdu)' : 'English'}
              </button>
              <button
                onClick={toggleTheme}
                className="p-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus:outline-none group shrink-0"
          >
            <div className="w-11 h-11 rounded-lg bg-zinc-900 dark:bg-amber-100 flex items-center justify-center text-amber-100 dark:text-zinc-950 font-serif-brand font-bold text-xl tracking-wider shadow-sm group-hover:scale-105 transition-transform">
              JG
            </div>
            <div>
              <span className="font-serif-brand text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white block">
                {t('brand_name')}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide uppercase hidden sm:block">
                {language === 'ur' ? 'روایت اور جدید انداز' : 'Lahore • Pakistan'}
              </span>
            </div>
          </button>

          {/* Search Bar - Center Desktop */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-md mx-4 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder={t('search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-900/40 dark:focus:ring-amber-500/40 transition-all"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            </form>

            {/* Live Search Suggestions Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50">
                <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3">
                  Matching Products
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        onNavigate('product', item.id);
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors"
                    >
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize">
                          {item.gender} • {item.subcategory || item.category}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-amber-900 dark:text-amber-400 shrink-0">
                        Rs. {(item.salePrice || item.regularPrice).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSearchSubmit}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold text-center text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center justify-center gap-1"
                >
                  View all results for "{searchQuery}" <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wishlist Icon */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="p-2.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 relative transition-colors"
              title={t('wishlist')}
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 relative transition-colors flex items-center gap-2"
              title={t('cart')}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-900 dark:bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-semibold text-zinc-900 dark:text-white">
                Rs. {subtotal.toLocaleString()}
              </span>
            </button>

            {/* Customer Account Menu */}
            <div ref={accountRef} className="relative">
              {currentUser || userProfile ? (
                <div>
                  <button
                    onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-900 text-white text-xs font-bold flex items-center justify-center">
                      {(userProfile?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200 hidden md:block max-w-[90px] truncate">
                      {userProfile?.displayName?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {accountDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-2 z-50">
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Signed in as</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {userProfile?.displayName || currentUser?.email}
                        </p>
                        {userProfile?.role === 'owner' && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                            Store Owner
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          onNavigate('account');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4" /> My Profile & Lahore Address
                      </button>

                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          onNavigate('orders');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5"
                      >
                        <Package className="w-4 h-4" /> My Orders & Tracking
                      </button>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

                      <button
                        onClick={async () => {
                          setAccountDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" /> {t('sign_out')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenAuth}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{t('sign_in')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Category Navigation Strip Desktop */}
        <nav className="hidden lg:flex items-center justify-center gap-8 py-3 border-t border-zinc-100 dark:border-zinc-900 text-sm font-medium">
          {navLinks.map((link) => (
            <button
              key={link.page + link.param}
              onClick={() => onNavigate(link.page, link.param)}
              className={`transition-colors relative py-1 ${
                link.highlight
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              {link.label}
              {link.highlight && (
                <span className="ml-1 text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold">
                  Offer
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[120px] bg-white dark:bg-zinc-950 z-50 overflow-y-auto px-6 py-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="mb-6">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            </form>
          </div>

          <div className="flex flex-col gap-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {navLinks.map((link) => (
              <button
                key={link.page + link.param}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(link.page, link.param);
                }}
                className="pt-3 text-left text-base font-semibold text-zinc-900 dark:text-white flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
            {!currentUser && !userProfile && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    loginAsDemoCustomer();
                  }}
                  className="py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Demo Customer
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    loginAsDemoAdmin();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-semibold"
                >
                  Demo Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
