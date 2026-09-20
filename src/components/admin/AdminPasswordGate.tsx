import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminPasswordGateProps {
  onUnlock: () => void;
  onBackToStore: () => void;
}

const REQUIRED_ADMIN_PASS = 'store.of.jahan';

export const AdminPasswordGate: React.FC<AdminPasswordGateProps> = ({
  onUnlock,
  onBackToStore,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const entered = password.trim();
    if (entered === REQUIRED_ADMIN_PASS) {
      try {
        localStorage.setItem('jg_admin_unlocked', 'true');
        sessionStorage.setItem('jg_admin_unlocked', 'true');
      } catch (e) {
        console.warn('Storage notice:', e);
      }
      setIsSubmitting(false);
      onUnlock();
    } else {
      setIsSubmitting(false);
      setError('Incorrect admin password. Access denied to administrative portal.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Customer Storefront</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Lahore Admin Security</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-md text-left">
          {/* Brand & Icon */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Admin Portal Gate
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Enter the master administrator passcode to manage garments, Lahore dispatch, and store settings.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Administrator Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter admin password..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          {/* Bottom Security Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500">
              Jahan Garments Lahore • Secure Operational Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-4xl w-full mx-auto text-center text-[11px] text-zinc-600">
        Direct URLs: Customer View (<span className="font-mono text-zinc-500">?view=store</span>) • Admin View (<span className="font-mono text-zinc-500">?view=admin</span>)
      </div>
    </div>
  );
};
