export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  type: 'all' | 'apk' | 'course';
}

export interface ApkItem {
  id: string;
  title: string;
  description: string;
  detailedNotes: string;
  thumbnail: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  version: string;
  category: string;
  type: 'apk';
  accessType: 'FREE' | 'PAID';
  price: number;
  currency: string;
  downloadsCount: number;
  published: boolean;
  developer: string;
  changelog: string[];
  sha256Checksum?: string;
  packageId?: string;
  minAndroidVersion?: string;
  createdAt: string;
  updatedAt: string;
  hasUnlocked?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: string;
  position: number;
  isFreePreview: boolean;
  canWatch?: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  category: string;
  type: 'course';
  accessType: 'FREE' | 'PAID';
  price: number;
  currency: string;
  instructor: string;
  instructorBio?: string;
  durationMinutes: number;
  totalLessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  published: boolean;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
  hasUnlocked?: boolean;
  lessonsCount?: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  itemType: 'apk' | 'course';
  itemId: string;
  itemTitle: string;
  itemThumbnail: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  paymentGateway: 'WhatsApp' | 'bKash' | 'Nagad' | 'Rocket' | 'SSLCommerz' | 'Stripe' | 'Sandbox';
  paymentReference: string;
  transactionId?: string;
  senderNumber?: string;
  customerWhatsApp?: string;
  deliveryNotes?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface DownloadLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  apkId: string;
  apkTitle: string;
  apkVersion: string;
  downloadedAt: string;
  ip?: string;
  userAgent?: string;
  status?: 'COMPLETED' | 'INTERRUPTED' | 'UNAUTHORIZED';
}

export type PricingMode = 'FREE' | 'PAID' | 'AUTOMATIC' | 'REVIEW';
export type AutomationMode = 'MANUAL' | 'REVIEW FIRST' | 'FULL AUTO';
export type SchedulerInterval = 'DISABLED' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';
export type ImportItemStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'FAILED' | 'DUPLICATE' | 'SECURITY_REVIEW' | 'REJECTED';
export type SecurityStatus = 'PASSED' | 'SECURITY_REVIEW' | 'FAILED';

export interface ImportSource {
  id: string;
  name: string;
  baseUrl: string;
  type: 'apk' | 'video' | 'course' | 'feed';
  enabled: boolean;
  trusted: boolean;
  allowedContentTypes: ('apk' | 'video' | 'course')[];
  defaultCategory: string;
  pricingMode: PricingMode;
  defaultPrice: number;
  createdAt: string;
  lastPolledAt?: string;
}

export interface ImportJob {
  id: string;
  sourceId: string;
  sourceName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  finishedAt?: string;
  foundCount: number;
  importedCount: number;
  failedCount: number;
  skippedCount: number;
  errorLogs: string[];
}

export interface ImportItem {
  id: string;
  jobId?: string;
  sourceUrl: string;
  canonicalUrl?: string;
  title: string;
  description?: string;
  fullDescription?: string;
  contentType: 'apk' | 'video' | 'course' | 'file';
  status: ImportItemStatus;
  securityStatus: SecurityStatus;
  securityDetails?: string;
  sha256Checksum?: string;
  fileSize?: string;
  version?: string;
  developer?: string;
  thumbnail?: string;
  fileUrl?: string;
  videoUrl?: string;
  detectedPrice?: number;
  calculatedPrice: number;
  accessType: 'FREE' | 'PAID';
  currency: string;
  category: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  errorMessage?: string;
  contentId?: string;
  lessons?: Array<{
    title: string;
    videoUrl?: string;
    duration: string;
    position: number;
    isFreePreview: boolean;
  }>;
  downloadVideo?: boolean;
  rawMetadata?: Record<string, any>;
  createdAt: string;
  reviewedAt?: string;
}

export interface PricingRule {
  id: string;
  contentType: 'apk' | 'video' | 'course';
  minLessons?: number;
  maxLessons?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  price: number;
  currency: string;
  enabled: boolean;
}

export interface PricingSettings {
  currency: string;
  defaultApkPrice: number;
  defaultVideoPrice: number;
  defaultCoursePrice: number;
  minPrice: number;
  maxPrice: number;
  allowAutomaticPricing: boolean;
  allowSourcePrice: boolean;
  requireApprovalForAutomaticPricing: boolean;
  automationMode: AutomationMode;
  schedulerInterval: SchedulerInterval;
  maxApkSizeMb: number;
  maxVideoSizeMb: number;
  maxDownloadTimeSeconds: number;
  maxRedirects: number;
}

export interface AutoImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  duplicates: number;
  securityFailures: number;
  publishedAutomatically: number;
  waitingForReview: number;
}

export interface AppSettings {
  siteName: string;
  siteTagline: string;
  adminName: string;
  adminWhatsApp: string;
  supportEmail: string;
  supportPhone: string;
  primaryCurrency: string;
  bKashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  allowUserRegistration: boolean;
  maintenanceMode: boolean;
  noticeBanner: string;
  showNoticeBanner: boolean;
  whatsAppEnabled: boolean;
  bKashEnabled: boolean;
  nagadEnabled: boolean;
  rocketEnabled: boolean;
  sslCommerzEnabled: boolean;
  stripeEnabled: boolean;
  sandboxEnabled: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalApks: number;
  totalCourses: number;
  totalPurchases: number;
  totalDownloads: number;
  totalRevenue: number;
  recentUsers: User[];
  recentPurchases: Order[];
  recentDownloads: DownloadLog[];
  revenueByGateway: Record<string, number>;
}

export type ViewTab = 'home' | 'apks' | 'courses' | 'free' | 'library' | 'admin';
