import React, { useState, useMemo } from 'react';
import { Order, ApkItem, CourseItem } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  generateDeliveryNotificationMessage, 
  getWhatsAppDeliveryUrl, 
  redirectToWhatsApp,
  getCleanWhatsAppNumber,
  ADMIN_NAME 
} from '../../utils/whatsapp';
import { 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  Plus, 
  Send, 
  Copy, 
  ExternalLink, 
  Phone, 
  Mail, 
  Sparkles, 
  Check, 
  Tag, 
  Layers, 
  Download, 
  PlayCircle, 
  AlertCircle,
  FileText,
  Loader2,
  X,
  Smartphone,
  ShieldCheck,
  Receipt
} from 'lucide-react';

interface WhatsAppOrdersSectionProps {
  orders: Order[];
  apks: ApkItem[];
  courses: CourseItem[];
  adminWhatsApp: string;
  adminName: string;
  onRefresh: () => Promise<void>;
  onSelectTab?: (tab: string) => void;
}

export const WhatsAppOrdersSection: React.FC<WhatsAppOrdersSectionProps> = ({
  orders,
  apks,
  courses,
  adminWhatsApp,
  adminName,
  onRefresh
}) => {
  const { addToast } = useApp();

  // Filters & Search
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all' | 'cancelled'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Action Loading
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Delivery Modal State
  const [deliveryModalOrder, setDeliveryModalOrder] = useState<Order | null>(null);
  const [customDeliveryMessage, setCustomDeliveryMessage] = useState('');
  const [copiedDelivery, setCopiedDelivery] = useState(false);

  // Create Manual Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [manualForm, setManualForm] = useState({
    userName: '',
    userEmail: '',
    customerWhatsApp: '',
    senderNumber: '',
    itemType: 'apk' as 'apk' | 'course',
    itemId: apks[0]?.id || '',
    amount: (apks[0]?.price || 0).toString(),
    paymentGateway: 'WhatsApp',
    transactionId: '',
    status: 'PAID' as 'PAID' | 'PENDING',
    deliveryNotes: ''
  });

  // Extract all WhatsApp orders (gateway is WhatsApp or ID starts with WA- or has customerWhatsApp)
  const whatsappOrders = useMemo(() => {
    return orders.filter(
      (o) => o.paymentGateway === 'WhatsApp' || o.id.startsWith('WA-') || !!o.customerWhatsApp
    );
  }, [orders]);

  const pendingOrders = useMemo(() => whatsappOrders.filter((o) => o.status === 'PENDING'), [whatsappOrders]);
  const paidOrders = useMemo(() => whatsappOrders.filter((o) => o.status === 'PAID'), [whatsappOrders]);
  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
    [paidOrders]
  );

  // Filtered list
  const filteredOrders = useMemo(() => {
    return whatsappOrders.filter((order) => {
      // Tab filter
      if (filter === 'pending' && order.status !== 'PENDING') return false;
      if (filter === 'paid' && order.status !== 'PAID') return false;
      if (filter === 'cancelled' && order.status !== 'CANCELLED') return false;

      // Search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchId = order.id.toLowerCase().includes(term);
      const matchName = order.userName.toLowerCase().includes(term);
      const matchEmail = order.userEmail.toLowerCase().includes(term);
      const matchPhone = (order.customerWhatsApp || order.senderNumber || '').includes(term);
      const matchItem = order.itemTitle.toLowerCase().includes(term);
      const matchTrx = (order.transactionId || '').toLowerCase().includes(term);

      return matchId || matchName || matchEmail || matchPhone || matchItem || matchTrx;
    });
  }, [whatsappOrders, filter, searchTerm]);

  // Handle Mark as Paid
  const handleMarkAsPaid = async (order: Order, openDeliveryModal = true) => {
    setProcessingOrderId(order.id);
    try {
      await api.updateAdminOrderStatus(order.id, {
        status: 'PAID',
        transactionId: order.transactionId || `WA-TRX-${Date.now().toString().slice(-6)}`
      });

      addToast({
        type: 'success',
        title: 'Order Marked as Paid',
        message: `Unlocked access for ${order.userName}. Triggering delivery notification...`
      });

      await onRefresh();

      if (openDeliveryModal) {
        const msg = generateDeliveryNotificationMessage({
          orderId: order.id,
          userName: order.userName,
          itemTitle: order.itemTitle,
          itemType: order.itemType,
          amount: order.amount,
          currency: order.currency,
          adminName
        });
        setCustomDeliveryMessage(msg);
        setDeliveryModalOrder(order);
      }
    } catch (err: any) {
      console.error('Mark as paid error:', err);
      addToast({
        type: 'error',
        title: 'Failed to update order',
        message: err.message || 'Could not mark order as paid.'
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Handle Reject / Cancel
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to mark this WhatsApp order as CANCELLED?')) return;
    setProcessingOrderId(orderId);
    try {
      await api.updateAdminOrderStatus(orderId, {
        status: 'CANCELLED',
        deliveryNotes: 'Order rejected or cancelled by administrator.'
      });
      addToast({
        type: 'info',
        title: 'Order Cancelled',
        message: 'Order status updated to CANCELLED.'
      });
      await onRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Cancellation failed',
        message: err.message
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Open Delivery Modal for existing Paid Order
  const handleOpenDeliveryModal = (order: Order) => {
    const msg = generateDeliveryNotificationMessage({
      orderId: order.id,
      userName: order.userName,
      itemTitle: order.itemTitle,
      itemType: order.itemType,
      amount: order.amount,
      currency: order.currency,
      adminName
    });
    setCustomDeliveryMessage(msg);
    setDeliveryModalOrder(order);
    setCopiedDelivery(false);
  };

  // Send WhatsApp Delivery Message
  const handleSendWhatsAppNotification = (order: Order) => {
    const targetPhone = order.customerWhatsApp || order.senderNumber || '';
    if (!targetPhone) {
      addToast({
        type: 'error',
        title: 'Missing Phone Number',
        message: 'No WhatsApp number provided for this customer.'
      });
      return;
    }

    const cleanPhone = getCleanWhatsAppNumber(targetPhone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customDeliveryMessage)}`;
    redirectToWhatsApp(url);

    addToast({
      type: 'success',
      title: 'Opening WhatsApp...',
      message: `Sending delivery notification to ${order.userName} (${targetPhone})`
    });
  };

  // Copy Delivery Message to Clipboard
  const handleCopyDeliveryText = () => {
    navigator.clipboard.writeText(customDeliveryMessage);
    setCopiedDelivery(true);
    addToast({
      type: 'success',
      title: 'Message Copied!',
      message: 'Delivery notification text copied to clipboard.'
    });
    setTimeout(() => setCopiedDelivery(false), 2500);
  };

  // Handle Item selection in Manual Order Form
  const handleItemTypeChange = (type: 'apk' | 'course') => {
    if (type === 'apk') {
      const first = apks[0];
      setManualForm({
        ...manualForm,
        itemType: 'apk',
        itemId: first?.id || '',
        amount: (first?.price || 0).toString()
      });
    } else {
      const first = courses[0];
      setManualForm({
        ...manualForm,
        itemType: 'course',
        itemId: first?.id || '',
        amount: (first?.price || 0).toString()
      });
    }
  };

  const handleItemIdChange = (id: string) => {
    if (manualForm.itemType === 'apk') {
      const selected = apks.find((a) => a.id === id);
      setManualForm({
        ...manualForm,
        itemId: id,
        amount: (selected?.price || 0).toString()
      });
    } else {
      const selected = courses.find((c) => c.id === id);
      setManualForm({
        ...manualForm,
        itemId: id,
        amount: (selected?.price || 0).toString()
      });
    }
  };

  // Submit Manual Order
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.userName.trim() || !manualForm.userEmail.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Customer name and email are required.'
      });
      return;
    }

    if (!manualForm.itemId) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select an APK or Course.'
      });
      return;
    }

    setCreatingOrder(true);
    try {
      const res = await api.createAdminManualOrder({
        userName: manualForm.userName.trim(),
        userEmail: manualForm.userEmail.trim(),
        customerWhatsApp: manualForm.customerWhatsApp.trim() || manualForm.senderNumber.trim(),
        senderNumber: manualForm.senderNumber.trim() || manualForm.customerWhatsApp.trim(),
        itemType: manualForm.itemType,
        itemId: manualForm.itemId,
        amount: Number(manualForm.amount) || 0,
        paymentGateway: 'WhatsApp',
        transactionId: manualForm.transactionId.trim() || undefined,
        status: manualForm.status,
        deliveryNotes: manualForm.deliveryNotes.trim() || undefined
      });

      addToast({
        type: 'success',
        title: manualForm.status === 'PAID' ? 'Order Created & Access Unlocked' : 'Manual Order Saved',
        message: res.message
      });

      setShowCreateModal(false);
      await onRefresh();

      // If created as PAID, open delivery notification modal immediately
      if (manualForm.status === 'PAID' && res.order) {
        handleOpenDeliveryModal(res.order);
      }

      // Reset form
      setManualForm({
        userName: '',
        userEmail: '',
        customerWhatsApp: '',
        senderNumber: '',
        itemType: 'apk',
        itemId: apks[0]?.id || '',
        amount: (apks[0]?.price || 0).toString(),
        paymentGateway: 'WhatsApp',
        transactionId: '',
        status: 'PAID',
        deliveryNotes: ''
      });
    } catch (err: any) {
      console.error('Create manual order error:', err);
      addToast({
        type: 'error',
        title: 'Failed to create order',
        message: err.message || 'Could not record manual WhatsApp order.'
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/60 p-6 rounded-3xl border border-emerald-500/20 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <MessageCircle className="w-5 h-5 fill-current" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <span>Manual WhatsApp Orders & Delivery Hub</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Fulfillment
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Review customer orders placed via WhatsApp, verify MFS payments (bKash/Nagad/Rocket), manually mark pending orders as <strong className="text-slate-200">Paid</strong> to unlock access, and trigger one-click instant WhatsApp delivery notifications with library download instructions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Record WhatsApp Order</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div 
          onClick={() => setFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Pending Verification & Delivery</span>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white font-mono">{pendingOrders.length}</p>
            <p className="text-xs text-slate-400">
              {pendingOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)} BDT awaiting
            </p>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-2 font-medium">
            {pendingOrders.length === 0 ? 'All caught up! No pending WhatsApp orders.' : 'Requires admin review to mark as Paid and deliver.'}
          </p>
        </div>

        {/* Paid & Delivered Card */}
        <div 
          onClick={() => setFilter('paid')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filter === 'paid'
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Paid & Access Unlocked</span>
            </span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white font-mono">{paidOrders.length}</p>
            <p className="text-xs text-emerald-400 font-mono font-bold">{totalRevenue.toLocaleString()} BDT</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Delivered orders with unlocked library privileges.
          </p>
        </div>

        {/* WhatsApp Admin Channel Card */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Admin Receiving Number</span>
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-current" />
            </p>
            <p className="text-base font-extrabold text-white font-mono mt-1">{adminWhatsApp}</p>
            <p className="text-[11px] text-slate-400">Admin in-charge: <strong className="text-slate-200">{adminName}</strong></p>
          </div>
          <div className="pt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Direct wa.me active
            </span>
            <span className="text-slate-400">{whatsappOrders.length} total orders</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'pending', label: `Pending (${pendingOrders.length})`, count: pendingOrders.length, color: 'text-amber-300' },
            { id: 'paid', label: `Paid & Delivered (${paidOrders.length})`, count: paidOrders.length, color: 'text-emerald-300' },
            { id: 'all', label: `All WhatsApp (${whatsappOrders.length})`, count: whatsappOrders.length, color: 'text-slate-300' },
            { id: 'cancelled', label: 'Cancelled', count: whatsappOrders.filter(o => o.status === 'CANCELLED').length, color: 'text-rose-400' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className={filter === tab.id ? tab.color : ''}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, email, phone, trx..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/30 rounded-3xl border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No WhatsApp Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filter === 'pending'
              ? 'No pending orders currently awaiting verification. New orders will appear here automatically.'
              : searchTerm
              ? 'No orders matched your search criteria.'
              : 'There are no orders in this category yet.'}
          </p>
          {filter === 'pending' && (
            <button
              onClick={() => setFilter('all')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              View All WhatsApp Orders
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPaid = order.status === 'PAID';
            const isCancelled = order.status === 'CANCELLED';
            const customerPhone = order.customerWhatsApp || order.senderNumber || '';
            const isApk = order.itemType === 'apk';

            return (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isPending
                    ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50 shadow-sm'
                    : isPaid
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Product & Buyer Details */}
                  <div className="flex items-start gap-4">
                    <img
                      src={order.itemThumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=200&q=80'}
                      alt={order.itemTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-800"
                    />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isApk ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        }`}>
                          {isApk ? <Smartphone className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                          <span>{isApk ? 'APK App' : 'Masterclass Course'}</span>
                        </span>

                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          #{order.id}
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">
                          • {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate max-w-md">
                        {order.itemTitle}
                      </h4>

                      {/* Buyer info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                        <span className="font-medium text-slate-200 flex items-center gap-1">
                          👤 <strong>{order.userName}</strong>
                        </span>
                        <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {order.userEmail}
                        </span>
                        {customerPhone && (
                          <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 fill-current" />
                            {customerPhone}
                          </span>
                        )}
                      </div>

                      {/* Additional notes / TrxID */}
                      {(order.transactionId || order.deliveryNotes) && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 inline-flex flex-wrap items-center gap-2 mt-1">
                          {order.transactionId && (
                            <span className="font-mono text-emerald-400">
                              TrxID: <strong>{order.transactionId}</strong>
                            </span>
                          )}
                          {order.deliveryNotes && (
                            <span className="text-slate-400 italic">
                              Note: {order.deliveryNotes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Amount, Status & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-extrabold text-white font-mono">
                        {order.amount} {order.currency}
                      </p>
                      
                      <div className="mt-0.5">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting Payment Verification</span>
                          </span>
                        )}
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid & Delivered</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="w-3 h-3" />
                            <span>Cancelled</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleMarkAsPaid(order, true)}
                            disabled={processingOrderId === order.id}
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                            title="Mark this order as Paid in the database, automatically unlock customer access, and open WhatsApp Delivery Dispatcher"
                          >
                            {processingOrderId === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            )}
                            <span>Mark as Paid & Deliver</span>
                          </button>

                          {customerPhone && (
                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = getCleanWhatsAppNumber(customerPhone);
                                redirectToWhatsApp(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${order.userName}, regarding your order #${order.id} for ${order.itemTitle}:`)}`);
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all cursor-pointer"
                              title="Chat directly with customer on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 fill-current" />
                            </button>
                          )}

                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={processingOrderId === order.id}
                            className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                            title="Reject / Cancel Order"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isPaid && (
                        <>
                          <button
                            onClick={() => handleOpenDeliveryModal(order)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all cursor-pointer"
                            title="Resend WhatsApp Delivery Notification & Access Link"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Resend Delivery Msg</span>
                          </button>

                          {customerPhone && (
                            <button
                              onClick={() => handleSendWhatsAppNotification(order)}
                              className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition-all cursor-pointer"
                              title="Send 1-Click WhatsApp Delivery Notification"
                            >
                              <MessageCircle className="w-4 h-4 fill-current" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE MANUAL WHATSAPP ORDER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">Record Manual WhatsApp Order</h3>
                  <p className="text-[11px] text-slate-400">Create an offline or direct WhatsApp payment entry</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
              {/* Customer Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Customer Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.userName}
                    onChange={(e) => setManualForm({ ...manualForm, userName: e.target.value })}
                    placeholder="e.g. Shakib Rahman"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Customer Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={manualForm.userEmail}
                    onChange={(e) => setManualForm({ ...manualForm, userEmail: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Customer WhatsApp & Sender Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                    Customer WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={manualForm.customerWhatsApp}
                    onChange={(e) => setManualForm({ ...manualForm, customerWhatsApp: e.target.value })}
                    placeholder="e.g. 01711223344"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Transaction ID / Reference
                  </label>
                  <input
                    type="text"
                    value={manualForm.transactionId}
                    onChange={(e) => setManualForm({ ...manualForm, transactionId: e.target.value })}
                    placeholder="e.g. TRX9928172"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono placeholder:text-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Item Type & Item Selection */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">
                    Purchased Item Type <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleItemTypeChange('apk')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        manualForm.itemType === 'apk'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      APK App
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemTypeChange('course')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        manualForm.itemType === 'course'
                          ? 'bg-violet-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Video Course
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Select {manualForm.itemType === 'apk' ? 'APK Application' : 'Masterclass Course'} <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={manualForm.itemId}
                    onChange={(e) => handleItemIdChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    {manualForm.itemType === 'apk'
                      ? apks.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.price} {a.currency}) - {a.version}
                          </option>
                        ))
                      : courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.price} {c.currency}) - {c.level}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {/* Price & Status Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Collected Amount (BDT)
                  </label>
                  <input
                    type="number"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Initial Fulfillment Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold outline-none"
                  >
                    <option value="PAID">Paid (Unlock Access Instantly)</option>
                    <option value="PENDING">Pending (Awaiting Verification)</option>
                  </select>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Delivery / Verification Notes (Optional)
                </label>
                <input
                  type="text"
                  value={manualForm.deliveryNotes}
                  onChange={(e) => setManualForm({ ...manualForm, deliveryNotes: e.target.value })}
                  placeholder="e.g. Paid 350 BDT via bKash personal send money to Tanvir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingOrder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>{manualForm.status === 'PAID' ? 'Save & Unlock Access' : 'Save as Pending'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP DELIVERY NOTIFICATION DISPATCHER */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">WhatsApp Delivery Notification</h3>
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>User access successfully unlocked in database</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDeliveryModalOrder(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Recipient</p>
                  <p className="font-bold text-white">{deliveryModalOrder.userName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{deliveryModalOrder.userEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp Number</p>
                  <p className="font-bold font-mono text-emerald-400">
                    {deliveryModalOrder.customerWhatsApp || deliveryModalOrder.senderNumber || 'None provided'}
                  </p>
                  <p className="text-[10px] text-slate-400">Order: #{deliveryModalOrder.id}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium truncate max-w-[280px]">
                  📦 {deliveryModalOrder.itemTitle}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {deliveryModalOrder.amount} {deliveryModalOrder.currency}
                </span>
              </div>
            </div>

            {/* Editable Notification Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-200">
                  Generated WhatsApp Notification Message:
                </label>
                <button
                  type="button"
                  onClick={handleCopyDeliveryText}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedDelivery ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDelivery ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <textarea
                rows={9}
                value={customDeliveryMessage}
                onChange={(e) => setCustomDeliveryMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 font-mono outline-none focus:border-emerald-500/50 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeliveryModalOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer order-2 sm:order-1"
              >
                Close Window
              </button>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={handleCopyDeliveryText}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppNotification(deliveryModalOrder)}
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send via WhatsApp Web/App</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
