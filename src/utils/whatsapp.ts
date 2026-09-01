import { ApkItem, CourseItem, User } from '../types';

export const ADMIN_WHATSAPP_NUMBER = '+8801329179522';
export const ADMIN_NAME = 'Tanvir';

/**
 * Strips formatting to get clean digits for wa.me links (e.g. 8801329179522)
 */
export function getCleanWhatsAppNumber(phone: string = ADMIN_WHATSAPP_NUMBER): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Builds the exact message requested by the user:
 * "hi tanvir i want to by this apk or anythin..."
 */
export function generateWhatsAppMessage(params: {
  item: ApkItem | CourseItem;
  type: 'apk' | 'course';
  user?: User | null;
  orderId?: string;
  adminName?: string;
}): string {
  const { item, type, user, orderId } = params;
  const adminName = params.adminName || ADMIN_NAME;

  if (type === 'apk') {
    const apk = item as ApkItem;
    return `Hi ${adminName}, I want to buy this APK:
📱 App: ${apk.title}
💰 Price: ${apk.price} ${apk.currency}
📦 Version: ${apk.version}
👤 Buyer: ${user?.name || 'Customer'} (${user?.email || 'N/A'})
${orderId ? `🆔 Order ID: ${orderId}` : `🆔 Item ID: ${apk.id}`}

Please send me payment instructions and download link!`;
  } else {
    const course = item as CourseItem;
    return `Hi ${adminName}, I want to buy this Course:
🎓 Course: ${course.title}
💰 Price: ${course.price} ${course.currency}
👤 Buyer: ${user?.name || 'Customer'} (${user?.email || 'N/A'})
${orderId ? `🆔 Order ID: ${orderId}` : `🆔 Course ID: ${course.id}`}

Please send me payment details to enroll and unlock access!`;
  }
}

/**
 * Builds the direct https://wa.me link
 */
export function getWhatsAppBuyUrl(params: {
  item: ApkItem | CourseItem;
  type: 'apk' | 'course';
  user?: User | null;
  orderId?: string;
  phone?: string;
  adminName?: string;
}): string {
  const phone = getCleanWhatsAppNumber(params.phone || ADMIN_WHATSAPP_NUMBER);
  const text = generateWhatsAppMessage(params);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Automatically redirects the user to WhatsApp Web or the WhatsApp App
 * with pre-filled message without requiring manual copy-pasting.
 */
export function redirectToWhatsApp(url: string): void {
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.assign(url);
    }
  } catch {
    window.location.href = url;
  }
}

/**
 * Builds the official delivery confirmation message for admin to notify the customer
 */
export function generateDeliveryNotificationMessage(params: {
  orderId: string;
  userName: string;
  itemTitle: string;
  itemType: 'apk' | 'course';
  amount: number;
  currency: string;
  adminName?: string;
}): string {
  const adminName = params.adminName || ADMIN_NAME;
  const isApk = params.itemType === 'apk';
  const typeLabel = isApk ? 'Android APK Application' : 'Video Masterclass Course';

  return `🎉 *Payment Received & Access Unlocked!*

Hi ${params.userName || 'Valued Customer'},
Your payment of *${params.amount} ${params.currency}* for *"${params.itemTitle}"* (${typeLabel}) has been verified and confirmed!

✅ *Status*: PAID & DELIVERED
📦 *Order ID*: #${params.orderId}

🚀 *How to access right now*:
1. Log in to your AppHub account.
2. Go to *My Library* (https://apphub.com/#library).
3. ${isApk ? 'Tap "Download APK" to start your direct verified APK installation.' : 'Tap "Start Watching" to access all full HD video lessons & syllabus.'}

If you need any installation help or have questions, feel free to reply directly to this chat.

Thank you for choosing AppHub!
- ${adminName}`;
}

/**
 * Builds the direct WhatsApp delivery URL to message the customer
 */
export function getWhatsAppDeliveryUrl(params: {
  phone: string;
  orderId: string;
  userName: string;
  itemTitle: string;
  itemType: 'apk' | 'course';
  amount: number;
  currency: string;
  adminName?: string;
}): string {
  const phone = getCleanWhatsAppNumber(params.phone);
  const text = generateDeliveryNotificationMessage(params);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

