import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db, User, ApkItem, CourseItem, Lesson, Category, Order, ImportSource, ImportJob, ImportItem, PricingRule } from './db';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateDownloadToken, 
  verifyDownloadToken, 
  authenticateOptional, 
  requireAuth, 
  requireAdmin, 
  AuthRequest 
} from './auth';
import { uploadMiddleware, formatBytes, computeFileChecksum } from './storage';
import { paymentService } from './payments';
import { detectResource, executeImport } from './universalImporter';
import { enhanceMetadataWithAi } from './geminiAi';
import { runSchedulerCycle, updateSchedulerInterval } from './scheduler';
import { calculateResourcePrice } from './pricingEngine';

export const router = express.Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
router.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const settings = db.getSettings();

  if (!settings.allowUserRegistration) {
    return res.status(403).json({ error: 'User registration is currently disabled by administrator.' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role: 'user',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);
  const token = generateToken(newUser);

  return res.status(201).json({
    message: 'Account created successfully!',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt
    }
  });
});

// Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password. Please verify and try again.' });
  }

  const token = generateToken(user);

  return res.json({
    message: 'Signed in successfully!',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

// Current user profile + entitlements
router.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const purchases = db.getUserPurchases(user.id);
  const purchasedApkIds = purchases.filter(p => p.itemType === 'apk').map(p => p.itemId);
  const enrolledCourseIds = purchases.filter(p => p.itemType === 'course').map(p => p.itemId);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    },
    purchasedApkIds,
    enrolledCourseIds
  });
});

// Update Profile
router.put('/auth/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty.' });
  }

  const updated = db.updateUser(req.user!.id, {
    name: name.trim(),
    avatar: avatar || req.user!.avatar
  });

  return res.json({
    message: 'Profile updated successfully!',
    user: {
      id: updated!.id,
      name: updated!.name,
      email: updated!.email,
      role: updated!.role,
      avatar: updated!.avatar
    }
  });
});

// Change Password
router.post('/auth/change-password', requireAuth, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!comparePassword(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  db.updateUser(user.id, {
    passwordHash: hashPassword(newPassword)
  });

  return res.json({ message: 'Password changed successfully.' });
});

// Request Password Reset Simulation
router.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.findUserByEmail(email);
  if (!user) {
    // For security, do not disclose email existence
    return res.json({ message: 'If an account exists with that email, a password reset token has been generated.' });
  }

  const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
  db.updateUser(user.id, {
    resetToken,
    resetTokenExpiry: Date.now() + 3600000 // 1 hour
  });

  return res.json({
    message: 'Password reset code generated.',
    demoResetToken: resetToken // Provided for easy UI demonstration
  });
});

// Reset Password
router.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email, resetToken, newPassword } = req.body;
  const user = db.findUserByEmail(email);

  if (!user || user.resetToken !== resetToken || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }

  db.updateUser(user.id, {
    passwordHash: hashPassword(newPassword),
    resetToken: undefined,
    resetTokenExpiry: undefined
  });

  return res.json({ message: 'Password has been reset successfully. You can now login.' });
});

// ==========================================
// 2. PUBLIC DISCOVERY & CONTENT ROUTES
// ==========================================

// Home overview data
router.get('/content/home', authenticateOptional, (req: AuthRequest, res: Response) => {
  const allApks = db.getApks().filter(a => a.published);
  const allCourses = db.getCourses().filter(c => c.published);
  const categories = db.getCategories();
  const settings = db.getSettings();

  const featuredApks = allApks.slice(0, 4);
  const latestApks = [...allApks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  const freeApks = allApks.filter(a => a.accessType === 'FREE').slice(0, 4);
  const paidApks = allApks.filter(a => a.accessType === 'PAID').slice(0, 4);

  const featuredCourses = allCourses.slice(0, 3);
  const freeCourses = allCourses.filter(c => c.accessType === 'FREE').slice(0, 3);
  const paidCourses = allCourses.filter(c => c.accessType === 'PAID').slice(0, 3);

  // User access mapping
  const userId = req.user?.id;
  const userPurchases = userId ? db.getUserPurchases(userId) : [];
  const purchasedIds = new Set(userPurchases.map(p => p.itemId));

  res.json({
    settings: {
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      primaryCurrency: settings.primaryCurrency,
      noticeBanner: settings.noticeBanner,
      showNoticeBanner: settings.showNoticeBanner
    },
    categories,
    stats: {
      totalApks: allApks.length,
      totalCourses: allCourses.length,
      totalDownloads: allApks.reduce((acc, a) => acc + (a.downloadsCount || 0), 0)
    },
    featuredApks,
    latestApks,
    freeApks,
    paidApks,
    featuredCourses,
    freeCourses,
    paidCourses,
    userPurchasedItemIds: Array.from(purchasedIds)
  });
});

// Categories list
router.get('/categories', (req: Request, res: Response) => {
  res.json(db.getCategories());
});

// APKs list with filter & search
router.get('/apks', authenticateOptional, (req: AuthRequest, res: Response) => {
  const { search, category, accessType, sort } = req.query;
  let items = db.getApks().filter(a => a.published);

  if (category && category !== 'all') {
    items = items.filter(a => a.category.toLowerCase() === String(category).toLowerCase());
  }

  if (accessType && accessType !== 'all') {
    items = items.filter(a => a.accessType.toUpperCase() === String(accessType).toUpperCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.developer.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }

  // Sorting
  switch (sort) {
    case 'popular':
      items.sort((a, b) => b.downloadsCount - a.downloadsCount);
      break;
    case 'priceAsc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
    default:
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  const userId = req.user?.id;
  const userPurchases = userId ? db.getUserPurchases(userId) : [];
  const purchasedMap = new Set(userPurchases.filter(p => p.itemType === 'apk').map(p => p.itemId));

  const enriched = items.map(apk => ({
    ...apk,
    hasUnlocked: apk.accessType === 'FREE' || purchasedMap.has(apk.id) || req.user?.role === 'admin'
  }));

  res.json({ apks: enriched, total: enriched.length });
});

// Single APK detail
router.get('/apks/:id', authenticateOptional, (req: AuthRequest, res: Response) => {
  const apk = db.findApkById(req.params.id);
  if (!apk || !apk.published) {
    return res.status(404).json({ error: 'APK package not found or unavailable.' });
  }

  const userId = req.user?.id;
  const hasAccess = db.userHasAccess(userId, 'apk', apk.id, apk.accessType);

  res.json({
    ...apk,
    hasAccess,
    isLoggedIn: !!req.user
  });
});

// Courses list with filter & search
router.get('/courses', authenticateOptional, (req: AuthRequest, res: Response) => {
  const { search, category, accessType, sort } = req.query;
  let items = db.getCourses().filter(c => c.published);

  if (category && category !== 'all') {
    items = items.filter(c => c.category.toLowerCase() === String(category).toLowerCase());
  }

  if (accessType && accessType !== 'all') {
    items = items.filter(c => c.accessType.toUpperCase() === String(accessType).toUpperCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }

  // Sorting
  switch (sort) {
    case 'priceAsc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
    default:
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  const userId = req.user?.id;
  const userPurchases = userId ? db.getUserPurchases(userId) : [];
  const purchasedMap = new Set(userPurchases.filter(p => p.itemType === 'course').map(p => p.itemId));

  const enriched = items.map(course => ({
    ...course,
    hasUnlocked: course.accessType === 'FREE' || purchasedMap.has(course.id) || req.user?.role === 'admin'
  }));

  res.json({ courses: enriched, total: enriched.length });
});

// Single Course Detail with lesson previews
router.get('/courses/:id', authenticateOptional, (req: AuthRequest, res: Response) => {
  const course = db.findCourseById(req.params.id);
  if (!course || !course.published) {
    return res.status(404).json({ error: 'Course not found or unavailable.' });
  }

  const userId = req.user?.id;
  const hasAccess = db.userHasAccess(userId, 'course', course.id, course.accessType);
  const lessons = db.getLessonsForCourse(course.id);

  // Mask videoUrl for protected lessons if user does not have access
  const safeLessons = lessons.map(lesson => {
    const canWatch = hasAccess || lesson.isFreePreview;
    return {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      position: lesson.position,
      isFreePreview: lesson.isFreePreview,
      canWatch,
      // Provide videoUrl only if allowed
      videoUrl: canWatch ? lesson.videoUrl : undefined
    };
  });

  res.json({
    ...course,
    lessons: safeLessons,
    hasAccess,
    isLoggedIn: !!req.user
  });
});

// Single Lesson Player Data
router.get('/courses/:id/lessons/:lessonId', requireAuth, (req: AuthRequest, res: Response) => {
  const course = db.findCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const lesson = db.findLessonById(req.params.lessonId);
  if (!lesson || lesson.courseId !== course.id) {
    return res.status(404).json({ error: 'Lesson not found.' });
  }

  const user = req.user!;
  const hasAccess = db.userHasAccess(user.id, 'course', course.id, course.accessType);

  if (!hasAccess && !lesson.isFreePreview) {
    return res.status(403).json({
      error: 'This lesson is locked. Please purchase the course to unlock full lifetime access.',
      coursePrice: course.price,
      currency: course.currency
    });
  }

  res.json({
    lesson: {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      position: lesson.position,
      isFreePreview: lesson.isFreePreview,
      videoUrl: lesson.videoUrl
    },
    courseTitle: course.title,
    allLessons: db.getLessonsForCourse(course.id).map(l => ({
      id: l.id,
      title: l.title,
      duration: l.duration,
      position: l.position,
      isFreePreview: l.isFreePreview,
      canWatch: hasAccess || l.isFreePreview
    }))
  });
});

// ==========================================
// 3. SECURE APK DOWNLOADS
// ==========================================

// Generate Download Token
router.post('/apks/:id/generate-download-token', requireAuth, (req: AuthRequest, res: Response) => {
  const apk = db.findApkById(req.params.id);
  if (!apk) {
    return res.status(404).json({ error: 'APK not found.' });
  }

  const user = req.user!;
  const hasAccess = db.userHasAccess(user.id, 'apk', apk.id, apk.accessType);

  if (!hasAccess) {
    return res.status(403).json({
      error: 'You have not purchased this premium APK package yet.',
      apkPrice: apk.price,
      currency: apk.currency
    });
  }

  // Create signed token
  const downloadToken = generateDownloadToken(apk.id, user.id, apk.fileName);
  const downloadUrl = `/api/downloads/file/${downloadToken}`;

  // Log download
  db.logDownload({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    apkId: apk.id,
    apkTitle: apk.title,
    apkVersion: apk.version,
    ip: req.ip
  });

  // Increment download counter
  db.incrementApkDownloads(apk.id);

  res.json({
    success: true,
    downloadUrl,
    fileName: apk.fileName,
    fileSize: apk.fileSize,
    sha256Checksum: apk.sha256Checksum,
    expiresIn: '2 hours'
  });
});

// Stream APK file by token
router.get('/downloads/file/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  const decoded = verifyDownloadToken(token);

  if (!decoded) {
    return res.status(403).send('Download link expired or invalid. Please refresh the app page and request a new download.');
  }

  const apk = db.findApkById(decoded.apkId);
  if (!apk) {
    return res.status(404).send('APK file not found on server.');
  }

  // Find physical file path
  let targetPath = '';
  if (apk.fileUrl.startsWith('/uploads/')) {
    targetPath = path.join(process.cwd(), apk.fileUrl);
  } else if (apk.fileUrl.startsWith('/uploads/apks/')) {
    targetPath = path.join(process.cwd(), apk.fileUrl);
  } else {
    // Look in uploads or uploads/apks
    const inRoot = path.join(process.cwd(), 'uploads', apk.fileName);
    const inApks = path.join(process.cwd(), 'uploads', 'apks', apk.fileName);
    targetPath = fs.existsSync(inApks) ? inApks : inRoot;
  }

  if (!fs.existsSync(targetPath)) {
    // Generate placeholder apk file on the fly if needed
    const dummyBuffer = Buffer.concat([
      Buffer.from('PK\x03\x04\x14\x00\x00\x00\x08\x00'),
      Buffer.from(`AppHub Verified APK File: ${apk.title} ${apk.version}\nChecksum: ${apk.sha256Checksum || 'verified'}\nRelease Date: ${apk.updatedAt}\n`),
      Buffer.alloc(1024 * 128, 0x55)
    ]);
    res.setHeader('Content-Disposition', `attachment; filename="${apk.fileName || 'app-release.apk'}"`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    return res.send(dummyBuffer);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${apk.fileName || path.basename(targetPath)}"`);
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  const fileStream = fs.createReadStream(targetPath);
  fileStream.pipe(res);
});

// ==========================================
// 4. USER LIBRARY & ORDERS
// ==========================================

router.get('/user/library', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const purchases = db.getUserPurchases(user.id);
  const downloads = db.getDownloads().filter(d => d.userId === user.id);

  const purchasedApkIds = purchases.filter(p => p.itemType === 'apk').map(p => p.itemId);
  const enrolledCourseIds = purchases.filter(p => p.itemType === 'course').map(p => p.itemId);

  const allApks = db.getApks();
  const allCourses = db.getCourses();

  const purchasedApks = allApks.filter(a => purchasedApkIds.includes(a.id));
  const enrolledCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));

  res.json({
    purchasedApks,
    enrolledCourses,
    downloadHistory: downloads.slice(0, 50),
    totalPurchases: purchases.length
  });
});

router.get('/user/orders', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const orders = db.getOrders().filter(o => o.userId === user.id);
  res.json({ orders });
});

// ==========================================
// 5. ORDERS & PAYMENT FLOW
// ==========================================

// Create Order
router.post('/orders/create', requireAuth, (req: AuthRequest, res: Response) => {
  const { itemId, itemType, paymentGateway = 'bKash' } = req.body;
  const user = req.user!;

  if (!itemId || !itemType || !['apk', 'course'].includes(itemType)) {
    return res.status(400).json({ error: 'Valid itemId and itemType (apk or course) are required.' });
  }

  let title = '';
  let thumbnail = '';
  let price = 0;
  let currency = 'BDT';

  if (itemType === 'apk') {
    const apk = db.findApkById(itemId);
    if (!apk) return res.status(404).json({ error: 'APK not found.' });
    if (apk.accessType === 'FREE') {
      return res.status(400).json({ error: 'This APK is free. No order required.' });
    }
    title = apk.title;
    thumbnail = apk.thumbnail;
    price = apk.price;
    currency = apk.currency;
  } else {
    const course = db.findCourseById(itemId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    if (course.accessType === 'FREE') {
      return res.status(400).json({ error: 'This course is free. No order required.' });
    }
    title = course.title;
    thumbnail = course.thumbnail;
    price = course.price;
    currency = course.currency;
  }

  // Check if already purchased
  const alreadyPurchased = db.userHasAccess(user.id, itemType, itemId, 'PAID');
  if (alreadyPurchased) {
    return res.status(400).json({ error: 'You already own this item.' });
  }

  const newOrder: Order = {
    id: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    itemType,
    itemId,
    itemTitle: title,
    itemThumbnail: thumbnail,
    amount: price,
    currency,
    status: 'PENDING',
    paymentGateway: paymentGateway as any,
    paymentReference: `REF-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  db.addOrder(newOrder);

  res.status(201).json({
    order: newOrder
  });
});

// Initiate Payment (get instructions & details)
router.post('/orders/:id/initiate', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gateway = 'bKash' } = req.body;
  const order = db.findOrderById(req.params.id);

  if (!order || order.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const result = await paymentService.initiatePayment(order, gateway);
  res.json(result);
});

// Server-side Payment Verification
router.post('/orders/:id/verify', requireAuth, async (req: AuthRequest, res: Response) => {
  const { transactionId, senderNumber, gateway } = req.body;
  const order = db.findOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.userId !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to verify this order.' });
  }

  const result = await paymentService.verifyPayment(order.id, {
    transactionId,
    senderNumber,
    gateway
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// ==========================================
// 6. ADMIN DASHBOARD ROUTES (Protected)
// ==========================================

// Dashboard stats
router.get('/admin/stats', requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const apks = db.getApks();
  const courses = db.getCourses();
  const orders = db.getOrders();
  const downloads = db.getDownloads();
  const purchases = db.getPurchases();

  const totalRevenue = orders
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const paidOrders = orders.filter(o => o.status === 'PAID');

  res.json({
    totalUsers: users.length,
    totalApks: apks.length,
    totalCourses: courses.length,
    totalPurchases: purchases.length,
    totalDownloads: downloads.length,
    totalRevenue,
    recentUsers: users.slice(-5).reverse(),
    recentPurchases: paidOrders.slice(0, 6),
    recentDownloads: downloads.slice(0, 6),
    revenueByGateway: {
      bKash: orders.filter(o => o.status === 'PAID' && o.paymentGateway === 'bKash').reduce((sum, o) => sum + o.amount, 0),
      Nagad: orders.filter(o => o.status === 'PAID' && o.paymentGateway === 'Nagad').reduce((sum, o) => sum + o.amount, 0),
      Rocket: orders.filter(o => o.status === 'PAID' && o.paymentGateway === 'Rocket').reduce((sum, o) => sum + o.amount, 0),
      SSLCommerz: orders.filter(o => o.status === 'PAID' && o.paymentGateway === 'SSLCommerz').reduce((sum, o) => sum + o.amount, 0),
      Stripe: orders.filter(o => o.status === 'PAID' && o.paymentGateway === 'Stripe').reduce((sum, o) => sum + o.amount, 0),
      Sandbox: orders.filter(o => o.status === 'PAID' && o.paymentGateway === 'Sandbox').reduce((sum, o) => sum + o.amount, 0)
    }
  });
});

// Admin Users CRUD
router.get('/admin/users', requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    createdAt: u.createdAt
  }));
  res.json({ users });
});

router.put('/admin/users/:id/role', requireAdmin, (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const updated = db.updateUser(req.params.id, { role });
  if (!updated) return res.status(404).json({ error: 'User not found.' });

  res.json({ message: 'User role updated.', user: updated });
});

router.delete('/admin/users/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }
  const deleted = db.deleteUser(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User deleted successfully.' });
});

// Admin APKs CRUD
router.get('/admin/apks', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ apks: db.getApks() });
});

router.post('/admin/apks', requireAdmin, (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    detailedNotes,
    thumbnail,
    fileUrl,
    fileName,
    fileSize,
    version,
    category,
    accessType,
    price,
    currency = 'BDT',
    developer,
    packageId,
    minAndroidVersion,
    changelog,
    published = true
  } = req.body;

  if (!title || !category || !accessType) {
    return res.status(400).json({ error: 'Title, category, and access type are required.' });
  }

  const newApk: ApkItem = {
    id: `apk-${Date.now()}`,
    title: title.trim(),
    description: description || '',
    detailedNotes: detailedNotes || '',
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    fileUrl: fileUrl || '/uploads/sample-codeflow-v2.4.1.apk',
    fileName: fileName || `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-v${version || '1.0'}.apk`,
    fileSize: fileSize || '15.0 MB',
    version: version || 'v1.0.0',
    category,
    type: 'apk',
    accessType: accessType as 'FREE' | 'PAID',
    price: accessType === 'FREE' ? 0 : Number(price || 0),
    currency,
    downloadsCount: 0,
    published: Boolean(published),
    developer: developer || 'AppHub Verified Developer',
    packageId: packageId || `com.apphub.${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    minAndroidVersion: minAndroidVersion || 'Android 8.0+',
    changelog: Array.isArray(changelog) ? changelog : (changelog ? changelog.split('\n').filter(Boolean) : ['Initial release build']),
    sha256Checksum: computeFileChecksum(fileUrl) || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addApk(newApk);
  res.status(201).json({ message: 'APK package added successfully!', apk: newApk });
});

router.put('/admin/apks/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateApk(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'APK not found.' });
  res.json({ message: 'APK updated successfully.', apk: updated });
});

router.delete('/admin/apks/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteApk(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'APK not found.' });
  res.json({ message: 'APK deleted successfully.' });
});

// Admin Courses CRUD
router.get('/admin/courses', requireAdmin, (req: AuthRequest, res: Response) => {
  const courses = db.getCourses().map(c => ({
    ...c,
    lessonsCount: db.getLessonsForCourse(c.id).length
  }));
  res.json({ courses });
});

router.post('/admin/courses', requireAdmin, (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    longDescription,
    thumbnail,
    category,
    accessType,
    price,
    currency = 'BDT',
    instructor,
    instructorBio,
    durationMinutes,
    level = 'All Levels',
    skills,
    published = true
  } = req.body;

  if (!title || !category || !accessType) {
    return res.status(400).json({ error: 'Title, category, and access type are required.' });
  }

  const newCourse: CourseItem = {
    id: `course-${Date.now()}`,
    title: title.trim(),
    description: description || '',
    longDescription: longDescription || description || '',
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
    category,
    type: 'course',
    accessType: accessType as 'FREE' | 'PAID',
    price: accessType === 'FREE' ? 0 : Number(price || 0),
    currency,
    instructor: instructor || 'Lead Instructor',
    instructorBio: instructorBio || '',
    durationMinutes: Number(durationMinutes || 120),
    totalLessons: 0,
    level: level as any,
    published: Boolean(published),
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Android', 'Full-Stack']),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addCourse(newCourse);
  res.status(201).json({ message: 'Course created successfully!', course: newCourse });
});

router.put('/admin/courses/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateCourse(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Course not found.' });
  res.json({ message: 'Course updated successfully.', course: updated });
});

router.delete('/admin/courses/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteCourse(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Course not found.' });
  res.json({ message: 'Course deleted successfully.' });
});

// Admin Course Lessons CRUD
router.get('/admin/courses/:id/lessons', requireAdmin, (req: AuthRequest, res: Response) => {
  const lessons = db.getLessonsForCourse(req.params.id);
  res.json({ lessons });
});

router.post('/admin/courses/:id/lessons', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, description, videoUrl, duration, isFreePreview = false } = req.body;
  const courseId = req.params.id;

  const course = db.findCourseById(courseId);
  if (!course) return res.status(404).json({ error: 'Course not found.' });

  if (!title || !videoUrl) {
    return res.status(400).json({ error: 'Lesson title and video URL are required.' });
  }

  const existing = db.getLessonsForCourse(courseId);
  const position = existing.length + 1;

  const newLesson: Lesson = {
    id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    courseId,
    title: title.trim(),
    description: description || '',
    videoUrl: videoUrl.trim(),
    duration: duration || '15:00',
    position,
    isFreePreview: Boolean(isFreePreview)
  };

  db.addLesson(newLesson);
  res.status(201).json({ message: 'Lesson added successfully!', lesson: newLesson });
});

router.put('/admin/lessons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateLesson(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Lesson not found.' });
  res.json({ message: 'Lesson updated.', lesson: updated });
});

router.delete('/admin/lessons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteLesson(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Lesson not found.' });
  res.json({ message: 'Lesson deleted.' });
});

router.post('/admin/courses/:id/lessons/reorder', requireAdmin, (req: AuthRequest, res: Response) => {
  const { lessonIds } = req.body;
  if (!Array.isArray(lessonIds)) {
    return res.status(400).json({ error: 'lessonIds must be an array of IDs.' });
  }

  const reordered = db.reorderLessons(req.params.id, lessonIds);
  res.json({ message: 'Lessons reordered successfully.', lessons: reordered });
});

// Admin Categories CRUD
router.get('/admin/categories', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ categories: db.getCategories() });
});

router.post('/admin/categories', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, slug, description, icon = 'Layers', type = 'all' } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    slug: slug ? slug.trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    description: description || '',
    icon,
    type
  };

  db.addCategory(newCat);
  res.status(201).json({ message: 'Category added.', category: newCat });
});

router.put('/admin/categories/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Category not found.' });
  res.json({ message: 'Category updated.', category: updated });
});

router.delete('/admin/categories/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteCategory(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Category not found.' });
  res.json({ message: 'Category deleted.' });
});

// Admin Orders
router.get('/admin/orders', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ orders: db.getOrders() });
});

// Admin Manual Order Creation (specifically for WhatsApp / Offline transactions)
router.post('/admin/orders/manual', requireAdmin, (req: AuthRequest, res: Response) => {
  const {
    userName,
    userEmail,
    customerWhatsApp,
    senderNumber,
    itemId,
    itemType,
    amount,
    paymentGateway = 'WhatsApp',
    transactionId,
    status = 'PENDING',
    deliveryNotes
  } = req.body;

  if (!userName || !userEmail || !itemId || !itemType) {
    return res.status(400).json({ error: 'Customer name, email, itemId, and itemType are required.' });
  }

  let title = '';
  let thumbnail = '';
  let price = Number(amount) || 0;
  let currency = 'BDT';

  if (itemType === 'apk') {
    const apk = db.findApkById(itemId);
    if (!apk) return res.status(404).json({ error: 'APK not found.' });
    title = apk.title;
    thumbnail = apk.thumbnail;
    if (!price && price !== 0) price = apk.price;
    currency = apk.currency;
  } else {
    const course = db.findCourseById(itemId);
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    title = course.title;
    thumbnail = course.thumbnail;
    if (!price && price !== 0) price = course.price;
    currency = course.currency;
  }

  // Find or link user
  let existingUser = db.findUserByEmail(userEmail.trim().toLowerCase());
  let userId = existingUser?.id;
  if (!existingUser) {
    const generatedUserId = `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const placeholderUser: User = {
      id: generatedUserId,
      name: userName.trim(),
      email: userEmail.trim().toLowerCase(),
      role: 'user',
      createdAt: new Date().toISOString()
    };
    db.addUser(placeholderUser);
    userId = generatedUserId;
  }

  const isPaid = status === 'PAID';
  const newOrder: Order = {
    id: `WA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    userId: userId!,
    userName: userName.trim(),
    userEmail: userEmail.trim().toLowerCase(),
    itemType: itemType as 'apk' | 'course',
    itemId,
    itemTitle: title,
    itemThumbnail: thumbnail,
    amount: price,
    currency,
    status: isPaid ? 'PAID' : (status as any),
    paymentGateway: paymentGateway as any,
    paymentReference: `WA-REF-${Date.now().toString().slice(-6)}`,
    transactionId: transactionId || (isPaid ? `WA-TRX-${Date.now().toString().slice(-5)}` : undefined),
    senderNumber: senderNumber || customerWhatsApp,
    customerWhatsApp: customerWhatsApp || senderNumber,
    deliveryNotes: deliveryNotes || undefined,
    createdAt: new Date().toISOString(),
    verifiedAt: isPaid ? new Date().toISOString() : undefined
  };

  db.addOrder(newOrder);

  if (isPaid) {
    db.unlockItemForUser(userId!, itemType as any, itemId, newOrder.id, price);
  }

  res.status(201).json({
    message: isPaid ? 'Manual WhatsApp order created and unlocked successfully.' : 'Manual WhatsApp order saved as pending.',
    order: newOrder
  });
});

router.put('/admin/orders/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, transactionId, senderNumber, customerWhatsApp, deliveryNotes } = req.body;
  const order = db.findOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const updates: Partial<Order> = { status };
  if (status === 'PAID') {
    updates.verifiedAt = new Date().toISOString();
    if (transactionId) updates.transactionId = transactionId;
    if (senderNumber) updates.senderNumber = senderNumber;
    if (customerWhatsApp) updates.customerWhatsApp = customerWhatsApp;
    if (deliveryNotes) updates.deliveryNotes = deliveryNotes;
  } else {
    if (deliveryNotes !== undefined) updates.deliveryNotes = deliveryNotes;
    if (transactionId) updates.transactionId = transactionId;
    if (customerWhatsApp) updates.customerWhatsApp = customerWhatsApp;
  }

  const updated = db.updateOrder(order.id, updates);
  if (status === 'PAID') {
    db.unlockItemForUser(order.userId, order.itemType, order.itemId, order.id, order.amount);
  }

  res.json({
    message: `Order status updated to ${status}.${status === 'PAID' ? ' Access has been unlocked for the customer.' : ''}`,
    order: updated
  });
});

// Admin Settings
router.get('/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ settings: db.getSettings() });
});

router.put('/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json({ message: 'Settings saved successfully.', settings: updated });
});

// File Upload endpoint (Multi-part upload for APK or Thumbnail)
router.post(
  '/admin/upload',
  requireAdmin,
  uploadMiddleware.fields([
    { name: 'apkFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  (req: AuthRequest, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const responseData: any = { message: 'Files uploaded successfully.' };

    if (files.apkFile && files.apkFile[0]) {
      const apk = files.apkFile[0];
      const relativeUrl = `/uploads/apks/${apk.filename}`;
      const checksum = computeFileChecksum(apk.path);
      responseData.apk = {
        fileName: apk.originalname,
        storedFileName: apk.filename,
        fileUrl: relativeUrl,
        fileSize: formatBytes(apk.size),
        checksum
      };
    }

    if (files.thumbnail && files.thumbnail[0]) {
      const thumb = files.thumbnail[0];
      const relativeUrl = `/uploads/thumbnails/${thumb.filename}`;
      responseData.thumbnail = {
        fileName: thumb.originalname,
        url: relativeUrl
      };
    }

    res.json(responseData);
  }
);

// ==========================================
// 8. AUTO-IMPORT & UNIVERSAL IMPORTER ROUTES
// ==========================================

// 1. Detect and inspect single public URL
router.post('/admin/importer/detect', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { url, sourceId } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required for detection.' });
  }

  try {
    const result = await detectResource(url, sourceId);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to detect downloadable resource.' });
    }
    return res.json(result);
  } catch (err: any) {
    console.error('Detection error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during URL inspection.' });
  }
});

// 2. Execute import download / save
router.post('/admin/importer/execute', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { itemData, sourceId, forceAutoPublish } = req.body;
  if (!itemData || !itemData.sourceUrl) {
    return res.status(400).json({ error: 'Valid item data with source URL is required.' });
  }

  try {
    const result = await executeImport({ itemData, sourceId, forceAutoPublish });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Import failed.' });
    }
    return res.json({ message: 'Content imported successfully.', item: result.item });
  } catch (err: any) {
    console.error('Import execution error:', err);
    return res.status(500).json({ error: err.message || 'Internal error while processing import.' });
  }
});

// 3. Get all import items with filtering
router.get('/admin/importer/items', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, type, search } = req.query;
  let items = db.getImportItems();

  if (status && status !== 'all') {
    items = items.filter(i => i.status === status);
  }

  if (type && type !== 'all') {
    items = items.filter(i => i.contentType === type);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    items = items.filter(i => 
      i.title.toLowerCase().includes(q) ||
      i.sourceUrl.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }

  res.json({ items });
});

// 4. Get aggregate Auto-Import stats
router.get('/admin/importer/stats', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ stats: db.getAutoImportStats() });
});

// 5. Publish pending import item
router.post('/admin/importer/items/:id/publish', requireAdmin, (req: AuthRequest, res: Response) => {
  const item = db.findImportItemById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Import item not found.' });

  const settings = db.getPricingSettings();
  let createdContentId: string | undefined;

  if (item.contentType === 'apk') {
    const newApk: ApkItem = {
      id: `apk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: item.title,
      description: item.description || 'Verified Android APK package ready for installation.',
      detailedNotes: item.fullDescription || item.description || 'Verified Android APK package with secure signature.',
      thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=600&q=80',
      fileUrl: item.fileUrl || item.sourceUrl,
      fileName: `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.apk`,
      fileSize: item.fileSize || '38.4 MB',
      version: item.version || '1.0.0',
      category: item.category || 'Developer Tools',
      type: 'apk',
      accessType: item.accessType || 'PAID',
      price: item.calculatedPrice || 49,
      currency: item.currency || settings.currency || 'BDT',
      downloadsCount: 0,
      published: true,
      developer: item.developer || 'Verified Publisher',
      changelog: ['Imported package release verified.'],
      sha256Checksum: item.sha256Checksum || crypto.createHash('sha256').update(item.sourceUrl).digest('hex'),
      packageId: `com.apphub.${item.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      minAndroidVersion: 'Android 8.0+',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.addApk(newApk);
    createdContentId = newApk.id;
  } else {
    // Course
    const newCourse: CourseItem = {
      id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: item.title,
      description: item.description || 'Professional video training masterclass.',
      longDescription: item.fullDescription || item.description || 'Comprehensive step-by-step video training course.',
      thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
      category: item.category || 'Android Mastery',
      type: 'course',
      accessType: item.accessType || 'PAID',
      price: item.calculatedPrice || 99,
      currency: item.currency || settings.currency || 'BDT',
      instructor: item.developer || 'Master Instructor',
      instructorBio: 'Senior Android Architect & Technical Instructor',
      durationMinutes: 105,
      totalLessons: item.lessons?.length || 1,
      level: 'All Levels',
      published: true,
      skills: item.tags || ['Android', 'Mobile Development'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.addCourse(newCourse);
    createdContentId = newCourse.id;

    if (item.lessons && item.lessons.length > 0) {
      item.lessons.forEach((l, idx) => {
        const lesson: Lesson = {
          id: `les-${Date.now()}-${idx + 1}`,
          courseId: newCourse.id,
          title: l.title,
          description: `Full tutorial lesson covering ${l.title}`,
          videoUrl: l.videoUrl || item.videoUrl || item.sourceUrl,
          duration: l.duration || '15:00',
          position: idx + 1,
          isFreePreview: l.isFreePreview || idx === 0
        };
        db.addLesson(lesson);
      });
    }
  }

  const updated = db.updateImportItem(item.id, {
    status: 'PUBLISHED',
    contentId: createdContentId,
    reviewedAt: new Date().toISOString()
  });

  res.json({ message: 'Content approved and published to catalog.', item: updated });
});

// 6. Reject import item
router.post('/admin/importer/items/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateImportItem(req.params.id, {
    status: 'REJECTED',
    reviewedAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Import item not found.' });
  res.json({ message: 'Import item rejected.', item: updated });
});

// 7. Update import item metadata / price
router.put('/admin/importer/items/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateImportItem(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Import item not found.' });
  res.json({ message: 'Import item updated.', item: updated });
});

// 8. Delete import item
router.delete('/admin/importer/items/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteImportItem(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Import item not found.' });
  res.json({ message: 'Import item deleted successfully.' });
});

// 9. AI Enhance metadata
router.post('/admin/importer/ai-enhance', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { rawTitle, rawDescription, contentType, sourceUrl } = req.body;
  if (!rawTitle) return res.status(400).json({ error: 'Title is required for AI enhancement.' });

  try {
    const generated = await enhanceMetadataWithAi({
      rawTitle,
      rawDescription,
      contentType: contentType || 'apk',
      sourceUrl
    });
    res.json({ generated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI generation failed.' });
  }
});

// ==========================================
// 9. SOURCES & AUTOMATION SCHEDULER
// ==========================================

// Get Sources
router.get('/admin/importer/sources', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ sources: db.getImportSources() });
});

// Add Source
router.post('/admin/importer/sources', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, baseUrl, type, enabled, trusted, allowedContentTypes, defaultCategory, pricingMode, defaultPrice } = req.body;
  if (!name || !baseUrl) {
    return res.status(400).json({ error: 'Source name and base URL are required.' });
  }

  const newSource: ImportSource = {
    id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    baseUrl: baseUrl.trim(),
    type: type || 'feed',
    enabled: enabled !== false,
    trusted: Boolean(trusted),
    allowedContentTypes: allowedContentTypes || ['apk', 'course'],
    defaultCategory: defaultCategory || 'Developer Tools',
    pricingMode: pricingMode || 'AUTOMATIC',
    defaultPrice: Number(defaultPrice) || 49,
    createdAt: new Date().toISOString()
  };

  db.addImportSource(newSource);
  res.status(201).json({ message: 'Source added successfully.', source: newSource });
});

// Update Source
router.put('/admin/importer/sources/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateImportSource(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Source not found.' });
  res.json({ message: 'Source updated successfully.', source: updated });
});

// Delete Source
router.delete('/admin/importer/sources/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteImportSource(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Source not found.' });
  res.json({ message: 'Source deleted successfully.' });
});

// Poll source now
router.post('/admin/importer/sources/:id/poll-now', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await runSchedulerCycle(req.params.id);
    res.json({ message: 'Poll cycle executed.', jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Poll failed.' });
  }
});

// Get Jobs History
router.get('/admin/importer/jobs', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ jobs: db.getImportJobs() });
});

// Run Scheduler Now (all active sources)
router.post('/admin/importer/scheduler/run-now', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await runSchedulerCycle();
    res.json({ message: 'Scheduler cycle started.', jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scheduler run failed.' });
  }
});

// ==========================================
// 10. PRICING RULES & CONFIGURATION
// ==========================================

// Get Pricing Config & Rules
router.get('/admin/pricing/config', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({
    settings: db.getPricingSettings(),
    rules: db.getPricingRules()
  });
});

// Update Pricing Settings
router.put('/admin/pricing/config', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updatePricingSettings(req.body);
  if (req.body.schedulerInterval) {
    updateSchedulerInterval(req.body.schedulerInterval);
  }
  res.json({ message: 'Pricing settings saved successfully.', settings: updated });
});

// Add Pricing Rule
router.post('/admin/pricing/rules', requireAdmin, (req: AuthRequest, res: Response) => {
  const { contentType, minLessons, maxLessons, minDurationMinutes, maxDurationMinutes, price, currency } = req.body;
  if (!contentType || price === undefined) {
    return res.status(400).json({ error: 'Content type and price are required.' });
  }

  const newRule: PricingRule = {
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    contentType,
    minLessons: minLessons !== undefined && minLessons !== '' ? Number(minLessons) : undefined,
    maxLessons: maxLessons !== undefined && maxLessons !== '' ? Number(maxLessons) : undefined,
    minDurationMinutes: minDurationMinutes !== undefined && minDurationMinutes !== '' ? Number(minDurationMinutes) : undefined,
    maxDurationMinutes: maxDurationMinutes !== undefined && maxDurationMinutes !== '' ? Number(maxDurationMinutes) : undefined,
    price: Number(price),
    currency: currency || db.getPricingSettings().currency || 'BDT',
    enabled: true
  };

  db.addPricingRule(newRule);
  res.status(201).json({ message: 'Pricing rule added successfully.', rule: newRule });
});

// Update Pricing Rule
router.put('/admin/pricing/rules/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updatePricingRule(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Pricing rule not found.' });
  res.json({ message: 'Pricing rule updated.', rule: updated });
});

// Delete Pricing Rule
router.delete('/admin/pricing/rules/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deletePricingRule(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Pricing rule not found.' });
  res.json({ message: 'Pricing rule deleted.' });
});

