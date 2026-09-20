import {
  collection,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Product, Category, StoreSettings, Banner } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'men-eastern',
    name: 'Men Eastern',
    nameUrdu: 'مردانہ روایتی لباس',
    slug: 'men-eastern',
    gender: 'men',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 1,
  },
  {
    id: 'men-western',
    name: 'Men Western & Casuals',
    nameUrdu: 'مردانہ کیژول و ویسٹرن',
    slug: 'men-western',
    gender: 'men',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 2,
  },
  {
    id: 'women-festive',
    name: 'Women Festive & Unstitched',
    nameUrdu: 'خواتین فیسٹیو کلیکشن',
    slug: 'women-festive',
    gender: 'women',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 3,
  },
  {
    id: 'women-pret',
    name: 'Women Ready to Wear',
    nameUrdu: 'خواتین تیار ملبوسات',
    slug: 'women-pret',
    gender: 'women',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 4,
  },
  {
    id: 'boys',
    name: 'Boys Collection',
    nameUrdu: 'لڑکوں کے ملبوسات',
    slug: 'boys',
    gender: 'boys',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 5,
  },
  {
    id: 'girls',
    name: 'Girls Collection',
    nameUrdu: 'بچیوں کے ملبوسات',
    slug: 'girls',
    gender: 'girls',
    image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 6,
  },
  {
    id: 'kids',
    name: 'Kids & Toddlers',
    nameUrdu: 'چھوٹے بچوں کا لباس',
    slug: 'kids',
    gender: 'kids',
    image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    order: 7,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'jg-prod-001',
    name: 'Royal Wash & Wear Shalwar Kameez',
    nameUrdu: 'شاہی واش اینڈ ویئر شلوار قمیض',
    description: 'Expertly tailored from premium crease-resistant blended fabric. Features classic band collar, custom dyed buttons, and tailored cuffs. Ideal for formal gatherings and Friday prayer.',
    descriptionUrdu: 'شاندار بلینڈڈ فیبرک سے تیار کردہ۔ کلاسک بین کالر اور عمدہ کٹنگ۔ جمعہ اور تقاریب کے لیے بہترین انتخاب۔',
    category: 'men-eastern',
    subcategory: 'Shalwar Kameez',
    gender: 'men',
    regularPrice: 4299,
    salePrice: 3599,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Midnight Navy', 'Charcoal Grey', 'Pearl White'],
    sizes: ['S', 'M', 'L', 'XL'],
    variants: [
      { id: 'jg-001-navy-s', color: 'Midnight Navy', colorHex: '#102a43', size: 'S', stock: 5, sku: 'JG-M01-NV-S' },
      { id: 'jg-001-navy-m', color: 'Midnight Navy', colorHex: '#102a43', size: 'M', stock: 8, sku: 'JG-M01-NV-M' },
      { id: 'jg-001-navy-l', color: 'Midnight Navy', colorHex: '#102a43', size: 'L', stock: 6, sku: 'JG-M01-NV-L' },
      { id: 'jg-001-navy-xl', color: 'Midnight Navy', colorHex: '#102a43', size: 'XL', stock: 2, sku: 'JG-M01-NV-XL' },
      { id: 'jg-001-grey-s', color: 'Charcoal Grey', colorHex: '#334e68', size: 'S', stock: 4, sku: 'JG-M01-GR-S' },
      { id: 'jg-001-grey-m', color: 'Charcoal Grey', colorHex: '#334e68', size: 'M', stock: 7, sku: 'JG-M01-GR-M' },
      { id: 'jg-001-grey-l', color: 'Charcoal Grey', colorHex: '#334e68', size: 'L', stock: 3, sku: 'JG-M01-GR-L' },
      { id: 'jg-001-white-m', color: 'Pearl White', colorHex: '#f0f4f8', size: 'M', stock: 5, sku: 'JG-M01-WH-M' },
      { id: 'jg-001-white-l', color: 'Pearl White', colorHex: '#f0f4f8', size: 'L', stock: 4, sku: 'JG-M01-WH-L' },
    ],
    fabric: 'Premium Tropical Wash & Wear (65% Poly, 35% Viscose)',
    careInstructions: 'Machine wash delicate cycle in cold water. Low heat iron. Do not bleach.',
    isNewArrival: true,
    isFeatured: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 24,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-002',
    name: 'Fine Egyptian Cotton Embroidered Kurta',
    nameUrdu: 'فائن مصری کاٹن کڑھائی دار کرتا',
    description: 'Crafted from 100% long-staple combed cotton with subtle tone-on-tone neckline embroidery. Breathable and comfortable for warm Lahore summers.',
    descriptionUrdu: 'سو فیصد خالص کاٹن، خوبصورت اور نفیس نیک لائن کڑھائی کے ساتھ۔ گرم موسم کے لیے ٹھنڈا اور آرام دہ۔',
    category: 'men-eastern',
    subcategory: 'Kurtas',
    gender: 'men',
    regularPrice: 3199,
    salePrice: 2699,
    images: [
      'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Deep Emerald', 'Mustard Sand'],
    sizes: ['M', 'L', 'XL'],
    variants: [
      { id: 'jg-002-em-m', color: 'Deep Emerald', colorHex: '#0f5132', size: 'M', stock: 6, sku: 'JG-M02-EM-M' },
      { id: 'jg-002-em-l', color: 'Deep Emerald', colorHex: '#0f5132', size: 'L', stock: 4, sku: 'JG-M02-EM-L' },
      { id: 'jg-002-em-xl', color: 'Deep Emerald', colorHex: '#0f5132', size: 'XL', stock: 1, sku: 'JG-M02-EM-XL' },
      { id: 'jg-002-ms-m', color: 'Mustard Sand', colorHex: '#b4690e', size: 'M', stock: 5, sku: 'JG-M02-MS-M' },
      { id: 'jg-002-ms-l', color: 'Mustard Sand', colorHex: '#b4690e', size: 'L', stock: 3, sku: 'JG-M02-MS-L' },
    ],
    fabric: '100% Combed Egyptian Cotton',
    careInstructions: 'Hand wash or gentle machine wash. Medium iron with steam.',
    isNewArrival: true,
    isFeatured: true,
    isActive: true,
    rating: 4.7,
    reviewCount: 18,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-003',
    name: 'Classic Honeycomb Pique Polo Shirt',
    nameUrdu: 'کلاسک ہنی کومب پولو شرٹ',
    description: 'Heavyweight 220 GSM breathable cotton pique polo with ribbed collar and dual-button placket. Timeless casual staple for daily elegance.',
    descriptionUrdu: '220 جی ایس ایم معیاری کاٹن پولو، آرام دہ کالر اور پائیدار سلائی کے ساتھ۔ روزمرہ پہننے کے لیے بہترین۔',
    category: 'men-western',
    subcategory: 'Polo & T-Shirts',
    gender: 'men',
    regularPrice: 2199,
    salePrice: 1799,
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1625910513413-5858cfd7950c?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Jet Black', 'Wine Maroon', 'Heather Grey'],
    sizes: ['S', 'M', 'L', 'XL'],
    variants: [
      { id: 'jg-003-bk-s', color: 'Jet Black', colorHex: '#121212', size: 'S', stock: 10, sku: 'JG-P03-BK-S' },
      { id: 'jg-003-bk-m', color: 'Jet Black', colorHex: '#121212', size: 'M', stock: 12, sku: 'JG-P03-BK-M' },
      { id: 'jg-003-bk-l', color: 'Jet Black', colorHex: '#121212', size: 'L', stock: 8, sku: 'JG-P03-BK-L' },
      { id: 'jg-003-mr-m', color: 'Wine Maroon', colorHex: '#611a2b', size: 'M', stock: 6, sku: 'JG-P03-MR-M' },
      { id: 'jg-003-mr-l', color: 'Wine Maroon', colorHex: '#611a2b', size: 'L', stock: 5, sku: 'JG-P03-MR-L' },
    ],
    fabric: '95% Cotton, 5% Spandex Stretch Pique',
    careInstructions: 'Machine wash warm with similar colors. Tumble dry low.',
    isNewArrival: false,
    isFeatured: false,
    isActive: true,
    rating: 4.9,
    reviewCount: 31,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-004',
    name: 'Jacquard Zari 3-Piece Stitched Festive Suit',
    nameUrdu: 'جیکوارڈ زری تھری پیس فیسٹیو سوٹ',
    description: 'Exquisite jacquard weave shirt adorned with subtle metallic zari motifs, paired with embroidered organza dupatta and tailored cambric trousers.',
    descriptionUrdu: 'نفیس زری جیکوارڈ کرتی، کڑھائی دار آرگنزا دوپٹہ اور کیمبرک ٹراؤزر۔ تقریبات کے لیے پروقار لباس۔',
    category: 'women-festive',
    subcategory: '3-Piece Suits',
    gender: 'women',
    regularPrice: 6499,
    salePrice: 5299,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Dusty Rose', 'Teal Green'],
    sizes: ['XS', 'S', 'M', 'L'],
    variants: [
      { id: 'jg-004-dr-s', color: 'Dusty Rose', colorHex: '#c08081', size: 'S', stock: 3, sku: 'JG-W04-DR-S' },
      { id: 'jg-004-dr-m', color: 'Dusty Rose', colorHex: '#c08081', size: 'M', stock: 5, sku: 'JG-W04-DR-M' },
      { id: 'jg-004-dr-l', color: 'Dusty Rose', colorHex: '#c08081', size: 'L', stock: 2, sku: 'JG-W04-DR-L' },
      { id: 'jg-004-tg-s', color: 'Teal Green', colorHex: '#1e4d58', size: 'S', stock: 4, sku: 'JG-W04-TG-S' },
      { id: 'jg-004-tg-m', color: 'Teal Green', colorHex: '#1e4d58', size: 'M', stock: 6, sku: 'JG-W04-TG-M' },
    ],
    fabric: 'Jacquard Weave Lawn Shirt, Organza Dupatta, Cambric Trousers',
    careInstructions: 'Dry clean recommended. Light steam iron only.',
    isNewArrival: true,
    isFeatured: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-005',
    name: 'Printed Lawn Ready-to-Wear Daily Kurti',
    nameUrdu: 'پرنٹڈ لان ریڈی ٹو ویئر ڈیلی کرتی',
    description: 'Vibrant ethnic geometric motifs on premium combed lawn fabric. Finished with lacework sleeves and contrast neck piping. Perfect for university and workplace.',
    descriptionUrdu: 'خوبصورت جیومیٹرک پرنٹس، لیس کی سجاوٹ اور جدید کٹ۔ روزمرہ کالج اور دفتر کے لیے آرام دہ۔',
    category: 'women-pret',
    subcategory: 'Kurtis',
    gender: 'women',
    regularPrice: 2499,
    salePrice: 1999,
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Ochre Mustard', 'Sky Azure'],
    sizes: ['S', 'M', 'L'],
    variants: [
      { id: 'jg-005-oc-s', color: 'Ochre Mustard', colorHex: '#d97706', size: 'S', stock: 8, sku: 'JG-W05-OC-S' },
      { id: 'jg-005-oc-m', color: 'Ochre Mustard', colorHex: '#d97706', size: 'M', stock: 7, sku: 'JG-W05-OC-M' },
      { id: 'jg-005-sk-m', color: 'Sky Azure', colorHex: '#0284c7', size: 'M', stock: 5, sku: 'JG-W05-SK-M' },
      { id: 'jg-005-sk-l', color: 'Sky Azure', colorHex: '#0284c7', size: 'L', stock: 3, sku: 'JG-W05-SK-L' },
    ],
    fabric: '100% Pure Lawn 80/80 Count',
    careInstructions: 'Machine wash in mild detergent. Dry in shade to maintain color brilliance.',
    isNewArrival: true,
    isFeatured: true,
    isActive: true,
    rating: 4.6,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-006',
    name: 'Junior Boys Embroidered Eid Kurta Set',
    nameUrdu: 'لڑکوں کا عید کرتہ شلوار سیٹ',
    description: 'Traditional boys kurta with neat thread embroidery at ban and placket, accompanied by a comfortable cotton shalwar. Crafted for durability and festive comfort.',
    descriptionUrdu: 'بچوں کے لیے خوبصورت کڑھائی دار کرتہ اور آرام دہ شلوار۔ عید اور خاندانی تقریبات کے لیے بہترین۔',
    category: 'boys',
    subcategory: 'Eastern Wear',
    gender: 'boys',
    regularPrice: 2899,
    salePrice: 2299,
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Royal Blue', 'Ivory Cream'],
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-11Y'],
    variants: [
      { id: 'jg-006-rb-4', color: 'Royal Blue', colorHex: '#1d4ed8', size: '4-5Y', stock: 4, sku: 'JG-B06-RB-04' },
      { id: 'jg-006-rb-6', color: 'Royal Blue', colorHex: '#1d4ed8', size: '6-7Y', stock: 6, sku: 'JG-B06-RB-06' },
      { id: 'jg-006-rb-8', color: 'Royal Blue', colorHex: '#1d4ed8', size: '8-9Y', stock: 3, sku: 'JG-B06-RB-08' },
      { id: 'jg-006-iv-6', color: 'Ivory Cream', colorHex: '#fef3c7', size: '6-7Y', stock: 5, sku: 'JG-B06-IV-06' },
      { id: 'jg-006-iv-8', color: 'Ivory Cream', colorHex: '#fef3c7', size: '8-9Y', stock: 2, sku: 'JG-B06-IV-08' },
    ],
    fabric: 'Breathable Cotton Blended Fabric',
    careInstructions: 'Gentle hand wash or machine cycle. Warm iron.',
    isNewArrival: true,
    isFeatured: false,
    isActive: true,
    rating: 4.8,
    reviewCount: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-007',
    name: 'Girls Festive Embroidered Chiffon Frock',
    nameUrdu: 'بچیوں کی فیسٹیو شیفون فراک',
    description: 'Graceful flared chiffon frock with soft cotton inner lining, golden lace borders, and matching chiffon dupatta. Comfortable non-itchy inner stitching.',
    descriptionUrdu: 'خوبصورت گھیر دار شیفون فراک، نرم اندرونی کاٹن استر اور لیس بارڈرز کے ساتھ۔',
    category: 'girls',
    subcategory: 'Festive Wear',
    gender: 'girls',
    regularPrice: 3499,
    salePrice: 2899,
    images: [
      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Blush Pink', 'Lilac Lavender'],
    sizes: ['4-5Y', '6-7Y', '8-9Y'],
    variants: [
      { id: 'jg-007-bp-4', color: 'Blush Pink', colorHex: '#f472b6', size: '4-5Y', stock: 5, sku: 'JG-G07-BP-04' },
      { id: 'jg-007-bp-6', color: 'Blush Pink', colorHex: '#f472b6', size: '6-7Y', stock: 4, sku: 'JG-G07-BP-06' },
      { id: 'jg-007-ll-6', color: 'Lilac Lavender', colorHex: '#c084fc', size: '6-7Y', stock: 3, sku: 'JG-G07-LL-06' },
      { id: 'jg-007-ll-8', color: 'Lilac Lavender', colorHex: '#c084fc', size: '8-9Y', stock: 2, sku: 'JG-G07-LL-08' },
    ],
    fabric: 'Soft Chiffon with 100% Breathable Cotton Lawn Lining',
    careInstructions: 'Hand wash cold. Do not wring. Hang dry.',
    isNewArrival: true,
    isFeatured: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 22,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'jg-prod-008',
    name: 'Toddler Pure Cotton Summer Kurta Pajama',
    nameUrdu: 'چھوٹے بچوں کا سوتی کرتہ پاجامہ',
    description: 'Ultra-soft hypoallergenic combed cotton kurta and elasticated waist pajama designed for tender skin. Snap buttons for effortless dressing.',
    descriptionUrdu: 'انتہائی نرم سوتی فیبرک، حساس جلد کے لیے محفوظ۔ پہنانے میں آسان اور مکمل آرام دہ۔',
    category: 'kids',
    subcategory: 'Toddlers',
    gender: 'kids',
    regularPrice: 1999,
    salePrice: 1599,
    images: [
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
    ],
    colors: ['Soft Mint', 'Butter Yellow'],
    sizes: ['1-2Y', '2-3Y', '3-4Y'],
    variants: [
      { id: 'jg-008-sm-1', color: 'Soft Mint', colorHex: '#6ee7b7', size: '1-2Y', stock: 6, sku: 'JG-K08-SM-01' },
      { id: 'jg-008-sm-2', color: 'Soft Mint', colorHex: '#6ee7b7', size: '2-3Y', stock: 4, sku: 'JG-K08-SM-02' },
      { id: 'jg-008-by-2', color: 'Butter Yellow', colorHex: '#fde047', size: '2-3Y', stock: 5, sku: 'JG-K08-BY-02' },
      { id: 'jg-008-by-3', color: 'Butter Yellow', colorHex: '#fde047', size: '3-4Y', stock: 3, sku: 'JG-K08-BY-03' },
    ],
    fabric: '100% Organic Combed Cotton',
    careInstructions: 'Machine wash 40°C. Tumble dry low.',
    isNewArrival: false,
    isFeatured: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 14,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Jahan Grments',
  tagline: 'Timeless Elegance, Everyday Comfort',
  taglineUrdu: 'روایت اور جدید انداز کا حسین سنگم',
  whatsappNumber: '03001234567',
  supportPhone: '042-35789000',
  supportEmail: 'contact@jahangarments.pk',
  deliveryFeeLahore: 250,
  lahoreDeliveryFee: 250,
  freeDeliveryThreshold: 5000,
  lowStockThreshold: 4,
  announcement: '🚚 Express Lahore Delivery via InDrive Rider | Cash on Delivery (COD) on All Orders!',
  announcementUrdu: '🚚 پورے لاہور میں فوری ان ڈرائیو رائیڈر ڈلیوری | تمام آرڈرز پر کیش آن ڈلیوری کی سہولت!',
  storeAddress: 'Main Boulevard, Gulberg III, Lahore, Punjab, Pakistan',
};

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-01',
    title: 'Festive & Summer Collection 2026',
    titleUrdu: 'فیسٹیو و سمر کلیکشن 2026',
    subtitle: 'Exquisite Eastern & Western attire tailored for Men, Women, Boys, Girls & Kids.',
    subtitleUrdu: 'مردوں، خواتین اور بچوں کے لیے اعلیٰ معیار کے روایتی اور جدید ملبوسات۔',
    ctaText: 'Explore Catalog',
    ctaLink: '/catalog',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&auto=format&fit=crop&q=80',
    isActive: true,
    order: 1,
  },
  {
    id: 'banner-02',
    title: 'Fast InDrive Delivery in Lahore',
    titleUrdu: 'لاہور میں فوری ان ڈرائیو ہوم ڈلیوری',
    subtitle: 'From Gulberg to DHA and Bahria Town, receive your clothing directly via verified riders. Pay COD.',
    subtitleUrdu: 'گلبرگ، ڈی ایچ اے، جوہر ٹاؤن اور بحریہ ٹاؤن سمیت تمام لاہور میں نقد ادائیگی کی سہولت۔',
    ctaText: 'Shop New Arrivals',
    ctaLink: '/catalog?filter=new',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    isActive: true,
    order: 2,
  },
];

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  const seedTask = (async () => {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      if (!productsSnap.empty) {
        return false; // already seeded
      }

      console.log('Seeding initial Jahan Grments store data...');

      // Seed Settings
      await setDoc(doc(db, 'settings', 'store'), INITIAL_SETTINGS).catch(() => {});

      // Seed Categories
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
      }

      // Seed Banners
      for (const banner of INITIAL_BANNERS) {
        await setDoc(doc(db, 'banners', banner.id), banner).catch(() => {});
      }

      // Seed Products
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod).catch(() => {});
      }

      console.log('Jahan Grments seed completed successfully.');
      return true;
    } catch (error) {
      console.warn('Database seeding notice (using memory fallback if offline):', error);
      return false;
    }
  })();

  const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500));
  return Promise.race([seedTask, timeoutPromise]);
}
