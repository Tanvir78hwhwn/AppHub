import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CourseItem, Lesson } from '../types';
import { getWhatsAppBuyUrl, redirectToWhatsApp, ADMIN_NAME, ADMIN_WHATSAPP_NUMBER } from '../utils/whatsapp';
import { 
  X, 
  PlayCircle, 
  Lock, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  User, 
  Sparkles, 
  Tag, 
  Check, 
  Play, 
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  CreditCard
} from 'lucide-react';

export const CourseDetailModal: React.FC = () => {
  const { selectedCourse, setSelectedCourse, setActivePlayer, setCheckoutItem, hasAccess, user, settings, addToast } = useApp();
  const [courseData, setCourseData] = useState<CourseItem & { lessons: Lesson[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const adminName = settings?.adminName || ADMIN_NAME;
  const adminWhatsApp = settings?.adminWhatsApp || ADMIN_WHATSAPP_NUMBER;

  useEffect(() => {
    if (!selectedCourse) {
      setCourseData(null);
      return;
    }

    setLoading(true);
    api.getCourseDetail(selectedCourse.id)
      .then(res => {
        setCourseData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load course details:', err);
        setLoading(false);
      });
  }, [selectedCourse]);

  if (!selectedCourse) return null;

  const isUnlocked = hasAccess(selectedCourse.id, 'course', selectedCourse.accessType);

  const handleBuyOnWhatsApp = () => {
    const url = getWhatsAppBuyUrl({
      item: selectedCourse,
      type: 'course',
      user,
      phone: adminWhatsApp,
      adminName
    });

    // Automatically redirect user to WhatsApp Web or WhatsApp App
    redirectToWhatsApp(url);

    addToast({
      type: 'success',
      title: 'Redirecting to WhatsApp...',
      message: `Connecting with ${adminName} (${adminWhatsApp}) to enroll in this course.`
    });
  };

  const handleAction = () => {
    if (isUnlocked || selectedCourse.accessType === 'FREE') {
      setActivePlayer({ courseId: selectedCourse.id });
      setSelectedCourse(null);
    } else {
      // Auto-generate WhatsApp message and redirect immediately
      handleBuyOnWhatsApp();
    }
  };

  const handleOpenAlternativeCheckout = () => {
    setCheckoutItem({ item: selectedCourse, type: 'course' });
  };

  const handlePlayLesson = (lesson: Lesson) => {
    if (isUnlocked || lesson.isFreePreview || selectedCourse.accessType === 'FREE') {
      setActivePlayer({ courseId: selectedCourse.id, lessonId: lesson.id });
      setSelectedCourse(null);
    } else {
      handleBuyOnWhatsApp();
    }
  };

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return hours > 0 ? `${hours}h ${m > 0 ? `${m}m` : ''}` : `${mins} mins`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={() => setSelectedCourse(null)} 
      />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 my-8">
        {/* Header Image */}
        <div className="relative h-60 sm:h-72 w-full bg-slate-950">
          <img
            src={selectedCourse.thumbnail}
            alt={selectedCourse.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <button
            onClick={() => setSelectedCourse(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-950/90 text-violet-300 border border-violet-500/30 backdrop-blur-md">
              {selectedCourse.category}
            </span>

            {selectedCourse.accessType === 'FREE' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                100% FREE COURSE
              </span>
            ) : isUnlocked ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-violet-500 text-white shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ENROLLED & UNLOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-mono shadow-md">
                {selectedCourse.price} {selectedCourse.currency}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Instructor */}
          <div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              {selectedCourse.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="text-slate-200 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-violet-400" />
                {selectedCourse.instructor}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {formatDuration(selectedCourse.durationMinutes || 240)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                {selectedCourse.totalLessons || 5} Structured Lessons
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                {selectedCourse.level}
              </span>
            </div>
          </div>

          {/* Description & Long Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Course Overview</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedCourse.description}
            </p>
            {selectedCourse.longDescription && (
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {selectedCourse.longDescription}
              </p>
            )}
          </div>

          {/* Skills Covered */}
          {selectedCourse.skills && selectedCourse.skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills You Will Master</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCourse.skills.map((skill, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-violet-950/40 text-violet-300 border border-violet-500/30 font-medium">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum / Lessons Outline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Course Curriculum ({courseData?.lessons?.length || selectedCourse.totalLessons || 0} Lessons)
              </h4>
              <span className="text-[11px] text-slate-500">
                {isUnlocked ? 'All lessons unlocked' : 'Free previews available'}
              </span>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-slate-950/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {courseData?.lessons?.map((lesson, idx) => {
                  const canWatch = isUnlocked || lesson.isFreePreview;
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handlePlayLesson(lesson)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        canWatch
                          ? 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800 hover:border-violet-500/50'
                          : 'bg-slate-950/30 border-slate-800/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          canWatch ? 'bg-violet-600/20 text-violet-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {canWatch ? <Play className="w-3.5 h-3.5 fill-current" /> : <Lock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {lesson.title}
                          </p>
                          {lesson.description && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{lesson.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.isFreePreview && !isUnlocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            FREE PREVIEW
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">{lesson.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-400">Enrollment & Access</p>
              <p className="text-base font-extrabold text-white font-mono">
                {selectedCourse.accessType === 'FREE' ? 'Free Access' : `${selectedCourse.price} ${selectedCourse.currency}`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {isUnlocked ? (
                <button
                  id="modal-course-action-btn"
                  onClick={handleAction}
                  className="py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Watching Now</span>
                </button>
              ) : selectedCourse.accessType === 'FREE' ? (
                <button
                  id="modal-course-action-btn"
                  onClick={handleAction}
                  className="py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Free Course</span>
                </button>
              ) : (
                <>
                  <button
                    id="modal-course-action-btn"
                    onClick={handleAction}
                    className="py-3 px-6 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    title="Click to auto-generate WhatsApp message and redirect directly to WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Enroll on WhatsApp ({selectedCourse.price} {selectedCourse.currency})</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAlternativeCheckout}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                    title="Pay with bKash, Nagad, or Cards directly"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Other Payment Methods</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
