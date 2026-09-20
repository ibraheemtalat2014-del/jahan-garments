import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Truck,
  ShieldCheck,
  Clock,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

export const AboutUsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-left space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-amber-400">
          Our Heritage
        </span>
        <h1 className="font-serif-brand text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
          About Jahan Grments
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
          Rooted in Lahore, crafting modern and timeless attire for every member of the family.
        </p>
      </div>

      <div className="rounded-3xl overflow-hidden aspect-[21/9] bg-zinc-100">
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&auto=format&fit=crop&q=80"
          alt="Jahan Grments Workshop"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <p>
          Founded in the cultural heart of Pakistan, <strong>Jahan Grments</strong> was created with a clear ambition: to bring bespoke-grade fabric, meticulous stitching, and contemporary design to families across Lahore at prices that represent genuine value.
        </p>
        <p>
          We design collections spanning <strong>Men, Women, Boys, Girls, and Kids</strong>. From pure Egyptian combed cottons and wash-and-wear shalwar kameez for festive occasions to breathable daily lawn kurtis and gentle toddler sets, our workshops focus on longevity, fit, and elegance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">Pure Materials</h3>
            <p className="text-xs text-zinc-500">
              Only authentic cotton, linen, silk weaves, and pre-shrunk wash & wear blends.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">InDrive Local Delivery</h3>
            <p className="text-xs text-zinc-500">
              Dispatched straight from our Gulberg store to every town in Lahore.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">Cash on Delivery</h3>
            <p className="text-xs text-zinc-500">
              Zero prepayment risks. Pay cash directly to the rider upon arrival.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do you deliver outside of Lahore?',
      a: 'Currently, Jahan Grments specializes exclusively in Lahore to provide the fastest fulfillment via verified InDrive riders and hassle-free Cash on Delivery. We cover all towns including Gulberg, DHA, Cantt, Johar Town, Model Town, Bahria Town, and surrounding areas.',
    },
    {
      q: 'How does the Lahore InDrive delivery work?',
      a: 'Once your order is confirmed, our warehouse team hand-packs your garments. When ready, we dispatch an InDrive rider directly to your address. The rider will call your provided Pakistani phone number when nearby.',
    },
    {
      q: 'Can I pay via Bank Transfer, EasyPaisa, or JazzCash?',
      a: 'All orders are currently processed with Cash on Delivery (COD) for ultimate transparency and ease. You pay the exact grand total shown on your confirmation invoice in cash to the rider.',
    },
    {
      q: 'How do I choose the correct size for Pakistani attire?',
      a: 'Our Men and Women garments follow standard Pakistani tailored sizing (Small, Medium, Large, XL, XXL) with relaxed ease. Boys and Girls outfits are categorized by standard age groups (e.g., 2-3Y, 4-5Y, 6-7Y, 8-9Y). If you need exact inch measurements, contact us directly on WhatsApp.',
    },
    {
      q: 'What is your exchange and return policy?',
      a: 'You can exchange any unwashed, tag-intact clothing item within 7 days of delivery. Contact our Lahore support on WhatsApp with your Order Reference number (e.g. JG-123456) to arrange an exchange.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-left space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-amber-400">
          Support
        </span>
        <h1 className="font-serif-brand text-3xl font-bold text-zinc-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-zinc-500">
          Everything you need to know about shopping, sizing, and Lahore InDrive delivery
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full p-4 sm:p-5 text-left font-bold text-sm text-zinc-900 dark:text-white flex items-center justify-between gap-4"
            >
              <span>{faq.q}</span>
              <span className="text-amber-900 dark:text-amber-400 text-lg">
                {openIdx === idx ? '−' : '+'}
              </span>
            </button>
            {openIdx === idx && (
              <div className="p-4 sm:p-5 pt-0 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    showToast('Your message has been sent to our Lahore team!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-left space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-amber-400">
          Connect With Us
        </span>
        <h1 className="font-serif-brand text-3xl font-bold text-zinc-900 dark:text-white">
          Contact Lahore Store
        </h1>
        <p className="text-xs text-zinc-500">
          Have an urgent sizing question or need an InDrive delivery update?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Store Details</h3>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-900 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-zinc-900 dark:text-white">Main Workshop & Showroom</strong>
                <span className="text-zinc-500">Main Boulevard, Gulberg III, Lahore, Punjab, Pakistan</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-amber-900 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-zinc-900 dark:text-white">Call Support</strong>
                <span className="text-zinc-500">0300-1234567 / (042) 3571-0000</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-amber-900 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-zinc-900 dark:text-white">Email Inquiries</strong>
                <span className="text-zinc-500">contact@jahangarments.pk</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp Directly</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Send Us a Message</h3>

          {sent ? (
            <div className="p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Message Received!</p>
              <p className="text-[11px] text-zinc-500">
                Our representative will call or WhatsApp you shortly.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Your Query or Sizing Request
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need assistance with..."
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-amber-100 text-white dark:text-zinc-950 font-bold text-xs"
              >
                Submit Inquiry
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export const TermsPrivacyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-left space-y-6 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
      <h1 className="font-serif-brand text-2xl font-bold text-zinc-900 dark:text-white">
        Terms of Service & Privacy Policy
      </h1>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">1. Scope of Service (Lahore Only)</h2>
        <p>
          Jahan Grments exclusively offers garment delivery within the metropolitan area of Lahore, Punjab. All deliveries are coordinated via verified third-party motorbike riders (InDrive dispatch).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">2. Cash on Delivery (COD) Commitment</h2>
        <p>
          Customers are required to ensure their designated delivery recipient is present with the exact payable amount at the provided address upon arrival of the rider. Refusal of legitimate orders damages rider operations and may lead to address suspension.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">3. Customer Privacy & Phone Number Use</h2>
        <p>
          Your personal data (full name, phone number, Lahore delivery address) is used solely to coordinate parcel dispatch and verify delivery integrity. We do not sell or lease customer contact lists to external marketing agencies.
        </p>
      </section>
    </div>
  );
};
