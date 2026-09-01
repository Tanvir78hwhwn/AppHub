import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { seedCategories } from './seedData/seedCategories';
import { seedApks } from './seedData/seedApks';
import { seedCourses } from './seedData/seedCourses';
import { seedLessons } from './seedData/seedLessons';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  resetToken?: string;
  resetTokenExpiry?: number;
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
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration: string;
  position: number;
  isFreePreview: boolean;
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

export interface UserPurchase {
  id: string;
  userId: string;
  itemType: 'apk' | 'course';
  itemId: string;
  orderId: string;
  amount: number;
  purchasedAt: string;
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

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  apks: ApkItem[];
  courses: CourseItem[];
  lessons: Lesson[];
  orders: Order[];
  downloads: DownloadLog[];
  purchases: UserPurchase[];
  settings: AppSettings;
  importSources?: ImportSource[];
  importJobs?: ImportJob[];
  importItems?: ImportItem[];
  pricingRules?: PricingRule[];
  pricingSettings?: PricingSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data
const defaultCategories: Category[] = [
  { id: 'cat-dev', name: 'Developer Tools', slug: 'dev-tools', description: 'Essential utilities, SDK wrappers, and debug assistants for programmers', icon: 'Code', type: 'all' },
  { id: 'cat-android', name: 'Android Mastery', slug: 'android-mastery', description: 'Complete deep dive into Kotlin, Jetpack Compose, and native architecture', icon: 'Smartphone', type: 'course' },
  { id: 'cat-productivity', name: 'Productivity & Office', slug: 'productivity', description: 'Clean document suites, automation scripts, and task planners', icon: 'CheckSquare', type: 'all' },
  { id: 'cat-web', name: 'Web & Full-Stack', slug: 'web-fullstack', description: 'React, Node.js, Express, and modern cloud deployment masterclasses', icon: 'Globe', type: 'course' },
  { id: 'cat-media', name: 'Media & Audio', slug: 'media-audio', description: 'Audio processing, video converters, and screen recorders', icon: 'Video', type: 'all' },
  { id: 'cat-security', name: 'Security & Utilities', slug: 'security-utilities', description: 'Network analyzers, hardware monitors, and safe storage vaults', icon: 'ShieldCheck', type: 'all' }
];

const defaultApks: ApkItem[] = [
  {
    id: 'apk-1',
    title: 'CodeFlow Studio Mobile',
    description: 'Lightweight offline TypeScript & Python code runner with syntax highlighting, Git sync, and terminal emulation.',
    detailedNotes: 'Designed for engineers who want to test snippets, review PRs, and run mini-servers on ARM64 and ARMv7 Android devices without telemetry or ads.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/uploads/sample-codeflow-v2.4.1.apk',
    fileName: 'codeflow-studio-v2.4.1.apk',
    fileSize: '18.4 MB',
    version: 'v2.4.1',
    category: 'Developer Tools',
    type: 'apk',
    accessType: 'FREE',
    price: 0,
    currency: 'BDT',
    downloadsCount: 1420,
    published: true,
    developer: 'AppHub Dev Team',
    packageId: 'com.apphub.codeflow',
    minAndroidVersion: 'Android 8.0 (Oreo) or higher',
    sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    changelog: [
      'Added TypeScript 5.8 support and JSX live evaluator',
      'Improved ARM64 native compiler performance by 35%',
      'Fixed terminal ANSI color rendering glitch'
    ],
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-25T14:30:00.000Z'
  },
  {
    id: 'apk-2',
    title: 'NetGuard Pro Diagnostic Suite',
    description: 'Advanced network packet analyzer, DNS benchmark tester, and WiFi signal heatmap creator for network administrators.',
    detailedNotes: 'Full professional suite supporting real-time ping jitter calculation, port scanning with safe rate limits, subnet exploration, and exportable PDF audit logs.',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/uploads/sample-netguard-v3.0.0.apk',
    fileName: 'netguard-pro-v3.0.0.apk',
    fileSize: '12.8 MB',
    version: 'v3.0.0',
    category: 'Security & Utilities',
    type: 'apk',
    accessType: 'PAID',
    price: 350,
    currency: 'BDT',
    downloadsCount: 864,
    published: true,
    developer: 'CyberCraft Labs',
    packageId: 'com.cybercraft.netguardpro',
    minAndroidVersion: 'Android 9.0 (Pie) or higher',
    sha256Checksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    changelog: [
      'New WiFi 7 and 6GHz channel spectrum scanner',
      'Added automated DNS over HTTPS (DoH) latency benchmarks',
      'Encrypted local log export in JSON and CSV formats'
    ],
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-08-28T09:15:00.000Z'
  },
  {
    id: 'apk-3',
    title: 'FocusTrack Daily Pomodoro & Habit Sync',
    description: 'Minimalist, distraction-free productivity timer with soundscapes, widget support, and offline encrypted sync.',
    detailedNotes: 'Crafted with extreme attention to battery efficiency and clean typography. Supports custom work cycles, tagged tasks, and daily streak backup.',
    thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/uploads/sample-focustrack-v1.8.apk',
    fileName: 'focustrack-v1.8.apk',
    fileSize: '8.2 MB',
    version: 'v1.8.0',
    category: 'Productivity & Office',
    type: 'apk',
    accessType: 'FREE',
    price: 0,
    currency: 'BDT',
    downloadsCount: 2310,
    published: true,
    developer: 'Zenith Apps',
    packageId: 'com.zenith.focustrack',
    minAndroidVersion: 'Android 7.0 or higher',
    sha256Checksum: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    changelog: [
      'Added binaural ambient rain & coffee shop sound generator',
      'Adaptive dynamic material colors for Android 12+',
      'Reduced memory footprint to less than 24MB'
    ],
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-20T11:00:00.000Z'
  },
  {
    id: 'apk-4',
    title: 'AudioMaster Studio Pro Mobile',
    description: 'Multi-track wave audio recording, noise-suppression mastering, and lossless FLAC/WAV editor for content creators.',
    detailedNotes: 'Real-time 32-bit floating point audio engine with 10-band graphic equalizer, compressor, limiter, and batch format converter optimized for mobile CPUs.',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/uploads/sample-audiomaster-v4.2.apk',
    fileName: 'audiomaster-pro-v4.2.apk',
    fileSize: '34.6 MB',
    version: 'v4.2.2',
    category: 'Media & Audio',
    type: 'apk',
    accessType: 'PAID',
    price: 500,
    currency: 'BDT',
    downloadsCount: 612,
    published: true,
    developer: 'SonicWorks Audio',
    packageId: 'com.sonicworks.audiomaster',
    minAndroidVersion: 'Android 10.0 or higher',
    sha256Checksum: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    changelog: [
      'Added AI speech clarity isolation filter',
      'Support for USB-C external audio interfaces and MIDI controllers',
      'Ultra low-latency audio monitor mode'
    ],
    createdAt: '2026-08-18T16:00:00.000Z',
    updatedAt: '2026-08-29T10:00:00.000Z'
  }
];

const defaultCourses: CourseItem[] = [
  {
    id: 'course-1',
    title: 'Modern Full-Stack Node.js & React Architecture Masterclass',
    description: 'Learn to build, secure, and deploy high-performance web and mobile apps with Express, React 19, JWT, and Cloud Run.',
    longDescription: 'Comprehensive hands-on curriculum taking you from fundamental HTTP primitives to enterprise microservices, token authentication, payment gateway integrations (bKash, Stripe, SSLCommerz), database modeling, and server-side optimization.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
    category: 'Web & Full-Stack',
    type: 'course',
    accessType: 'PAID',
    price: 1200,
    currency: 'BDT',
    instructor: 'Engr. Tanvir Ahmed',
    instructorBio: 'Senior Principal Software Engineer & Cloud Architect with 10+ years scaling full-stack platforms across South Asia.',
    durationMinutes: 480,
    totalLessons: 6,
    level: 'All Levels',
    published: true,
    skills: ['Node.js', 'Express', 'React 19', 'JWT Security', 'Payment Gateways', 'API Design', 'Production Deployment'],
    createdAt: '2026-08-05T09:00:00.000Z',
    updatedAt: '2026-08-27T15:00:00.000Z'
  },
  {
    id: 'course-2',
    title: 'Android Kotlin & Jetpack Compose: Zero to Production',
    description: 'Master Android app development from scratch using modern Kotlin coroutines, Flow, Room DB, Clean Architecture, and MVVM.',
    longDescription: 'Step-by-step masterclass covering modern Android standards: declarative UI with Jetpack Compose, modular architecture, dependency injection with Hilt, REST API consumption with Retrofit, and APK publishing best practices.',
    thumbnail: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=600&q=80',
    category: 'Android Mastery',
    type: 'course',
    accessType: 'FREE',
    price: 0,
    currency: 'BDT',
    instructor: 'Rahimul Islam',
    instructorBio: 'Google Developer Expert (Android) and open-source contributor with 2M+ app downloads.',
    durationMinutes: 240,
    totalLessons: 4,
    level: 'Beginner',
    published: true,
    skills: ['Kotlin', 'Jetpack Compose', 'MVVM Architecture', 'Coroutines & Flow', 'Room Database', 'APK Building'],
    createdAt: '2026-08-12T11:00:00.000Z',
    updatedAt: '2026-08-24T18:00:00.000Z'
  },
  {
    id: 'course-3',
    title: 'Enterprise Payment Gateways & Secure Fintech Integrations',
    description: 'Implement rock-solid payment flows with bKash API, Nagad, SSLCommerz, Stripe webhooks, and fraud prevention.',
    longDescription: 'A deep security-first guide for developers on handling financial transactions, IPN listeners, idempotent server verification, ledger double-entry bookkeeping, and transaction reconciliations.',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    category: 'Web & Full-Stack',
    type: 'course',
    accessType: 'PAID',
    price: 950,
    currency: 'BDT',
    instructor: 'Farzana Yasmin',
    instructorBio: 'Fintech Security Specialist & Backend Lead architecting payment infrastructures processing millions daily.',
    durationMinutes: 320,
    totalLessons: 5,
    level: 'Intermediate',
    published: true,
    skills: ['bKash Tokenized API', 'SSLCommerz IPN', 'Stripe Webhooks', 'Cryptographic Signatures', 'Idempotency', 'Security Audits'],
    createdAt: '2026-08-19T14:00:00.000Z',
    updatedAt: '2026-08-30T12:00:00.000Z'
  }
];

const defaultLessons: Lesson[] = [
  // Course 1 lessons
  {
    id: 'les-101',
    courseId: 'course-1',
    title: '1. Introduction & Full-Stack Architecture Blueprint',
    description: 'Overview of modern full-stack systems, monolith vs microservices, and our course roadmap.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Clean streaming embed
    duration: '18:45',
    position: 1,
    isFreePreview: true
  },
  {
    id: 'les-102',
    courseId: 'course-1',
    title: '2. Express REST API Design & Secure JWT Authentication',
    description: 'Building robust routes, bcrypt password hashing, token expiration, and auth middleware.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '42:10',
    position: 2,
    isFreePreview: true
  },
  {
    id: 'les-103',
    courseId: 'course-1',
    title: '3. Relational & Document Data Modeling for Digital Marketplaces',
    description: 'Structuring users, products, orders, download logs, and maintaining relational integrity.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '55:30',
    position: 3,
    isFreePreview: false
  },
  {
    id: 'les-104',
    courseId: 'course-1',
    title: '4. File Upload Pipeline, Mime Validation & Protected Storage',
    description: 'Handling multi-megabyte APK uploads, chunked storage, and generating time-bound secure download URLs.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '48:20',
    position: 4,
    isFreePreview: false
  },
  {
    id: 'les-105',
    courseId: 'course-1',
    title: '5. Payment Gateway Engine: bKash & Card Integration',
    description: 'Server-side order creation, webhook verification, transaction signature checks, and access unlock.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '62:15',
    position: 5,
    isFreePreview: false
  },
  {
    id: 'les-106',
    courseId: 'course-1',
    title: '6. Production Deployment & Cloud Optimization',
    description: 'Containerizing Node.js, static asset bundling, Nginx reverse proxy, and zero-downtime releases.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: '35:00',
    position: 6,
    isFreePreview: false
  },

  // Course 2 lessons
  {
    id: 'les-201',
    courseId: 'course-2',
    title: '1. Kotlin Fundamentals & Modern Development Setup',
    description: 'Setting up Android Studio, Kotlin 2.0 syntax, null safety, and basic project scaffolding.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '22:15',
    position: 1,
    isFreePreview: true
  },
  {
    id: 'les-202',
    courseId: 'course-2',
    title: '2. Jetpack Compose UI: State, Modifiers & Layouts',
    description: 'Declarative layout building, custom animations, theme styling, and reusable composables.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '38:40',
    position: 2,
    isFreePreview: true
  },
  {
    id: 'les-203',
    courseId: 'course-2',
    title: '3. ViewModel, StateFlow & Offline-First Room Database',
    description: 'State management, coroutine dispatchers, and robust local caching architecture.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '45:10',
    position: 3,
    isFreePreview: true
  },
  {
    id: 'les-204',
    courseId: 'course-2',
    title: '4. Building Signed APKs & Release Distribution',
    description: 'Keystore generation, ProGuard/R8 obfuscation, version code bumps, and APK testing.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '30:20',
    position: 4,
    isFreePreview: true
  },

  // Course 3 lessons
  {
    id: 'les-301',
    courseId: 'course-3',
    title: '1. Bangladesh Fintech Landscape & Payment Protocol Foundations',
    description: 'Understanding MFS (bKash, Nagad, Rocket), cards, and payment gateway architectures.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '26:00',
    position: 1,
    isFreePreview: true
  },
  {
    id: 'les-302',
    courseId: 'course-3',
    title: '2. bKash Tokenized Checkout API Implementation',
    description: 'Grant token, create payment, execute payment, and handling query payment status.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: '49:30',
    position: 2,
    isFreePreview: false
  },
  {
    id: 'les-303',
    courseId: 'course-3',
    title: '3. SSLCommerz & Nagad Multi-Channel Gateway Integration',
    description: 'Setting up session initialization, validation API callbacks, and handling IPN alerts.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '52:10',
    position: 3,
    isFreePreview: false
  },
  {
    id: 'les-304',
    courseId: 'course-3',
    title: '4. Stripe International Checkout & Webhook Security',
    description: 'Card processing, 3D Secure verification, webhook signature HMAC validation.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: '44:15',
    position: 4,
    isFreePreview: false
  },
  {
    id: 'les-305',
    courseId: 'course-3',
    title: '5. Automated Reconciliation, Refunds & Fraud Prevention',
    description: 'Building admin ledger panels, idempotency keys, and handling edge cases safely.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: '40:00',
    position: 5,
    isFreePreview: false
  }
];

const defaultSettings: AppSettings = {
  siteName: 'AppHub & Academy',
  siteTagline: 'Verified Digital APKs & Professional Video Courses',
  adminName: 'Tanvir',
  adminWhatsApp: '+8801329179522',
  supportEmail: 'support@apphub.com',
  supportPhone: '+880 1329-179522',
  primaryCurrency: 'BDT',
  bKashNumber: '01329179522',
  nagadNumber: '01329179522',
  rocketNumber: '01329179522',
  allowUserRegistration: true,
  maintenanceMode: false,
  noticeBanner: '🚀 Welcome! Order APKs & Courses directly on WhatsApp: +8801329179522 (Tanvir)',
  showNoticeBanner: true,
  whatsAppEnabled: true,
  bKashEnabled: true,
  nagadEnabled: true,
  rocketEnabled: true,
  sslCommerzEnabled: true,
  stripeEnabled: true,
  sandboxEnabled: true
};

export const defaultPricingSettings: PricingSettings = {
  currency: 'BDT',
  defaultApkPrice: 49,
  defaultVideoPrice: 99,
  defaultCoursePrice: 149,
  minPrice: 10,
  maxPrice: 5000,
  allowAutomaticPricing: true,
  allowSourcePrice: true,
  requireApprovalForAutomaticPricing: false,
  automationMode: 'REVIEW FIRST',
  schedulerInterval: '1h',
  maxApkSizeMb: 250,
  maxVideoSizeMb: 500,
  maxDownloadTimeSeconds: 60,
  maxRedirects: 5
};

export const defaultPricingRules: PricingRule[] = [
  { id: 'rule-apk-default', contentType: 'apk', price: 49, currency: 'BDT', enabled: true },
  { id: 'rule-video-default', contentType: 'video', price: 99, currency: 'BDT', enabled: true },
  { id: 'rule-course-tier1', contentType: 'course', minLessons: 1, maxLessons: 3, price: 49, currency: 'BDT', enabled: true },
  { id: 'rule-course-tier2', contentType: 'course', minLessons: 4, maxLessons: 10, price: 99, currency: 'BDT', enabled: true },
  { id: 'rule-course-tier3', contentType: 'course', minLessons: 11, maxLessons: 20, price: 149, currency: 'BDT', enabled: true },
  { id: 'rule-course-tier4', contentType: 'course', minLessons: 21, maxLessons: 999, price: 199, currency: 'BDT', enabled: true }
];

export const defaultImportSources: ImportSource[] = [
  {
    id: 'src-f-droid-fdroid',
    name: 'My Authorized APK Feed',
    baseUrl: 'https://f-droid.org/repo/index-v1.json',
    type: 'feed',
    enabled: true,
    trusted: true,
    allowedContentTypes: ['apk'],
    defaultCategory: 'Developer Tools',
    pricingMode: 'AUTOMATIC',
    defaultPrice: 49,
    createdAt: '2026-08-20T00:00:00.000Z'
  },
  {
    id: 'src-flutter-courses',
    name: 'Open Android & Flutter Academy Hub',
    baseUrl: 'https://flutter.dev/learn/courses.json',
    type: 'course',
    enabled: true,
    trusted: true,
    allowedContentTypes: ['course', 'video'],
    defaultCategory: 'Android Mastery',
    pricingMode: 'AUTOMATIC',
    defaultPrice: 149,
    createdAt: '2026-08-22T00:00:00.000Z'
  }
];

export const defaultImportItems: ImportItem[] = [
  {
    id: 'imp-demo-1',
    sourceUrl: 'https://github.com/termux/termux-app/releases/download/v0.118.0/termux-app_v0.118.0+github-debug_universal.apk',
    canonicalUrl: 'https://github.com/termux/termux-app',
    title: 'Termux Terminal & Linux Environment Mobile',
    description: 'Powerful Linux environment simulation on Android with apt package manager, shell scripting, and Python runtime.',
    fullDescription: 'Termux combines powerful terminal emulation with an extensive Linux package collection. Enjoy the bash and zsh shells, edit files with nano and vim, access servers over ssh, and develop in C with clang, make, and gdb.',
    contentType: 'apk',
    status: 'PUBLISHED',
    securityStatus: 'PASSED',
    securityDetails: 'Static signature validated: Clean APK headers, zero adware permissions, package manifest intact.',
    sha256Checksum: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    fileSize: '97.2 MB',
    version: 'v0.118.0',
    developer: 'Termux Development Community',
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80',
    fileUrl: '/uploads/sample-termux-v0.118.apk',
    calculatedPrice: 49,
    accessType: 'PAID',
    currency: 'BDT',
    category: 'Developer Tools',
    tags: ['Terminal', 'Linux', 'Developer', 'Python', 'Shell'],
    seoTitle: 'Download Termux Mobile Terminal APK for Android',
    seoDescription: 'Verified Termux APK with offline Linux tools and complete terminal emulator for developers.',
    contentId: 'apk-1',
    createdAt: '2026-08-29T10:00:00.000Z',
    reviewedAt: '2026-08-29T10:05:00.000Z'
  },
  {
    id: 'imp-demo-2',
    sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Jetpack Compose Native Android UI Masterclass',
    description: 'Master declarative UI development in modern Android with Kotlin state management and animated transitions.',
    fullDescription: 'Comprehensive deep dive into Jetpack Compose, state hoisting, performance profiling, LazyLayouts, and beautiful Material 3 theming.',
    contentType: 'course',
    status: 'PENDING_REVIEW',
    securityStatus: 'PASSED',
    securityDetails: 'Direct stream verified. 5 HD lessons parsed.',
    calculatedPrice: 99,
    accessType: 'PAID',
    currency: 'BDT',
    category: 'Android Mastery',
    tags: ['Jetpack Compose', 'Kotlin', 'Android', 'UI/UX'],
    thumbnail: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=600&q=80',
    lessons: [
      { title: 'Lesson 1: Introduction to Declarative UI & Composables', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: '14:20', position: 1, isFreePreview: true },
      { title: 'Lesson 2: State Hoisting & RememberUpdatedState', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: '18:45', position: 2, isFreePreview: false },
      { title: 'Lesson 3: AnimatedVisibility & Shared Element Transitions', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: '22:10', position: 3, isFreePreview: false },
      { title: 'Lesson 4: LazyColumn Optimization & ViewModels', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', duration: '19:30', position: 4, isFreePreview: false },
      { title: 'Lesson 5: Navigation 3 & Safe Args Architecture', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', duration: '16:00', position: 5, isFreePreview: false }
    ],
    createdAt: '2026-09-01T06:00:00.000Z'
  }
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          categories: parsed.categories || defaultCategories,
          apks: parsed.apks || defaultApks,
          courses: parsed.courses || defaultCourses,
          lessons: parsed.lessons || defaultLessons,
          orders: parsed.orders || [],
          downloads: parsed.downloads || [],
          purchases: parsed.purchases || [],
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          importSources: parsed.importSources || defaultImportSources,
          importJobs: parsed.importJobs || [],
          importItems: parsed.importItems || defaultImportItems,
          pricingRules: parsed.pricingRules || defaultPricingRules,
          pricingSettings: { ...defaultPricingSettings, ...(parsed.pricingSettings || {}) }
        };
      }
    } catch (err) {
      console.error('Error reading database file, initializing with defaults:', err);
    }

    // Seed default admin and user
    const adminPasswordHash = bcrypt.hashSync('AdminPassword123!', 10);
    const demoUserPasswordHash = bcrypt.hashSync('UserPassword123!', 10);

    const initialUsers: User[] = [
      {
        id: 'usr-admin-1',
        name: 'Tanvir (Admin)',
        email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@apphub.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        createdAt: '2026-08-01T00:00:00.000Z'
      },
      {
        id: 'usr-demo-1',
        name: 'Shakib Rahman',
        email: 'user@apphub.com',
        passwordHash: demoUserPasswordHash,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        createdAt: '2026-08-15T00:00:00.000Z'
      }
    ];

    // Seed initial demo purchases for demo user
    const initialPurchases: UserPurchase[] = [
      {
        id: 'purch-1',
        userId: 'usr-demo-1',
        itemType: 'apk',
        itemId: 'apk-2',
        orderId: 'ord-seed-1',
        amount: 350,
        purchasedAt: '2026-08-20T10:00:00.000Z'
      }
    ];

    const initialOrders: Order[] = [
      {
        id: 'ord-seed-1',
        userId: 'usr-demo-1',
        userName: 'Shakib Rahman',
        userEmail: 'user@apphub.com',
        itemType: 'apk',
        itemId: 'apk-2',
        itemTitle: 'NetGuard Pro Diagnostic Suite',
        itemThumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        amount: 350,
        currency: 'BDT',
        status: 'PAID',
        paymentGateway: 'bKash',
        paymentReference: 'BKASH-DEMO-994201',
        transactionId: 'TRX992817291',
        senderNumber: '01711223344',
        createdAt: '2026-08-20T09:58:00.000Z',
        verifiedAt: '2026-08-20T10:00:00.000Z'
      },
      {
        id: 'WA-ORD-9021',
        userId: 'usr-demo-1',
        userName: 'Shakib Rahman',
        userEmail: 'user@apphub.com',
        itemType: 'course',
        itemId: 'course-1',
        itemTitle: 'Full-Stack Web & Android APK Marketplace Engineering',
        itemThumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
        amount: 1200,
        currency: 'BDT',
        status: 'PENDING',
        paymentGateway: 'WhatsApp',
        paymentReference: 'WA-DIRECT-9021',
        transactionId: 'WA-TRX-5519',
        senderNumber: '01711223344',
        customerWhatsApp: '+8801711223344',
        deliveryNotes: 'Customer messaged Tanvir on WhatsApp, sent 1200 BDT via bKash personal send-money. Awaiting admin approval to unlock course.',
        createdAt: '2026-08-31T18:40:00.000Z'
      },
      {
        id: 'WA-ORD-9034',
        userId: 'usr-demo-2',
        userName: 'Farhan Ahmed',
        userEmail: 'farhan.ahmed@gmail.com',
        itemType: 'apk',
        itemId: 'apk-3',
        itemTitle: 'FocusTrack Daily Pomodoro & Habit Sync',
        itemThumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
        amount: 200,
        currency: 'BDT',
        status: 'PENDING',
        paymentGateway: 'WhatsApp',
        paymentReference: 'WA-DIRECT-9034',
        transactionId: 'NAGAD-99124',
        senderNumber: '01819283746',
        customerWhatsApp: '+8801819283746',
        deliveryNotes: 'Direct order on WhatsApp. Paid 200 BDT via Nagad.',
        createdAt: '2026-09-01T05:15:00.000Z'
      },
      {
        id: 'WA-ORD-8812',
        userId: 'usr-demo-1',
        userName: 'Shakib Rahman',
        userEmail: 'user@apphub.com',
        itemType: 'apk',
        itemId: 'apk-2',
        itemTitle: 'NetGuard Pro Diagnostic Suite',
        itemThumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        amount: 350,
        currency: 'BDT',
        status: 'PAID',
        paymentGateway: 'WhatsApp',
        paymentReference: 'WA-DIRECT-8812',
        transactionId: 'WA-TRX-8812',
        senderNumber: '01711223344',
        customerWhatsApp: '+8801711223344',
        createdAt: '2026-08-25T11:20:00.000Z',
        verifiedAt: '2026-08-25T11:25:00.000Z'
      }
    ];

    const initialDownloads: DownloadLog[] = [
      {
        id: 'dl-1',
        userId: 'usr-demo-1',
        userName: 'Shakib Rahman',
        userEmail: 'user@apphub.com',
        apkId: 'apk-1',
        apkTitle: 'CodeFlow Studio Mobile',
        apkVersion: 'v2.4.1',
        downloadedAt: '2026-08-21T14:22:00.000Z'
      },
      {
        id: 'dl-2',
        userId: 'usr-demo-1',
        userName: 'Shakib Rahman',
        userEmail: 'user@apphub.com',
        apkId: 'apk-2',
        apkTitle: 'NetGuard Pro Diagnostic Suite',
        apkVersion: 'v3.0.0',
        downloadedAt: '2026-08-22T08:15:00.000Z'
      }
    ];

    const initialData: DatabaseSchema = {
      users: initialUsers,
      categories: defaultCategories,
      apks: defaultApks,
      courses: defaultCourses,
      lessons: defaultLessons,
      orders: initialOrders,
      downloads: initialDownloads,
      purchases: initialPurchases,
      settings: defaultSettings
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getCategories(): Category[] { return this.data.categories; }
  public getApks(): ApkItem[] { return this.data.apks; }
  public getCourses(): CourseItem[] { return this.data.courses; }
  public getLessons(): Lesson[] { return this.data.lessons; }
  public getOrders(): Order[] { return this.data.orders; }
  public getDownloads(): DownloadLog[] { return this.data.downloads; }
  public getPurchases(): UserPurchase[] { return this.data.purchases; }
  public getSettings(): AppSettings { return this.data.settings; }

  // Setters / Mutators
  public updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  // User methods
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // APK methods
  public findApkById(id: string): ApkItem | undefined {
    return this.data.apks.find(a => a.id === id);
  }

  public addApk(apk: ApkItem): ApkItem {
    this.data.apks.unshift(apk);
    this.save();
    return apk;
  }

  public updateApk(id: string, updates: Partial<ApkItem>): ApkItem | null {
    const idx = this.data.apks.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.apks[idx] = { ...this.data.apks[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.apks[idx];
  }

  public deleteApk(id: string): boolean {
    const initialLen = this.data.apks.length;
    this.data.apks = this.data.apks.filter(a => a.id !== id);
    if (this.data.apks.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public incrementApkDownloads(id: string) {
    const apk = this.findApkById(id);
    if (apk) {
      apk.downloadsCount = (apk.downloadsCount || 0) + 1;
      this.save();
    }
  }

  // Course methods
  public findCourseById(id: string): CourseItem | undefined {
    return this.data.courses.find(c => c.id === id);
  }

  public addCourse(course: CourseItem): CourseItem {
    this.data.courses.unshift(course);
    this.save();
    return course;
  }

  public updateCourse(id: string, updates: Partial<CourseItem>): CourseItem | null {
    const idx = this.data.courses.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.courses[idx] = { ...this.data.courses[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.courses[idx];
  }

  public deleteCourse(id: string): boolean {
    const initialLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    // Also delete associated lessons
    this.data.lessons = this.data.lessons.filter(l => l.courseId !== id);
    if (this.data.courses.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Lesson methods
  public getLessonsForCourse(courseId: string): Lesson[] {
    return this.data.lessons
      .filter(l => l.courseId === courseId)
      .sort((a, b) => a.position - b.position);
  }

  public findLessonById(id: string): Lesson | undefined {
    return this.data.lessons.find(l => l.id === id);
  }

  public addLesson(lesson: Lesson): Lesson {
    this.data.lessons.push(lesson);
    // Update course totalLessons count
    const course = this.findCourseById(lesson.courseId);
    if (course) {
      course.totalLessons = this.data.lessons.filter(l => l.courseId === lesson.courseId).length;
    }
    this.save();
    return lesson;
  }

  public updateLesson(id: string, updates: Partial<Lesson>): Lesson | null {
    const idx = this.data.lessons.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.data.lessons[idx] = { ...this.data.lessons[idx], ...updates };
    this.save();
    return this.data.lessons[idx];
  }

  public deleteLesson(id: string): boolean {
    const lesson = this.findLessonById(id);
    if (!lesson) return false;
    const courseId = lesson.courseId;
    this.data.lessons = this.data.lessons.filter(l => l.id !== id);
    const course = this.findCourseById(courseId);
    if (course) {
      course.totalLessons = this.data.lessons.filter(l => l.courseId === courseId).length;
    }
    this.save();
    return true;
  }

  public reorderLessons(courseId: string, lessonIdsInOrder: string[]): Lesson[] {
    lessonIdsInOrder.forEach((id, index) => {
      const idx = this.data.lessons.findIndex(l => l.id === id && l.courseId === courseId);
      if (idx !== -1) {
        this.data.lessons[idx].position = index + 1;
      }
    });
    this.save();
    return this.getLessonsForCourse(courseId);
  }

  // Category methods
  public addCategory(cat: Category): Category {
    this.data.categories.push(cat);
    this.save();
    return cat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.save();
    return true;
  }

  // Order & Purchase methods
  public addOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.save();
    return order;
  }

  public findOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
    this.save();
    return this.data.orders[idx];
  }

  public unlockItemForUser(userId: string, itemType: 'apk' | 'course', itemId: string, orderId: string, amount: number): UserPurchase {
    const existing = this.data.purchases.find(p => p.userId === userId && p.itemType === itemType && p.itemId === itemId);
    if (existing) return existing;

    const purchase: UserPurchase = {
      id: `purch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      itemType,
      itemId,
      orderId,
      amount,
      purchasedAt: new Date().toISOString()
    };
    this.data.purchases.push(purchase);
    this.save();
    return purchase;
  }

  public userHasAccess(userId: string | null | undefined, itemType: 'apk' | 'course', itemId: string, accessType: 'FREE' | 'PAID'): boolean {
    if (accessType === 'FREE') return true;
    if (!userId) return false;
    // Check if user is admin (admin always has access)
    const user = this.findUserById(userId);
    if (user && user.role === 'admin') return true;
    // Check purchases
    return this.data.purchases.some(p => p.userId === userId && p.itemType === itemType && p.itemId === itemId);
  }

  public getUserPurchases(userId: string): UserPurchase[] {
    return this.data.purchases.filter(p => p.userId === userId);
  }

  public logDownload(log: Omit<DownloadLog, 'id' | 'downloadedAt'>): DownloadLog {
    const entry: DownloadLog = {
      id: `dl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...log,
      downloadedAt: new Date().toISOString()
    };
    this.data.downloads.unshift(entry);
    this.save();
    return entry;
  }

  // ==========================================
  // AUTO IMPORT SOURCES
  // ==========================================
  public getImportSources(): ImportSource[] {
    return this.data.importSources || [];
  }

  public findImportSourceById(id: string): ImportSource | undefined {
    return (this.data.importSources || []).find(s => s.id === id);
  }

  public addImportSource(source: ImportSource): ImportSource {
    if (!this.data.importSources) this.data.importSources = [];
    this.data.importSources.push(source);
    this.save();
    return source;
  }

  public updateImportSource(id: string, updates: Partial<ImportSource>): ImportSource | null {
    if (!this.data.importSources) this.data.importSources = [];
    const idx = this.data.importSources.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.importSources[idx] = { ...this.data.importSources[idx], ...updates };
    this.save();
    return this.data.importSources[idx];
  }

  public deleteImportSource(id: string): boolean {
    if (!this.data.importSources) return false;
    const initialLen = this.data.importSources.length;
    this.data.importSources = this.data.importSources.filter(s => s.id !== id);
    if (this.data.importSources.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ==========================================
  // AUTO IMPORT JOBS
  // ==========================================
  public getImportJobs(): ImportJob[] {
    return this.data.importJobs || [];
  }

  public findImportJobById(id: string): ImportJob | undefined {
    return (this.data.importJobs || []).find(j => j.id === id);
  }

  public addImportJob(job: ImportJob): ImportJob {
    if (!this.data.importJobs) this.data.importJobs = [];
    this.data.importJobs.unshift(job);
    // Keep last 100 jobs
    if (this.data.importJobs.length > 100) {
      this.data.importJobs = this.data.importJobs.slice(0, 100);
    }
    this.save();
    return job;
  }

  public updateImportJob(id: string, updates: Partial<ImportJob>): ImportJob | null {
    if (!this.data.importJobs) return null;
    const idx = this.data.importJobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    this.data.importJobs[idx] = { ...this.data.importJobs[idx], ...updates };
    this.save();
    return this.data.importJobs[idx];
  }

  // ==========================================
  // AUTO IMPORT ITEMS
  // ==========================================
  public getImportItems(): ImportItem[] {
    return this.data.importItems || [];
  }

  public findImportItemById(id: string): ImportItem | undefined {
    return (this.data.importItems || []).find(i => i.id === id);
  }

  public findImportItemByUrl(url: string): ImportItem | undefined {
    if (!url) return undefined;
    const cleanUrl = url.trim().toLowerCase();
    return (this.data.importItems || []).find(i => 
      i.sourceUrl?.trim().toLowerCase() === cleanUrl ||
      i.canonicalUrl?.trim().toLowerCase() === cleanUrl
    );
  }

  public findImportItemBySha256(checksum: string): ImportItem | undefined {
    if (!checksum) return undefined;
    return (this.data.importItems || []).find(i => i.sha256Checksum === checksum);
  }

  public addImportItem(item: ImportItem): ImportItem {
    if (!this.data.importItems) this.data.importItems = [];
    this.data.importItems.unshift(item);
    this.save();
    return item;
  }

  public updateImportItem(id: string, updates: Partial<ImportItem>): ImportItem | null {
    if (!this.data.importItems) return null;
    const idx = this.data.importItems.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.data.importItems[idx] = { ...this.data.importItems[idx], ...updates };
    this.save();
    return this.data.importItems[idx];
  }

  public deleteImportItem(id: string): boolean {
    if (!this.data.importItems) return false;
    const initialLen = this.data.importItems.length;
    this.data.importItems = this.data.importItems.filter(i => i.id !== id);
    if (this.data.importItems.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ==========================================
  // DUPLICATE DETECTION ENGINE
  // ==========================================
  public checkDuplicate(params: {
    sourceUrl?: string;
    canonicalUrl?: string;
    sha256Checksum?: string;
    title?: string;
    fileSize?: string;
  }): { isDuplicate: boolean; reason?: string; existingId?: string; existingTitle?: string } {
    const { sourceUrl, canonicalUrl, sha256Checksum, title } = params;

    // 1. Check by SHA-256 in APK catalog
    if (sha256Checksum) {
      const existingApkChecksum = this.data.apks.find(a => a.sha256Checksum && a.sha256Checksum.toLowerCase() === sha256Checksum.toLowerCase());
      if (existingApkChecksum) {
        return { isDuplicate: true, reason: `SHA-256 match with catalog APK: ${existingApkChecksum.title}`, existingId: existingApkChecksum.id, existingTitle: existingApkChecksum.title };
      }
      const existingImportChecksum = (this.data.importItems || []).find(i => i.sha256Checksum && i.sha256Checksum.toLowerCase() === sha256Checksum.toLowerCase());
      if (existingImportChecksum) {
        return { isDuplicate: true, reason: `SHA-256 match with existing import item: ${existingImportChecksum.title}`, existingId: existingImportChecksum.id, existingTitle: existingImportChecksum.title };
      }
    }

    // 2. Check by exact URL
    if (sourceUrl) {
      const cleanSrc = sourceUrl.trim().toLowerCase();
      const existingImportUrl = (this.data.importItems || []).find(i => 
        i.sourceUrl?.trim().toLowerCase() === cleanSrc || 
        i.canonicalUrl?.trim().toLowerCase() === cleanSrc
      );
      if (existingImportUrl) {
        return { isDuplicate: true, reason: `Source URL already imported: ${existingImportUrl.title}`, existingId: existingImportUrl.id, existingTitle: existingImportUrl.title };
      }
      const existingApkUrl = this.data.apks.find(a => a.fileUrl?.trim().toLowerCase() === cleanSrc);
      if (existingApkUrl) {
        return { isDuplicate: true, reason: `File URL already exists in APK catalog: ${existingApkUrl.title}`, existingId: existingApkUrl.id, existingTitle: existingApkUrl.title };
      }
    }

    // 3. Check by Title similarity
    if (title) {
      const normTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normTitle.length >= 6) {
        const existingApkTitle = this.data.apks.find(a => a.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle);
        if (existingApkTitle) {
          return { isDuplicate: true, reason: `Exact title match with catalog APK: ${existingApkTitle.title}`, existingId: existingApkTitle.id, existingTitle: existingApkTitle.title };
        }
        const existingCourseTitle = this.data.courses.find(c => c.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normTitle);
        if (existingCourseTitle) {
          return { isDuplicate: true, reason: `Exact title match with catalog Course: ${existingCourseTitle.title}`, existingId: existingCourseTitle.id, existingTitle: existingCourseTitle.title };
        }
      }
    }

    return { isDuplicate: false };
  }

  // ==========================================
  // PRICING RULES & SETTINGS
  // ==========================================
  public getPricingRules(): PricingRule[] {
    return this.data.pricingRules || defaultPricingRules;
  }

  public addPricingRule(rule: PricingRule): PricingRule {
    if (!this.data.pricingRules) this.data.pricingRules = [];
    this.data.pricingRules.push(rule);
    this.save();
    return rule;
  }

  public updatePricingRule(id: string, updates: Partial<PricingRule>): PricingRule | null {
    if (!this.data.pricingRules) return null;
    const idx = this.data.pricingRules.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.pricingRules[idx] = { ...this.data.pricingRules[idx], ...updates };
    this.save();
    return this.data.pricingRules[idx];
  }

  public deletePricingRule(id: string): boolean {
    if (!this.data.pricingRules) return false;
    const initialLen = this.data.pricingRules.length;
    this.data.pricingRules = this.data.pricingRules.filter(r => r.id !== id);
    if (this.data.pricingRules.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getPricingSettings(): PricingSettings {
    return this.data.pricingSettings || defaultPricingSettings;
  }

  public updatePricingSettings(updates: Partial<PricingSettings>): PricingSettings {
    this.data.pricingSettings = {
      ...(this.data.pricingSettings || defaultPricingSettings),
      ...updates
    };
    this.save();
    return this.data.pricingSettings;
  }

  // ==========================================
  // AUTO IMPORT AGGREGATE STATS
  // ==========================================
  public getAutoImportStats(): AutoImportStats {
    const items = this.data.importItems || [];
    return {
      totalImports: items.length,
      successfulImports: items.filter(i => i.status === 'PUBLISHED').length,
      failedImports: items.filter(i => i.status === 'FAILED').length,
      duplicates: items.filter(i => i.status === 'DUPLICATE').length,
      securityFailures: items.filter(i => i.securityStatus === 'FAILED' || i.status === 'SECURITY_REVIEW').length,
      publishedAutomatically: items.filter(i => i.status === 'PUBLISHED' && !i.reviewedAt).length,
      waitingForReview: items.filter(i => i.status === 'PENDING_REVIEW' || i.status === 'SECURITY_REVIEW').length
    };
  }
}

export const db = new DatabaseManager();
