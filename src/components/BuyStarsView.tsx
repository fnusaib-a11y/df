/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Sparkles, Smartphone, Check, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { dbService, STAR_PACKAGES } from '../services/db';
import { StarPackage, UserProfile } from '../types';

interface BuyStarsViewProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function BuyStarsView({ onBack, onSuccess }: BuyStarsViewProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [selectedPkg, setSelectedPkg] = React.useState<StarPackage | null>(null);
  
  // Checkout Modal State
  const [checkoutMethod, setCheckoutMethod] = React.useState<'bKash' | 'Nagad' | 'Rocket' | null>(null);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    setProfile(dbService.getCurrentUser());
  }, []);

  const handleSelectPackage = (pkg: StarPackage) => {
    setSelectedPkg(pkg);
    setPhoneNumber(profile?.phone || '');
  };

  const handleStartPayment = (method: 'bKash' | 'Nagad' | 'Rocket') => {
    if (!phoneNumber) {
      alert('Please enter your bKash/Nagad billing phone number.');
      return;
    }
    setCheckoutMethod(method);
    setOtpSent(false);
    setIsProcessing(true);

    // Simulate OTP transport
    setTimeout(() => {
      setIsProcessing(false);
      setOtpSent(true);
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      alert('Please enter a valid OTP verification code.');
      return;
    }
    setOtpSent(true); // move to Pin screen
  };

  const handleFinalCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      alert('Please enter your valid transaction PIN.');
      return;
    }

    if (!selectedPkg) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      // Buy operation inside DB
      dbService.buyStars(selectedPkg.id);
      setIsSuccess(true);
    }, 2000);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setCheckoutMethod(null);
    setSelectedPkg(null);
    setOtpSent(false);
    setOtpCode('');
    setPin('');
    onSuccess?.();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16 relative">
      
      {/* Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
        </button>
        <Sparkles className="w-5 h-5 text-amber-500 mr-1.5" />
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Buy Virtual Stars</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Banner Alert description */}
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
            Use stars to unlock exclusive photos from your favorite creators, send them direct star tips in chat, and enjoy premium content! 🌟
          </p>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-200/60 mt-1">
            1 Star = 1.00 BDT. A 20% commission is deducted during creator cash-outs.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Select a Star Package</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {STAR_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`text-left p-4 rounded-[22px] border-2 transition-all cursor-pointer relative flex flex-col justify-between h-36 ${
                  selectedPkg?.id === pkg.id
                    ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-955/20 shadow-lg shadow-amber-500/5'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                {pkg.badge && (
                  <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white font-black text-[8px] px-2 py-0.5 rounded-full select-none">
                    {pkg.badge}
                  </span>
                )}

                <div className="mt-1">
                  <span className="text-2xl font-black font-mono block text-amber-600 dark:text-amber-400">
                    ⭐ {pkg.starsCount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Stars Pack</span>
                </div>

                <div className="pt-2 border-t border-dashed border-neutral-100 dark:border-neutral-800 w-full flex justify-between items-center text-xs font-black text-slate-800 dark:text-white">
                  <span>৳ {pkg.priceBDT} BDT</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${selectedPkg?.id === pkg.id ? 'bg-amber-500 border-amber-500 text-white' : 'border-neutral-350'}`}>
                    {selectedPkg?.id === pkg.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Package Details & Checkout Input Form */}
        {selectedPkg && (
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-[24px] border border-neutral-250 dark:border-neutral-800 space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Payment Gateway</h3>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-850">
                <span className="text-[10px] text-zinc-400 font-bold block">Selected Stars</span>
                <span className="text-base font-extrabold text-amber-600 block mt-0.5 font-mono">⭐ {selectedPkg.starsCount}</span>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-850">
                <span className="text-[10px] text-zinc-400 font-bold block">Total Payable</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-zinc-200 block mt-0.5 font-mono">৳ {selectedPkg.priceBDT} BDT</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase block pl-1">Your Billing Mobile Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +88017XXXXXXXX"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs block text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase block text-center select-none">Payment Gateway Partners</span>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleStartPayment('bKash')}
                  className="bg-[#D12053] text-white hover:opacity-90 py-2.5 rounded-xl font-bold text-center text-xs active:scale-95 transition"
                >
                  bKash 🍒
                </button>
                <button
                  type="button"
                  onClick={() => handleStartPayment('Nagad')}
                  className="bg-[#EC5B24] text-white hover:opacity-90 py-2.5 rounded-xl font-bold text-center text-xs active:scale-95 transition"
                >
                  Nagad 🍊
                </button>
                <button
                  type="button"
                  onClick={() => handleStartPayment('Rocket')}
                  className="bg-[#8C3494] text-white hover:opacity-90 py-2.5 rounded-xl font-bold text-center text-xs active:scale-95 transition"
                >
                  Rocket 🍇
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Checkout Screen Overlay (Simulated Payment Dialog) */}
      {checkoutMethod && !isSuccess && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-t-[32px] w-full max-h-[85%] overflow-y-auto p-6 space-y-5 animate-slideUp shadow-2xl border-t border-neutral-200">
            
            {/* Payment Header */}
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${
                  checkoutMethod === 'bKash' ? 'bg-[#D12053]' : checkoutMethod === 'Nagad' ? 'bg-[#EC5B24]' : 'bg-[#8C3494]'
                }`}>
                  {checkoutMethod[0]}
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{checkoutMethod} Gateway Payment</h3>
                  <p className="text-[10px] text-neutral-400">Dept.file Billing Partner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutMethod(null)}
                className="text-neutral-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                Cancel ✕
              </button>
            </div>

            {isProcessing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-bold animate-pulse text-center">Establishing secure gateway connection...</p>
              </div>
            ) : !otpSent ? (
              /* OTP Simulation Form */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-blue-50/50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                  <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0" />
                  <p>An OTP verification code has been simulated and sent to your <b>{phoneNumber}</b> number. Enter the code below.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase">6-digit OTP Code</label>
                  <input
                    type="number"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs tracking-widest font-mono text-center font-bold text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full text-white font-black py-3 rounded-xl hover:opacity-90 active:scale-98 transition ${
                    checkoutMethod === 'bKash' ? 'bg-[#D12053]' : checkoutMethod === 'Nagad' ? 'bg-[#EC5B24]' : 'bg-[#8C3494]'
                  }`}
                >
                  Verify Code 🔐
                </button>
              </form>
            ) : (
              /* PIN Entry form final */
              <form onSubmit={handleFinalCheck} className="space-y-4">
                <div className="p-3.5 bg-neutral-50 dark:bg-zinc-950 rounded-xl flex justify-between items-center border border-neutral-200 border-neutral-250 dark:border-neutral-800 text-slate-850 dark:text-neutral-200">
                  <span className="text-xs text-slate-400 font-bold">Payment Amount</span>
                  <span className="text-sm font-extrabold font-mono">৳ {selectedPkg?.priceBDT} BDT</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase">Your Payment Wallet PIN</label>
                  <input
                    type="password"
                    maxLength={5}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs text-center tracking-[12px] font-bold text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full text-white font-black py-3 rounded-xl hover:opacity-90 active:scale-98 transition ${
                    checkoutMethod === 'bKash' ? 'bg-[#D12053]' : checkoutMethod === 'Nagad' ? 'bg-[#EC5B24]' : 'bg-[#8C3494]'
                  }`}
                >
                  Confirm Payment 💰
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Magnificent Success Screen overlay */}
      {isSuccess && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-950 z-50 p-6 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 lg:w-20 lg:h-20 rounded-full flex items-center justify-center shadow-lg animate-bounce select-none">
            <CheckCircle2 className="w-12 h-12 text-amber-600 fill-amber-100" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-amber-600 block">Top-up Successful! 🎉</h2>
            <p className="text-xs text-zinc-400 leading-relaxed px-6">
              Your wallet has been successfully credited with <b>{selectedPkg?.starsCount} Stars</b>. You can now unlock premium creator content and tip creators.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900 border border-neutral-100 dark:border-neutral-800 p-4 rounded-2xl w-full max-w-sm space-y-2.5 max-h-40 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-zinc-400">Transaction Type</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">Star Top-up</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Method</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">{checkoutMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Amount (BDT)</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200 font-mono">৳{selectedPkg?.priceBDT} BDT</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-neutral-200/60 pt-2 font-semibold">
              <span className="text-zinc-400">Balance Update</span>
              <span className="font-bold text-amber-600 font-mono">+ {selectedPkg?.starsCount} Stars</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 font-black text-white py-3.5 rounded-full transition-transform hover:scale-103 cursor-pointer"
          >
            Return to Wallet
          </button>
        </div>
      )}

    </div>
  );
}
