import { 
  User, 
  Category, 
  ApkItem, 
  CourseItem, 
  Lesson, 
  Order, 
  DownloadLog, 
  AppSettings, 
  AdminStats 
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('apphub_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = isJson && data && (data.error || data.message) ? (data.error || data.message) : `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(body: { name: string; email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse<{ message: string; token: string; user: User }>(res);
  },

  async login(body: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse<{ message: string; token: string; user: User }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ user: User; purchasedApkIds: string[]; enrolledCourseIds: string[] }>(res);
  },

  async updateProfile(body: { name: string; avatar?: string }) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse<{ message: string; user: User }>(res);
  },

  async changePassword(body: { currentPassword: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse<{ message: string }>(res);
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse<{ message: string; demoResetToken?: string }>(res);
  },

  async resetPassword(body: { email: string; resetToken: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return handleResponse<{ message: string }>(res);
  },

  // Public Content
  async getHomeContent() {
    const res = await fetch(`${API_BASE}/content/home`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{
      settings: Partial<AppSettings>;
      categories: Category[];
      stats: { totalApks: number; totalCourses: number; totalDownloads: number };
      featuredApks: ApkItem[];
      latestApks: ApkItem[];
      freeApks: ApkItem[];
      paidApks: ApkItem[];
      featuredCourses: CourseItem[];
      freeCourses: CourseItem[];
      paidCourses: CourseItem[];
      userPurchasedItemIds: string[];
    }>(res);
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse<Category[]>(res);
  },

  async getApks(params?: { search?: string; category?: string; accessType?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.accessType) query.set('accessType', params.accessType);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`${API_BASE}/apks?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ apks: ApkItem[]; total: number }>(res);
  },

  async getApkDetail(id: string) {
    const res = await fetch(`${API_BASE}/apks/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ApkItem & { hasAccess: boolean; isLoggedIn: boolean }>(res);
  },

  async generateApkDownloadToken(id: string) {
    const res = await fetch(`${API_BASE}/apks/${id}/generate-download-token`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{
      success: boolean;
      downloadUrl: string;
      fileName: string;
      fileSize: string;
      sha256Checksum?: string;
      expiresIn: string;
    }>(res);
  },

  async getCourses(params?: { search?: string; category?: string; accessType?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.accessType) query.set('accessType', params.accessType);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`${API_BASE}/courses?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ courses: CourseItem[]; total: number }>(res);
  },

  async getCourseDetail(id: string) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<CourseItem & { hasAccess: boolean; isLoggedIn: boolean; lessons: Lesson[] }>(res);
  },

  async getLessonPlayer(courseId: string, lessonId: string) {
    const res = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{
      lesson: Lesson;
      courseTitle: string;
      allLessons: { id: string; title: string; duration: string; position: number; isFreePreview: boolean; canWatch: boolean }[];
    }>(res);
  },

  // User Library & History
  async getUserLibrary() {
    const res = await fetch(`${API_BASE}/user/library`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{
      purchasedApks: ApkItem[];
      enrolledCourses: CourseItem[];
      downloadHistory: DownloadLog[];
      totalPurchases: number;
    }>(res);
  },

  async getUserOrders() {
    const res = await fetch(`${API_BASE}/user/orders`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ orders: Order[] }>(res);
  },

  // Orders & Payments
  async createOrder(body: { itemId: string; itemType: 'apk' | 'course'; paymentGateway?: string }) {
    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse<{ order: Order }>(res);
  },

  async initiatePayment(orderId: string, gateway: string) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/initiate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gateway })
    });
    return handleResponse<{ reference: string; instructions: string; merchantNumber?: string }>(res);
  },

  async verifyPayment(orderId: string, body: { transactionId?: string; senderNumber?: string; gateway?: string }) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse<{
      success: boolean;
      message: string;
      order: Order;
      receipt?: {
        orderId: string;
        transactionId: string;
        gateway: string;
        amount: number;
        currency: string;
        date: string;
      };
    }>(res);
  },

  // Admin APIs
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AdminStats>(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ users: User[] }>(res);
  },

  async updateAdminUserRole(id: string, role: 'admin' | 'user') {
    const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return handleResponse<{ message: string; user: User }>(res);
  },

  async deleteAdminUser(id: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminApks() {
    const res = await fetch(`${API_BASE}/admin/apks`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ apks: ApkItem[] }>(res);
  },

  async createAdminApk(data: Partial<ApkItem>) {
    const res = await fetch(`${API_BASE}/admin/apks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; apk: ApkItem }>(res);
  },

  async updateAdminApk(id: string, data: Partial<ApkItem>) {
    const res = await fetch(`${API_BASE}/admin/apks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; apk: ApkItem }>(res);
  },

  async deleteAdminApk(id: string) {
    const res = await fetch(`${API_BASE}/admin/apks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminCourses() {
    const res = await fetch(`${API_BASE}/admin/courses`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ courses: CourseItem[] }>(res);
  },

  async createAdminCourse(data: Partial<CourseItem>) {
    const res = await fetch(`${API_BASE}/admin/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; course: CourseItem }>(res);
  },

  async updateAdminCourse(id: string, data: Partial<CourseItem>) {
    const res = await fetch(`${API_BASE}/admin/courses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; course: CourseItem }>(res);
  },

  async deleteAdminCourse(id: string) {
    const res = await fetch(`${API_BASE}/admin/courses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminCourseLessons(courseId: string) {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/lessons`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ lessons: Lesson[] }>(res);
  },

  async createAdminLesson(courseId: string, data: Partial<Lesson>) {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; lesson: Lesson }>(res);
  },

  async updateAdminLesson(lessonId: string, data: Partial<Lesson>) {
    const res = await fetch(`${API_BASE}/admin/lessons/${lessonId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; lesson: Lesson }>(res);
  },

  async deleteAdminLesson(lessonId: string) {
    const res = await fetch(`${API_BASE}/admin/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async reorderAdminLessons(courseId: string, lessonIds: string[]) {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}/lessons/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lessonIds })
    });
    return handleResponse<{ message: string; lessons: Lesson[] }>(res);
  },

  async getAdminCategories() {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ categories: Category[] }>(res);
  },

  async createAdminCategory(data: Partial<Category>) {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; category: Category }>(res);
  },

  async updateAdminCategory(id: string, data: Partial<Category>) {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; category: Category }>(res);
  },

  async deleteAdminCategory(id: string) {
    const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminOrders() {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ orders: Order[] }>(res);
  },

  async createAdminManualOrder(data: {
    userName: string;
    userEmail: string;
    customerWhatsApp?: string;
    senderNumber?: string;
    itemId: string;
    itemType: 'apk' | 'course';
    amount?: number;
    paymentGateway?: string;
    transactionId?: string;
    status?: 'PENDING' | 'PAID';
    deliveryNotes?: string;
  }) {
    const res = await fetch(`${API_BASE}/admin/orders/manual`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string; order: Order }>(res);
  },

  async updateAdminOrderStatus(id: string, updates: {
    status: string;
    transactionId?: string;
    senderNumber?: string;
    customerWhatsApp?: string;
    deliveryNotes?: string;
  } | string) {
    const body = typeof updates === 'string' ? { status: updates } : updates;
    const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse<{ message: string; order: Order }>(res);
  },

  async getAdminSettings() {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ settings: AppSettings }>(res);
  },

  async updateAdminSettings(settings: Partial<AppSettings>) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse<{ message: string; settings: AppSettings }>(res);
  },

  async uploadFile(formData: FormData) {
    const token = localStorage.getItem('apphub_token');
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse<{
      message: string;
      apk?: { fileName: string; storedFileName: string; fileUrl: string; fileSize: string; checksum: string };
      thumbnail?: { fileName: string; url: string };
    }>(res);
  },

  // ==========================================
  // AUTO-IMPORT & UNIVERSAL IMPORTER API
  // ==========================================
  async detectImportResource(url: string, sourceId?: string) {
    const res = await fetch(`${API_BASE}/admin/importer/detect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, sourceId })
    });
    return handleResponse<{
      success: boolean;
      resource: any;
      duplicateInfo?: { isDuplicate: boolean; reason?: string; existingId?: string; existingTitle?: string };
      securityPreview?: { status: string; details: string };
      error?: string;
    }>(res);
  },

  async executeImport(itemData: any, sourceId?: string, forceAutoPublish?: boolean) {
    const res = await fetch(`${API_BASE}/admin/importer/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemData, sourceId, forceAutoPublish })
    });
    return handleResponse<{ message: string; item: any }>(res);
  },

  async getImportItems(params?: { status?: string; type?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/admin/importer/items?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ items: any[] }>(res);
  },

  async getAutoImportStats() {
    const res = await fetch(`${API_BASE}/admin/importer/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ stats: any }>(res);
  },

  async publishImportItem(id: string) {
    const res = await fetch(`${API_BASE}/admin/importer/items/${id}/publish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string; item: any }>(res);
  },

  async rejectImportItem(id: string) {
    const res = await fetch(`${API_BASE}/admin/importer/items/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string; item: any }>(res);
  },

  async updateImportItem(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/admin/importer/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse<{ message: string; item: any }>(res);
  },

  async deleteImportItem(id: string) {
    const res = await fetch(`${API_BASE}/admin/importer/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async enhanceMetadataWithAi(data: { rawTitle: string; rawDescription?: string; contentType?: string; sourceUrl?: string }) {
    const res = await fetch(`${API_BASE}/admin/importer/ai-enhance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ generated: any }>(res);
  },

  // Sources & Scheduler
  async getImportSources() {
    const res = await fetch(`${API_BASE}/admin/importer/sources`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ sources: any[] }>(res);
  },

  async addImportSource(source: any) {
    const res = await fetch(`${API_BASE}/admin/importer/sources`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(source)
    });
    return handleResponse<{ message: string; source: any }>(res);
  },

  async updateImportSource(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/admin/importer/sources/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse<{ message: string; source: any }>(res);
  },

  async deleteImportSource(id: string) {
    const res = await fetch(`${API_BASE}/admin/importer/sources/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async pollImportSourceNow(id: string) {
    const res = await fetch(`${API_BASE}/admin/importer/sources/${id}/poll-now`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string; jobs: any[] }>(res);
  },

  async getImportJobs() {
    const res = await fetch(`${API_BASE}/admin/importer/jobs`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ jobs: any[] }>(res);
  },

  async runSchedulerNow() {
    const res = await fetch(`${API_BASE}/admin/importer/scheduler/run-now`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string; jobs: any[] }>(res);
  },

  // Pricing Engine API
  async getPricingConfig() {
    const res = await fetch(`${API_BASE}/admin/pricing/config`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ settings: any; rules: any[] }>(res);
  },

  async updatePricingConfig(settings: any) {
    const res = await fetch(`${API_BASE}/admin/pricing/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse<{ message: string; settings: any }>(res);
  },

  async addPricingRule(rule: any) {
    const res = await fetch(`${API_BASE}/admin/pricing/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule)
    });
    return handleResponse<{ message: string; rule: any }>(res);
  },

  async updatePricingRule(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/admin/pricing/rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse<{ message: string; rule: any }>(res);
  },

  async deletePricingRule(id: string) {
    const res = await fetch(`${API_BASE}/admin/pricing/rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  }
};
