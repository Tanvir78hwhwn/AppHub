import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NoticeBanner } from './components/NoticeBanner';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { HomeView } from './components/HomeView';
import { ApkExplorer } from './components/ApkExplorer';
import { CourseExplorer } from './components/CourseExplorer';
import { UserLibrary } from './components/UserLibrary';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CoursePlayer } from './components/CoursePlayer';
import { ApkDetailModal } from './components/ApkDetailModal';
import { CourseDetailModal } from './components/CourseDetailModal';
import { PaymentModal } from './components/PaymentModal';
import { AuthModal } from './components/AuthModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { UserProfile } from './components/UserProfile';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';

const AppContent: React.FC = () => {
  const { activeTab, activePlayer } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Banner Notice */}
      <NoticeBanner />

      {/* Main Global Navigation */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* If user is inside a video classroom */}
        {activePlayer ? (
          <CoursePlayer />
        ) : (
          <>
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'apks' && <ApkExplorer />}
            {activeTab === 'courses' && <CourseExplorer />}
            {activeTab === 'free' && <ApkExplorer />}
            {activeTab === 'library' && <UserLibrary />}
            {activeTab === 'admin' && <AdminDashboard />}
          </>
        )}
      </main>

      {/* Global Modals */}
      <ApkDetailModal />
      <CourseDetailModal />
      <PaymentModal />
      <AuthModal />
      <ForgotPasswordModal />
      <UserProfile />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Footer */}
      <Footer />

      {/* Direct WhatsApp Ordering Floating Button */}
      <WhatsAppFloatingButton />

      {/* Mobile Bottom Navigation for phones & Android devices */}
      <MobileNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
