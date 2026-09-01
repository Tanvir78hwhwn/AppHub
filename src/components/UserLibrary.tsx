import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ApkItem, CourseItem, DownloadLog, Order } from '../types';
import { 
  FolderLock, 
  Download, 
  PlayCircle, 
  History, 
  Receipt, 
  Sparkles, 
  Clock, 
  HardDrive, 
  CheckCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const UserLibrary: React.FC = () => {
  const { user, startDownload, setActivePlayer, setSelectedApk, setSelectedCourse } = useApp();
  const [activeTab, setActiveTab] = useState<'apks' | 'courses' | 'history' | 'orders'>('apks');
  const [loading, setLoading] = useState(true);

  const [purchasedApks, setPurchasedApks] = useState<ApkItem[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseItem[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<DownloadLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getUserLibrary(),
      api.getUserOrders()
    ])
      .then(([libraryRes, ordersRes]) => {
        if (isMounted) {
          setPurchasedApks(libraryRes.purchasedApks || []);
          setEnrolledCourses(libraryRes.enrolledCourses || []);
          setDownloadHistory(libraryRes.downloadHistory || []);
          setOrders(ordersRes.orders || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load user library data:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <FolderLock className="w-4 h-4" />
            <span>Personal Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            My Digital Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your unlocked APK files, enrolled video classrooms, and transaction receipts.
          </p>
        </div>

        {/* User Summary Pill */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shrink-0">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt={user?.name}
            className="w-10 h-10 rounded-xl bg-slate-800"
          />
          <div>
            <p className="text-xs font-bold text-slate-100">{user?.name}</p>
            <p className="text-[10px] text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'apks', label: 'My APK Downloads', count: purchasedApks?.length || 0, icon: <Download className="w-4 h-4" /> },
          { id: 'courses', label: 'Enrolled Masterclasses', count: enrolledCourses?.length || 0, icon: <PlayCircle className="w-4 h-4" /> },
          { id: 'history', label: 'Download Audit Log', count: downloadHistory?.length || 0, icon: <History className="w-4 h-4" /> },
          { id: 'orders', label: 'Invoices & Receipts', count: orders?.length || 0, icon: <Receipt className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: My APKs */}
          {activeTab === 'apks' && (
            <div>
              {(purchasedApks?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {purchasedApks.map((apk) => (
                    <div
                      key={apk.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={apk.thumbnail}
                          alt={apk.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            LIFETIME ACCESS
                          </span>
                          <h3 className="text-sm font-bold text-white truncate mt-1">{apk.title}</h3>
                          <p className="text-[11px] text-slate-400">v{apk.version} • {apk.fileSize}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedApk(apk)}
                          className="text-xs text-slate-400 hover:text-white font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => startDownload(apk)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download APK</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-slate-900/30 rounded-3xl border border-slate-800">
                  <Download className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-200">No Purchased APKs Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Explore our directory of verified Android developer tools and applications.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Enrolled Courses */}
          {activeTab === 'courses' && (
            <div>
              {(enrolledCourses?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-violet-500/40 transition-all shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-20 h-14 rounded-xl object-cover border border-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                            FULL ENROLLMENT
                          </span>
                          <h3 className="text-sm font-bold text-white truncate mt-1">{course.title}</h3>
                          <p className="text-[11px] text-slate-400">{course.instructor} • {course.totalLessons || 5} Lessons</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="text-xs text-slate-400 hover:text-white font-medium"
                        >
                          Syllabus
                        </button>
                        <button
                          onClick={() => setActivePlayer({ courseId: course.id })}
                          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/30 transition-all cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Watch Classroom</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-slate-900/30 rounded-3xl border border-slate-800">
                  <PlayCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-200">No Enrolled Courses Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Enroll in our video masterclasses to learn full-stack development.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Download History */}
          {activeTab === 'history' && (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Download Audit Trail
                </h3>
                <span className="text-[11px] text-slate-500">Secure record of all file downloads</span>
              </div>

              {(downloadHistory?.length || 0) > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {downloadHistory.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{log.apkTitle}</p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(log.downloadedAt).toLocaleString()} • IP: {log.ip || '127.0.0.1'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {log.apkVersion}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No download history recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Order Receipts */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Verified Payment Invoices
                </h3>
                <span className="text-[11px] text-slate-500">Official proof of purchases</span>
              </div>

              {(orders?.length || 0) > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-300">#{order.id.substring(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.status === 'PAID' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-200 mt-1">{order.itemTitle}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString()} via {order.paymentGateway}
                          {order.transactionId && ` • TrxID: ${order.transactionId}`}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-extrabold text-white font-mono">{order.amount} {order.currency}</p>
                        <p className="text-[10px] text-emerald-400">Verified & Fulfilled</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No orders or receipts found.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
