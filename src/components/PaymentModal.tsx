import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Order } from '../types';
import { generateWhatsAppMessage, getWhatsAppBuyUrl, redirectToWhatsApp, ADMIN_WHATSAPP_NUMBER, ADMIN_NAME } from '../utils/whatsapp';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  PlayCircle, 
  CreditCard, 
  Smartphone, 
  Sparkles, 
  AlertCircle, 
  Loader2,
  MessageCircle,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const { 
    checkoutItem, 
    setCheckoutItem, 
    user, 
    setAuthModalOpen, 
    setAuthModalTab, 
    refreshUser, 
    addToast, 
    triggerSuccessCelebration,
    startDownload,
    setActivePlayer,
    settings
  } = useApp();

  const [selectedGateway, setSelectedGateway] = useState<'WhatsApp' | 'bKash' | 'Nagad' | 'Rocket' | 'SSLCommerz' | 'Stripe' | 'Sandbox'>('WhatsApp');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<{
    reference: string;
    instructions: string;
    merchantNumber?: string;
    paymentUrl?: string;
  } | null>(null);

  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showManualVerifyForm, setShowManualVerifyForm] = useState(false);

  const adminName = settings.adminName || ADMIN_NAME;
  const adminWhatsApp = settings.adminWhatsApp || ADMIN_WHATSAPP_NUMBER;

  // If user is not logged in, prompt to log in first
  useEffect(() => {
    if (checkoutItem && !user) {
      setCheckoutItem(null);
      setAuthModalTab('login');
      setAuthModalOpen(true);
      addToast({
        type: 'warning',
        title: 'Login Required',
        message: 'Please login or create an account to purchase and unlock content.'
      });
    }
  }, [checkoutItem, user]);

  // Create order when modal opens or gateway changes
  const initOrder = async (gateway: 'WhatsApp' | 'bKash' | 'Nagad' | 'Rocket' | 'SSLCommerz' | 'Stripe' | 'Sandbox') => {
    if (!checkoutItem || !user) return;
    setLoading(true);
    try {
      const { order } = await api.createOrder({
        itemId: checkoutItem.item.id,
        itemType: checkoutItem.type,
        paymentGateway: gateway
      });
      setCurrentOrder(order);

      const instructions = await api.initiatePayment(order.id, gateway);
      setPaymentInstructions(instructions);
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating order:', err);
      addToast({
        type: 'error',
        title: 'Order Initialization Failed',
        message: err.message || 'Could not initialize order.'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkoutItem && user) {
      setPaymentSuccess(false);
      setTrxId('');
      setSenderNumber('');
      setShowManualVerifyForm(false);
      initOrder(selectedGateway);
    }
  }, [checkoutItem]);

  const handleGatewayChange = (gw: 'WhatsApp' | 'bKash' | 'Nagad' | 'Rocket' | 'SSLCommerz' | 'Stripe' | 'Sandbox') => {
    setSelectedGateway(gw);
    initOrder(gw);
  };

  const handleOpenWhatsApp = () => {
    if (!checkoutItem) return;
    const url = getWhatsAppBuyUrl({
      item: checkoutItem.item,
      type: checkoutItem.type,
      user,
      orderId: currentOrder?.id,
      phone: adminWhatsApp,
      adminName
    });
    redirectToWhatsApp(url);
    addToast({
      type: 'info',
      title: 'Opening WhatsApp...',
      message: `Sending pre-written message to ${adminName} (${adminWhatsApp})`
    });
  };

  const handleCopyMessage = () => {
    if (!checkoutItem) return;
    const msg = generateWhatsAppMessage({
      item: checkoutItem.item,
      type: checkoutItem.type,
      user,
      orderId: currentOrder?.id
    });
    navigator.clipboard.writeText(msg);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
    addToast({
      type: 'success',
      title: 'Message Copied!',
      message: 'Paste this message directly to Tanvir on WhatsApp.'
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;

    if (selectedGateway !== 'Sandbox' && (!trxId || trxId.trim().length < 4)) {
      addToast({
        type: 'error',
        title: 'Transaction ID Required',
        message: 'Please enter the Transaction ID (TrxID) from your payment confirmation SMS.'
      });
      return;
    }

    setVerifying(true);
    try {
      const res = await api.verifyPayment(currentOrder.id, {
        transactionId: trxId.trim() || `TEST-TRX-${Date.now()}`,
        senderNumber: senderNumber.trim() || '01700000000',
        gateway: selectedGateway
      });

      if (res.success) {
        setPaymentSuccess(true);
        triggerSuccessCelebration();
        await refreshUser();
        addToast({
          type: 'success',
          title: 'Payment Verified Successfully!',
          message: res.message
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Server could not verify transaction. Please check TrxID.'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!checkoutItem || !user) return null;

  const item = checkoutItem.item;
  const whatsAppAutoMsg = generateWhatsAppMessage({
    item,
    type: checkoutItem.type,
    user,
    orderId: currentOrder?.id
  });

  const copyToClipboard = (text: string, type: 'merchant' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'merchant') {
      setCopiedMerchant(true);
      setTimeout(() => setCopiedMerchant(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const gateways = [
    { id: 'WhatsApp', name: 'WhatsApp Direct', color: 'from-emerald-600 to-green-600', badge: '⚡ Instant Chat & Buy' },
    { id: 'bKash', name: 'bKash', color: 'from-pink-600 to-rose-600', badge: '🇧🇩 01329179522' },
    { id: 'Nagad', name: 'Nagad', color: 'from-orange-600 to-amber-600', badge: '🇧🇩 01329179522' },
    { id: 'Rocket', name: 'Rocket', color: 'from-purple-600 to-indigo-600', badge: '🇧🇩 01329179522' },
    { id: 'SSLCommerz', name: 'Cards & Banking', color: 'from-blue-600 to-cyan-600', badge: 'SSLCommerz' },
    { id: 'Sandbox', name: 'Test Sandbox', color: 'from-slate-700 to-slate-800', badge: 'Instant Sim' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={() => !verifying && setCheckoutItem(null)} 
      />

      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Purchase & Direct WhatsApp Order</h2>
              <p className="text-[10px] text-slate-400">Direct contact with Admin {adminName} ({adminWhatsApp})</p>
            </div>
          </div>

          <button
            onClick={() => !verifying && setCheckoutItem(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Success State */}
          {paymentSuccess ? (
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">Payment Confirmed & Unlocked!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Thank you, <strong>{user.name}</strong>. Your purchase of <strong>{item.title}</strong> has been successfully verified on the server.
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono text-slate-200 font-bold">{currentOrder?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{trxId || 'VERIFIED-SERVER-KEY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-white font-mono">{item.price} {item.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">100% UNLOCKED & ACTIVE</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {checkoutItem.type === 'apk' ? (
                  <button
                    onClick={() => {
                      setCheckoutItem(null);
                      startDownload(item as any);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK File Now</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCheckoutItem(null);
                      setActivePlayer({ courseId: item.id });
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Open Video Classroom</span>
                  </button>
                )}

                <button
                  onClick={() => setCheckoutItem(null)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Summary Card */}
              <div className="flex items-center gap-3.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-16 h-12 rounded-xl object-cover border border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                    {checkoutItem.type === 'apk' ? 'APK Package' : 'Video Course'}
                  </span>
                  <h3 className="text-xs font-bold text-white truncate mt-0.5">{item.title}</h3>
                  <p className="text-[11px] text-slate-400">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-amber-400 font-mono">
                    {item.price} {item.currency}
                  </p>
                  <p className="text-[10px] text-slate-500">Lifetime Access</p>
                </div>
              </div>

              {/* Gateway Selection Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Choose How You Want to Pay & Order</label>
                  <span className="text-[10px] text-emerald-400 font-medium">WhatsApp Recommended</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {gateways.map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => handleGatewayChange(gw.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        selectedGateway === gw.id
                          ? gw.id === 'WhatsApp'
                            ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                            : 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                          : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <span className={`text-xs font-bold ${selectedGateway === gw.id && gw.id === 'WhatsApp' ? 'text-emerald-300' : 'text-slate-100'}`}>
                        {gw.name}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1">{gw.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SPECIFIC VIEW FOR WHATSAPP DIRECT */}
              {selectedGateway === 'WhatsApp' ? (
                <div className="bg-gradient-to-b from-emerald-950/40 to-slate-950/80 p-5 rounded-2xl border border-emerald-500/30 space-y-4 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 shrink-0">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">Direct WhatsApp Order</h4>
                        <p className="text-[11px] text-emerald-400 font-medium">Chat directly with {adminName}: <span className="font-mono">{adminWhatsApp}</span></p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Fastest
                    </span>
                  </div>

                  {/* Pre-written Auto Message Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-bold">Auto-Written Message Preview:</span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedMsg ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 font-sans text-xs whitespace-pre-line leading-relaxed selection:bg-emerald-500/30">
                      {whatsAppAutoMsg}
                    </div>
                  </div>

                  {/* Primary WhatsApp Action Button */}
                  <button
                    id="btn-open-whatsapp-order"
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>Send Message to {adminName} on WhatsApp</span>
                    <ExternalLink className="w-4 h-4 opacity-75" />
                  </button>

                  {/* Payment numbers reminder */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">bKash / Nagad / Rocket:</span>
                      <span className="font-mono text-amber-400 font-bold">01329179522</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Admin Contact:</span>
                      <span className="text-slate-200 font-medium">Tanvir (+8801329179522)</span>
                    </div>
                  </div>

                  {/* Toggle manual verification form */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowManualVerifyForm(!showManualVerifyForm)}
                      className="text-[11px] text-slate-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      {showManualVerifyForm ? '▲ Hide manual TrxID verification' : '▼ Already paid and have a Transaction ID (TrxID)? Click here to verify instantly'}
                    </button>
                  </div>
                </div>
              ) : (
                /* OTHER GATEWAY INSTRUCTIONS */
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Payment Instructions ({selectedGateway})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                      Order Ref: {currentOrder?.id.substring(0, 10)}
                    </span>
                  </div>

                  {paymentInstructions?.merchantNumber && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400">Merchant Account Number ({adminName}):</p>
                        <p className="text-xs font-bold text-amber-400 font-mono">{paymentInstructions.merchantNumber}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(paymentInstructions.merchantNumber!, 'merchant')}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                      >
                        {copiedMerchant ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedMerchant ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <div className="whitespace-pre-line text-slate-300 leading-relaxed text-[11px] bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 font-sans">
                    {paymentInstructions?.instructions || 'Loading gateway instructions...'}
                  </div>

                  {/* Also show quick WhatsApp contact link */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>Need help paying?</span>
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Chat with {adminName} on WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Form (Always visible for non-WhatsApp gateways, or toggleable for WhatsApp) */}
              {(selectedGateway !== 'WhatsApp' || showManualVerifyForm) && (
                <form onSubmit={handleVerify} className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Transaction ID (TrxID) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder={selectedGateway === 'Sandbox' ? 'e.g., TEST9981' : 'e.g., 9J82KD819'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Sender Mobile Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="e.g., 01329179522"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Autofill for Sandbox */}
                  {selectedGateway === 'Sandbox' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrxId(`SANDBOX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
                        setSenderNumber('01700-SANDBOX');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono cursor-pointer"
                    >
                      ⚡ Auto-fill Test Sandbox TrxID
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={verifying || loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying on Server Ledger...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Payment & Unlock Content</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

