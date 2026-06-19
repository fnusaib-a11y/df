/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  UploadCloud, 
  Send, 
  ShieldCheck, 
  Coins, 
  Award, 
  Users, 
  CreditCard, 
  Sparkles,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface VerifyRequestViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function VerifyRequestView({ onBack, onSuccess }: VerifyRequestViewProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = React.useState<'paid' | 'refer' | 'kyc'>('paid');
  
  // Custom settings loaded from db service live config
  const [verSettings, setVerSettings] = React.useState({
    isEnabled: true,
    verificationCostStars: 100,
    verificationCostBDT: 150,
    isAutoReferEnabled: true,
    minReferralsForAutoVerify: 30
  });

  // KYC state variables (for Tab 3)
  const [realName, setRealName] = React.useState('');
  const [nid, setNid] = React.useState('');
  const [photoUploaded, setPhotoUploaded] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Paid payment simulation modal state
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [paymentPhone, setPaymentPhone] = React.useState('');
  const [transactionIdInput, setTransactionIdInput] = React.useState('');
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

  React.useEffect(() => {
    setProfile(dbService.getCurrentUser());
    setVerSettings(dbService.getVerificationSettings());
  }, []);

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName.trim() || !nid.trim() || !photoUploaded) {
      alert('All fields are required!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Submits to DB kyc system
      dbService.submitKyc(realName, nid);
      setIsSubmitting(false);
      alert('Your Creator KYC has been successfully submitted and is pending review. The administrators will verify your document and grant a verification badge soon. 🛡️');
      onSuccess();
    }, 1500);
  };

  const handlePayWithStars = () => {
    if (!profile) return;
    
    // Confirm purchase
    const confirmBuy = window.confirm(`Are you sure you want to purchase verification using ${verSettings.verificationCostStars} stars?`);
    if (!confirmBuy) return;

    const result = dbService.purchaseVerification(profile.id, 'stars');
    if (result.success) {
      setProfile(dbService.getCurrentUser());
      alert(`Congratulations! You have received your Verified badge! 🌟✔️`);
      onSuccess();
    } else {
      alert(result.error || 'Verification could not be completed.');
    }
  };

  const handlePayWithMoneyClick = () => {
    if (profile?.phone) {
      setPaymentPhone(profile.phone);
    }
    setShowPaymentModal(true);
  };

  const handleConfirmBDTVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentPhone.trim() || paymentPhone.length < 11) {
      alert('Please provide a valid 11-digit mobile banking number!');
      return;
    }
    setIsProcessingPayment(true);

    setTimeout(() => {
      if (!profile) return;
      const result = dbService.purchaseVerification(profile.id, 'money');
      if (result.success) {
        setIsProcessingPayment(false);
        setShowPaymentModal(false);
        setProfile(dbService.getCurrentUser());
        alert(`Payment verified successfully! Congratulations, you are now Blue Verified! 🌟✔️`);
        onSuccess();
      } else {
        setIsProcessingPayment(false);
        alert(result.error || 'Payment verification could not be completed.');
      }
    }, 2000);
  };

  const handleClaimReferralBadge = () => {
    if (!profile) return;
    if ((profile.referralsCount || 0) >= verSettings.minReferralsForAutoVerify) {
      const updatedUserProfile = { ...profile, isVerified: true };
      dbService.updateUserRecord(updatedUserProfile);
      dbService.addNotification(
        profile.id, 
        'user_admin', 
        'StarConnect Team', 
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
        'kyc_update', 
        `Congratulations! Your referral milestone check is complete, and your account has been automatically verified! 🌟✔️`
      );
      setProfile(dbService.getCurrentUser());
      alert(`Congratulations! Your milestone of ${verSettings.minReferralsForAutoVerify} referrals has been verified, and your account is now automatically verified! 🌟🎖️`);
      onSuccess();
    } else {
      alert(`Sorry! More referrals are required. You currently have ${profile.referralsCount || 0} referrals.`);
    }
  };

  if (!profile) return null;

  const currentReferrals = profile.referralsCount || 0;
  const targetReferrals = verSettings.minReferralsForAutoVerify;
  const referralPercent = Math.min(100, Math.round((currentReferrals / targetReferrals) * 100));

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-955 overflow-y-auto pb-16">
      
      {/* Top Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-150 dark:hover:bg-zinc-800 mr-2 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
        </button>
        <ShieldCheck className="w-5 h-5 text-indigo-655 mr-1.5 shrink-0" />
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Verify & Blue Badge</h1>
      </div>

      <div className="p-4 space-y-4 text-left">
        {/* Verification banner showing verification state */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-905 text-white p-5 rounded-[24px] shadow-lg relative overflow-hidden flex items-center gap-4 select-none">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
          
          <div className="bg-indigo-600/30 p-3.5 rounded-2xl border border-white/10 shrink-0">
            <Award className="w-10 h-10 text-indigo-400 fill-indigo-450/20" />
          </div>
          
          <div className="space-y-1 z-10 flex-1 text-left">
            <h2 className="text-sm font-black text-white flex items-center gap-1">
              <span>Account Verification</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            </h2>
            <p className="text-[10px] text-zinc-300 leading-normal">
              Amplify your influence by achieving Blue Verified status. Your posts will feature an exclusive blue ring and trusted verification badge!
            </p>
            
            <div className="pt-2">
              {profile.isVerified ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-505/10 text-emerald-400" />
                  <span>You are a Verified Member!</span>
                </span>
              ) : (
                <span className="inline-flex items-center bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black border border-amber-500/30">
                  Not Verified (Verification Available)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Buttons Container */}
        <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-sm">
          <button
            onClick={() => setActiveTab('paid')}
            className={`py-2 rounded-xl text-[10px] font-black tracking-tight text-center flex flex-col justify-center items-center gap-1 cursor-pointer transition ${
              activeTab === 'paid'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-100 dark:hover:bg-neutral-80s'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Buy with Cash/Stars</span>
          </button>

          <button
            onClick={() => setActiveTab('refer')}
            className={`py-2 rounded-xl text-[10px] font-black tracking-tight text-center flex flex-col justify-center items-center gap-1 cursor-pointer transition ${
              activeTab === 'refer'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-100 dark:hover:bg-neutral-805'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>30 Referrals Milestone</span>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`py-2 rounded-xl text-[10px] font-black tracking-tight text-center flex flex-col justify-center items-center gap-1 cursor-pointer transition ${
              activeTab === 'kyc'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Submit Free KYC</span>
          </button>
        </div>

        {/* TAB 1: PAID VERIFICATION */}
        {activeTab === 'paid' && (
          <div className="space-y-4 animate-fadeIn">
            {profile.isVerified ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-8 rounded-[24px] text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-555 mx-auto fill-emerald-500/10" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Your profile is fully verified!</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  An exclusive blue checkmark has been displayed across your name and posts. Thank you for being a trusted part of our platform!
                </p>
              </div>
            ) : !verSettings.isEnabled ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 p-6 rounded-[24px] text-center space-y-2">
                <p className="text-xs text-zinc-500 font-bold">The feature to buy a verification badge using stars or cash is currently turned off by administrators.</p>
                <p className="text-[10px] text-neutral-400">Please use the free Referral Milestone or KYC submission options instead!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-400 pl-1 font-bold uppercase tracking-widest block font-mono">Select an option below to purchase instant verification</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Star Redeem */}
                  <div className="bg-white dark:bg-neutral-905 border border-neutral-155 dark:border-neutral-805 rounded-[24px] p-5.5 space-y-4 flex flex-col justify-between shadow-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full">Option 1 (Star Backed)</span>
                        <Coins className="w-5 h-5 text-amber-500 animate-pulse fill-amber-500/10" />
                      </div>
                      <h4 className="text-base font-black text-slate-800 dark:text-white">{verSettings.verificationCostStars} Star Balance</h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-40q leading-normal font-semibold">
                        Instantly verify your account by redeeming stars directly from your balance.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-neutral-50 dark:border-neutral-800/40">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Your Current Balance :</span>
                        <span className="text-amber-505 font-mono">⭐ {profile.starBalance} Stars</span>
                      </div>
                      
                      <button
                        onClick={handlePayWithStars}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs active:scale-95 transition cursor-pointer select-none"
                      >
                        Verify with Stars
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Mobile Money BDT */}
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-[24px] p-5.5 space-y-4 flex flex-col justify-between shadow-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black bg-indigo-500/10 text-indigo-505 px-3 py-1 rounded-full">Option 2 (Mobile Payment)</span>
                        <CreditCard className="w-5 h-5 text-indigo-600 fill-indigo-500/10" />
                      </div>
                      <h4 className="text-base font-black text-slate-800 dark:text-white">৳ {verSettings.verificationCostBDT} BDT Payment</h4>
                      <p className="text-[10px] text-neutral-505 dark:text-neutral-400 leading-normal font-semibold">
                        Initiate automatic verification instantly using secure bKash, Nagad, or Rocket mobile banking services.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-neutral-50 dark:border-neutral-800/40">
                      <button
                        onClick={handlePayWithMoneyClick}
                        className="w-full py-3 rounded-xl bg-indigo-650 text-white font-black text-xs hover:bg-indigo-700 active:scale-95 transition cursor-pointer select-none"
                      >
                        Pay ৳{verSettings.verificationCostBDT} BDT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REFERRAL MILESTONE */}
        {activeTab === 'refer' && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-[24px] p-5.5 space-y-5 animate-fadeIn">
            {!verSettings.isAutoReferEnabled ? (
              <div className="text-center py-4 space-y-2">
                <Users className="w-12 h-12 text-zinc-300 mx-auto" />
                <p className="text-xs font-black text-zinc-500">The free verification milestone via referrals is currently disabled by administrators.</p>
              </div>
            ) : profile.isVerified ? (
              <div className="text-center space-y-3 py-4 select-none animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto fill-emerald-500/10" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Verification completed successfully!</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Based on your referral milestone accomplishment, your account is verified. Thank you!
                </p>
              </div>
            ) : (
              <div className="space-y-4 select-none text-left">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">Referral Milestone Tracker</span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
                  Help at least <strong>{verSettings.minReferralsForAutoVerify} members</strong> sign up using your referral code. Once completed, your account will be automatically verified for free!
                </p>

                {/* Progress bar info */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-4 border border-neutral-150 dark:border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-black select-none">
                    <span className="text-slate-808 dark:text-neutral-300">Verification Progress :</span>
                    <span className="text-indigo-650 font-mono">{currentReferrals} / {targetReferrals} members ({referralPercent}%)</span>
                  </div>

                  {/* Progress bar track */}
                  <div className="w-full bg-neutral-250 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${referralPercent}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-neutral-400 select-none">Refer {Math.max(0, targetReferrals - currentReferrals)} more members using your referral link to unlock the verification badge.</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/60 p-4.5 rounded-2xl flex items-center justify-between font-bold">
                  <div>
                    <span className="text-[10px] text-amber-700 uppercase font-black block">Your Referral Link & Code :</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-amber-100 tracking-wide mt-1 block select-text">{profile.referralCode || profile.username}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.referralCode || profile.username);
                      alert('Verification referral code copied to clipboard! Share it with others to earn referrals. 🌟');
                    }}
                    className="text-[10px] font-black text-indigo-600 bg-white border border-neutral-200 px-3 py-2 rounded-xl hover:bg-zinc-50 active:scale-95 transition cursor-pointer"
                  >
                    Copy Code
                  </button>
                </div>

                {/* Claim Button */}
                <button
                  type="button"
                  onClick={handleClaimReferralBadge}
                  disabled={currentReferrals < targetReferrals}
                  className="w-full py-3.5 bg-indigo-650 disabled:bg-neutral-250 select-none cursor-pointer hover:bg-indigo-700 active:scale-95 transition text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim Verification Badge ({currentReferrals >= targetReferrals ? 'Available' : 'Locked'})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGULAR KYC FORM */}
        {activeTab === 'kyc' && (
          <form onSubmit={handleKycSubmit} className="space-y-4 animate-fadeIn">
            
            {/* Verification banner description */}
            <div className="bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-150 dark:border-indigo-900/40 p-4.5 rounded-[24px] flex gap-3 select-none">
              <CheckCircle className="w-8 h-8 text-indigo-600 fill-indigo-100 shrink-0" />
              <div className="text-xs space-y-1 text-left">
                <span className="font-extrabold text-indigo-805 dark:text-indigo-300">Free Creator KYC Verification</span>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-semibold">
                  Submit your official identification document (NID or Passport) for manual administrator verification. This is a secure and free process.
                </p>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="bg-white dark:bg-neutral-900 rounded-[24px] p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase block pl-0.5">Full Legal Name (as shown on ID)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Mymun Islam"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase block pl-0.5">National ID Card (NID) or Passport Number</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 3274689102"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 block pl-0.5 uppercase">Upload Identity Document (Front Page Copy)</label>
                
                {photoUploaded ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900 text-center rounded-xl space-y-1 select-none">
                    <span className="text-xs font-semibold text-amber-600 font-bold block">Identity document uploaded successfully! 📥</span>
                    <p className="text-[10px] text-zinc-400">Click the submit button below to send your document for review.</p>
                    <button
                      type="button"
                      onClick={() => setPhotoUploaded(false)}
                      className="text-[10px] text-indigo-500 font-bold block mx-auto hover:underline mt-1 cursor-pointer"
                    >
                      Change image
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setPhotoUploaded(true)}
                    className="border-2 border-dashed border-indigo-200 bg-indigo-50/20 dark:bg-neutral-900 p-8 text-center rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer select-none hover:border-indigo-400 transition"
                  >
                    <UploadCloud className="w-8 h-8 text-indigo-505 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">Click here to attach a copy of your document</span>
                    <p className="text-[10px] text-neutral-400">PDF, JPG, or PNG format (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !nid.trim() || !realName.trim() || !photoUploaded}
              className="w-full bg-indigo-650 disabled:bg-neutral-300 hover:bg-indigo-700 text-white font-black text-xs py-3.5 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Verifying document security coding...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit KYC Verification</span>
                </>
              )}
            </button>

          </form>
        )}
      </div>

      {/* MOBILE BANKING SIMULATED PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-805 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-scaleUp text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-center">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-black text-slate-800 dark:text-white">Secure Mobile Payment Gateway</span>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-6 h-6 flex items-center justify-center font-bold text-slate-400 hover:text-slate-650 border border-neutral-200 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBDTVerification} className="p-5 space-y-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5 block font-mono">1. Choose Payment Method</span>
              
              <div className="grid grid-cols-3 gap-2">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bKash')}
                  className={`py-2 rounded-xl text-[11.5px] font-black border text-center transition cursor-pointer select-none ${
                    paymentMethod === 'bKash'
                      ? 'bg-pink-600 border-pink-600 text-white font-black shadow-sm'
                      : 'bg-white dark:bg-zinc-950 text-zinc-650 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  bKash
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Nagad')}
                  className={`py-2 rounded-xl text-[11.5px] font-black border text-center transition cursor-pointer select-none ${
                    paymentMethod === 'Nagad'
                      ? 'bg-orange-600 border-orange-655 text-white font-black shadow-sm'
                      : 'bg-white dark:bg-zinc-955 text-zinc-650 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  Nagad
                </button>

                {/* Rocket */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Rocket')}
                  className={`py-2 rounded-xl text-[11.5px] font-black border text-center transition cursor-pointer select-none ${
                    paymentMethod === 'Rocket'
                      ? 'bg-purple-650 border-purple-650 text-white font-black shadow-sm'
                      : 'bg-white dark:bg-zinc-950 text-zinc-650 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  Rocket
                </button>
              </div>

              {/* Enter Phone number info */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-zinc-400 pl-0.5">Your 11-Digit Mobile Wallet Number</label>
                <input
                  required
                  type="tel"
                  maxLength={11}
                  placeholder="E.g., 01XXXXXXXXX"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-neutral-250 dark:border-neutral-800 rounded-xl px-3.5 py-3 text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              {/* Simulated Instruction */}
              <div className="bg-pink-50/45 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-900/40 p-3.5 rounded-xl text-[9.5px]/relaxed text-pink-700 dark:text-pink-400 font-semibold text-left">
                Enter your phone number to complete simulated banking OTP check. Upon submitting, your Account Verification will unlock instantly. No information or PINs are stored.
              </div>

              {/* Total amount to pay display */}
              <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-100 dark:border-neutral-800 p-3.5 rounded-xl flex justify-between items-center text-xs font-black">
                <span className="text-slate-500">Total Amount to Pay :</span>
                <span className="text-slate-800 dark:text-white font-mono text-sm">৳{verSettings.verificationCostBDT} BDT</span>
              </div>

              <button
                type="submit"
                disabled={isProcessingPayment || paymentPhone.length < 11}
                className={`w-full py-3.5 rounded-xl text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 active:scale-95 ${
                  paymentMethod === 'bKash' ? 'bg-pink-650' : paymentMethod === 'Nagad' ? 'bg-orange-655' : 'bg-purple-650'
                }`}
              >
                {isProcessingPayment ? (
                  <span>Processing Secure Network PIN verification...</span>
                ) : (
                  <span>Confirm Payment</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
