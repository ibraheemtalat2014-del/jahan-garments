import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    brand_name: 'Jahan Grments',
    brand_tagline: 'Timeless Elegance, Everyday Comfort',
    home: 'Home',
    catalog: 'Catalog',
    men: 'Men',
    women: 'Women',
    boys: 'Boys',
    girls: 'Girls',
    kids: 'Kids',
    sale: 'Sale',
    new_arrivals: 'New Arrivals',
    featured: 'Featured',
    search_placeholder: 'Search clothes, fabrics, styles (e.g. Shalwar Kameez, Kurta, Polo)...',
    cart: 'Cart',
    wishlist: 'Wishlist',
    account: 'Account',
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    sign_out: 'Sign Out',
    admin_portal: 'Admin Portal',
    storefront: 'Storefront',
    lahore_only: 'Lahore Delivery Only',
    lahore_notice: 'We exclusively deliver within Lahore via InDrive local rider dispatch.',
    cash_on_delivery: 'Cash on Delivery (COD)',
    rs: 'Rs.',
    add_to_cart: 'Add to Cart',
    select_size: 'Select Size',
    select_color: 'Select Color',
    out_of_stock: 'Out of Stock',
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    only_left: 'only left!',
    price: 'Price',
    regular_price: 'Regular Price',
    sale_price: 'Sale Price',
    save: 'Save',
    checkout: 'Checkout',
    subtotal: 'Subtotal',
    delivery_fee: 'Delivery Fee (Lahore)',
    free: 'FREE',
    free_delivery_over: 'Free Lahore Delivery on orders above Rs. 5,000',
    grand_total: 'Grand Total',
    place_order: 'Place Order (Cash on Delivery)',
    order_success: 'Order Placed Successfully!',
    order_number: 'Order Number',
    order_tracking: 'Track Order',
    track_your_order: 'Track Your Order',
    status_pending: 'Pending Confirmation',
    status_confirmed: 'Confirmed',
    status_processing: 'Preparing Order',
    status_shipped: 'Out for Delivery (InDrive)',
    status_delivered: 'Delivered',
    status_cancelled: 'Cancelled',
    full_name: 'Full Name',
    phone_number: 'Phone Number (Pakistani 03XX-XXXXXXX)',
    lahore_area: 'Lahore Area / Locality',
    delivery_address: 'Complete Street Address',
    delivery_instructions: 'Delivery Instructions (e.g. Landmark, Near Mosque)',
    reviews: 'Reviews',
    write_review: 'Write a Review',
    fabric: 'Fabric & Material',
    care_instructions: 'Care Instructions',
    empty_cart: 'Your shopping cart is empty',
    empty_wishlist: 'Your wishlist is empty',
    continue_shopping: 'Continue Shopping',
    view_details: 'View Details',
    quick_view: 'Quick View',
    about_us: 'About Us',
    faq: 'FAQ',
    privacy_policy: 'Privacy Policy',
    terms_conditions: 'Terms & Conditions',
    contact_us: 'Contact Us',
    whatsapp_support: 'WhatsApp Support',
    all_rights_reserved: 'All rights reserved.',
    hero_title: 'Dignity & Style for the Whole Family',
    hero_subtitle: 'Explore our latest Pakistani Eastern and Western collections for Men, Women, and Children. Premium fabrics, tailored silhouettes, and affordable elegance.',
    explore_now: 'Explore Collection',
    shop_by_category: 'Shop by Category',
    trending_now: 'Trending in Lahore',
    customer_feedback: 'Loved by Families Across Lahore',
    demo_mode_active: 'Demo Account Active',
    unauthorized: 'Unauthorized Access',
    admin_only: 'This section is restricted to Jahan Grments administrators.',
  },
  ur: {
    brand_name: 'جہاں گارمنٹس',
    brand_tagline: 'روایت اور جدید انداز کا حسین سنگم',
    home: 'ہوم',
    catalog: 'کیٹلاگ',
    men: 'مردانہ',
    women: 'خواتین',
    boys: 'لڑکے',
    girls: 'بچیاں',
    kids: 'چھوٹے بچے',
    sale: 'سیل',
    new_arrivals: 'نئی آمد',
    featured: 'نمایاں',
    search_placeholder: 'کپڑے، فیبرک یا انداز تلاش کریں (مثلاً شلوار قمیض، کرتا، پولو)...',
    cart: 'ٹوکری',
    wishlist: 'پسندیدہ',
    account: 'اکاؤنٹ',
    sign_in: 'لاگ ان',
    sign_up: 'رجسٹر کریں',
    sign_out: 'لاگ آؤٹ',
    admin_portal: 'ایڈمن پورٹل',
    storefront: 'اسٹور پر جائیں',
    lahore_only: 'صرف لاہور میں ڈلیوری',
    lahore_notice: 'ہم صرف لاہور کے اندر ان ڈرائیو لوکل رائیڈر کے ذریعے ڈلیوری کرتے ہیں۔',
    cash_on_delivery: 'کیش آن ڈلیوری (نقد ادائیگی)',
    rs: 'روپے',
    add_to_cart: 'ٹوکری میں ڈالیں',
    select_size: 'سائز منتخب کریں',
    select_color: 'رنگ منتخب کریں',
    out_of_stock: 'اسٹاک ختم ہے',
    in_stock: 'اسٹاک موجود ہے',
    low_stock: 'کم اسٹاک',
    only_left: 'باقی ہیں!',
    price: 'قیمت',
    regular_price: 'اصل قیمت',
    sale_price: 'سیل کی قیمت',
    save: 'بچت',
    checkout: 'آرڈر مکمل کریں',
    subtotal: 'ذیلی کل',
    delivery_fee: 'ڈلیوری چارجز (لاہور)',
    free: 'مفت',
    free_delivery_over: '5,000 روپے سے زائد کے آرڈر پر مفت لاہور ڈلیوری',
    grand_total: 'کل رقم',
    place_order: 'آرڈر جمع کروائیں (کیش آن ڈلیوری)',
    order_success: 'آرڈر کامیابی سے وصول ہو گیا!',
    order_number: 'آرڈر نمبر',
    order_tracking: 'آرڈر ٹریک کریں',
    track_your_order: 'اپنے آرڈر کی صورتحال جانیں',
    status_pending: 'تصدیق کا انتظار',
    status_confirmed: 'تصدیق شدہ',
    status_processing: 'تیاری جاری ہے',
    status_shipped: 'ڈلیوری کے لیے روانہ (ان ڈرائیو)',
    status_delivered: 'پہنچ گیا',
    status_cancelled: 'منسوخ شدہ',
    full_name: 'پورا نام',
    phone_number: 'فون نمبر (03XX-XXXXXXX)',
    lahore_area: 'لاہور کا علاقہ / ٹاؤن',
    delivery_address: 'مکمل گلی و گھر کا پتہ',
    delivery_instructions: 'ڈلیوری کی خصوصی ہدایات (قریبی مسجد یا نمایاں جگہ)',
    reviews: 'صارفین کی رائے',
    write_review: 'اپنی رائے درج کریں',
    fabric: 'کپڑا اور مٹیریل',
    care_instructions: 'دھلائی کی ہدایات',
    empty_cart: 'آپ کی شاپنگ کارٹ خالی ہے',
    empty_wishlist: 'آپ کی پسندیدہ فہرست خالی ہے',
    continue_shopping: 'خریداری جاری رکھیں',
    view_details: 'تفصیلات دیکھیں',
    quick_view: 'فوری جائزہ',
    about_us: 'ہمارے متعلق',
    faq: 'اکثر پوچھے جانے والے سوالات',
    privacy_policy: 'پرائیویسی پالیسی',
    terms_conditions: 'شرائط و ضوابط',
    contact_us: 'ہم سے رابطہ کریں',
    whatsapp_support: 'واٹس ایپ سپورٹ',
    all_rights_reserved: 'جملہ حقوق محفوظ ہیں۔',
    hero_title: 'پورے خاندان کے لیے وقار اور خوبصورتی',
    hero_subtitle: 'جہاں گارمنٹس کی شاندار مشرقی و مغربی کلیکشن۔ مردانہ، خواتین اور بچوں کے لیے بہترین کوالٹی کے ملبوسات مناسب قیمت میں۔',
    explore_now: 'کلیکشن دیکھیں',
    shop_by_category: 'کیٹیگری منتخب کریں',
    trending_now: 'لاہور میں مقبول ترین',
    customer_feedback: 'لاہوری خاندانوں کا بھروسہ',
    demo_mode_active: 'ڈیمو اکاؤنٹ فعال ہے',
    unauthorized: 'رسائی کی اجازت نہیں',
    admin_only: 'یہ حصہ صرف جہاں گارمنٹس کے انتظامیہ کے لیے مخصوص ہے۔',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('jg_lang') as Language) || 'en';
  });

  const isRTL = language === 'ur';

  useEffect(() => {
    localStorage.setItem('jg_lang', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div className={isRTL ? 'font-urdu' : ''}>{children}</div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
