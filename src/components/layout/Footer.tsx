import React from 'react';
import {
  Truck,
  ShieldCheck,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Heart,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { StoreSettings } from '../../types';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
  settings?: StoreSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, settings }) => {
  const { t, language } = useLanguage();

  const storeName = settings?.storeName || 'Jahan Grments';
  const tagline = language === 'ur' && settings?.taglineUrdu ? settings.taglineUrdu : settings?.tagline || 'Timeless Elegance, Everyday Comfort';
  const whatsappNum = settings?.whatsappNumber || '03001234567';
  const address = settings?.storeAddress || 'Main Boulevard, Gulberg III, Lahore, Punjab, Pakistan';

  const openWhatsApp = () => {
    const cleanNum = whatsappNum.replace(/[^0-9]/g, '');
    const intlNum = cleanNum.startsWith('0') ? '92' + cleanNum.substring(1) : cleanNum;
    window.open(`https://wa.me/${intlNum}?text=${encodeURIComponent('Hello Jahan Grments, I would like to inquire about clothing orders in Lahore.')}`, '_blank');
  };

  return (
    <footer className="bg-zinc-950 text-zinc-300 border-t border-zinc-800 transition-colors">
      {/* Brand Value Pillars / Lahore Delivery Highlights */}
      <div className="border-b border-zinc-800/80 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Lahore Local Delivery</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Fulfilled swiftly across all Lahore towns via InDrive rider dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Cash on Delivery (COD)</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Pay safely in cash when your garments arrive at your doorstep in Lahore.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Variant Inventory</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time stock managed by exact size and color combination.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Dedicated WhatsApp</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Chat with our Lahore team for sizing and immediate order queries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-zinc-950 font-serif-brand font-bold text-lg">
              JG
            </div>
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-white">
              {storeName}
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-sm">
            {tagline}. Premium clothing crafted for Men, Women, Boys, Girls, and Kids.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{address}</span>
          </div>
          <div>
            <button
              onClick={openWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: {whatsappNum}</span>
            </button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
            Collections
          </h3>
          <ul className="space-y-2.5 text-sm text-zinc-400">
            <li>
              <button
                onClick={() => onNavigate('catalog', 'gender=men')}
                className="hover:text-white transition-colors"
              >
                Men Eastern & Western
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog', 'gender=women')}
                className="hover:text-white transition-colors"
              >
                Women Festive & Pret
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog', 'gender=boys')}
                className="hover:text-white transition-colors"
              >
                Boys Festive & Casuals
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog', 'gender=girls')}
                className="hover:text-white transition-colors"
              >
                Girls Frocks & Kurtis
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog', 'gender=kids')}
                className="hover:text-white transition-colors"
              >
                Kids & Toddler Sets
              </button>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
            Customer Care
          </h3>
          <ul className="space-y-2.5 text-sm text-zinc-400">
            <li>
              <button
                onClick={() => onNavigate('orders')}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Track Your Order</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('faq')}
                className="hover:text-white transition-colors"
              >
                Frequently Asked Questions
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('contact')}
                className="hover:text-white transition-colors"
              >
                Contact Lahore Store
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('about')}
                className="hover:text-white transition-colors"
              >
                About Jahan Grments
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Policy */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
            Information
          </h3>
          <ul className="space-y-2.5 text-sm text-zinc-400">
            <li>
              <button
                onClick={() => onNavigate('privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('terms')}
                className="hover:text-white transition-colors"
              >
                Terms & Conditions
              </button>
            </li>
            <li className="pt-2">
              <span className="inline-block px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] font-medium">
                Payment: Cash on Delivery Only
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-900 py-6 px-4 text-center text-xs text-zinc-500">
        <p>
          © {new Date().getFullYear()} {storeName}. {t('all_rights_reserved')} Handcrafted with care in Lahore, Pakistan.
        </p>
      </div>
    </footer>
  );
};
