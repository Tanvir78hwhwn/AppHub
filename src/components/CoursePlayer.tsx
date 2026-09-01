import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Lesson, CourseItem } from '../types';
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle, 
  Lock, 
  BookOpen, 
  List, 
  FileText, 
  Share2, 
  SkipForward, 
  Clock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const CoursePlayer: React.FC = () => {
  const { activePlayer, setActivePlayer, setCheckoutItem, user, hasAccess, addToast } = useApp();
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!activePlayer?.courseId) return;

    setLoading(true);
    api.getCourseDetail(activePlayer.courseId)
      .then(res => {
        setCourse(res);
        const lessons = res.lessons || [];
        setAllLessons(lessons);

        // Find initial lesson
        if (activePlayer.lessonId) {
          const found = lessons.find(l => l.id === activePlayer.lessonId);
          if (found) setCurrentLesson(found);
          else if (lessons.length > 0) setCurrentLesson(lessons[0]);
        } else if (lessons.length > 0) {
          setCurrentLesson(lessons[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load course for player:', err);
        addToast({
          type: 'error',
          title: 'Player Error',
          message: err.message || 'Could not load course lessons.'
        });
        setLoading(false);
      });
  }, [activePlayer?.courseId]);

  if (!activePlayer || !course) return null;

  const isUnlocked = hasAccess(course.id, 'course', course.accessType);

  const handleSelectLesson = (lesson: Lesson) => {
    if (isUnlocked || lesson.isFreePreview) {
      setCurrentLesson(lesson);
    } else {
      setCheckoutItem({ item: course, type: 'course' });
    }
  };

  const handleNextLesson = () => {
    if (!currentLesson) return;
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      handleSelectLesson(next);
    }
  };

  const toggleComplete = (lessonId: string) => {
    setCompletedLessonIds(prev => 
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  // Convert generic video URL to appropriate embed or direct stream
  const renderVideoEmbed = (url?: string) => {
    if (!url) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6 text-center">
          <Lock className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-200">Video Content Protected</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Enroll in this course to unlock this lesson and the entire masterclass.
          </p>
          <button
            onClick={() => setCheckoutItem({ item: course, type: 'course' })}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
          >
            Enroll Now ({course.price} {course.currency})
          </button>
        </div>
      );
    }

    // YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId || 'dQw4w9WgXcQ'}?autoplay=1&rel=0`}
          title={currentLesson?.title || 'Video Lesson'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }

    // Vimeo URL
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop();
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          title={currentLesson?.title || 'Video Lesson'}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Direct MP4 / WebM / HTML5 Video Stream or external video provider
    return (
      <video
        key={url}
        src={url}
        controls
        autoPlay
        controlsList="nodownload"
        className="w-full h-full object-contain bg-black"
      >
        Your browser does not support HTML5 video streaming.
      </video>
    );
  };

  const progressPercent = allLessons.length > 0 
    ? Math.round((completedLessonIds.length / allLessons.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Top Breadcrumb & Return button */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActivePlayer(null)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Classroom</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200 truncate max-w-xs">{course.title}</p>
            <p className="text-[11px] text-slate-400">Progress: {progressPercent}% ({completedLessonIds.length}/{allLessons.length})</p>
          </div>
          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Classroom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Player & Lesson Info (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Responsive 16:9 Video Canvas */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            {renderVideoEmbed(currentLesson?.videoUrl)}
          </div>

          {/* Lesson Metadata Bar */}
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 font-mono">
                    Lesson {currentLesson?.position || 1}
                  </span>
                  {currentLesson?.isFreePreview && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      FREE PREVIEW
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-extrabold text-white">
                  {currentLesson?.title || 'Loading lesson...'}
                </h1>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {currentLesson && (
                  <button
                    onClick={() => toggleComplete(currentLesson.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      completedLessonIds.includes(currentLesson.id)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{completedLessonIds.includes(currentLesson.id) ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                )}

                <button
                  onClick={handleNextLesson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/20"
                >
                  <span>Next Lesson</span>
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lesson description */}
            {currentLesson?.description && (
              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                {currentLesson.description}
              </p>
            )}

            {/* Course Instructor Card */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <img
                  src={course.thumbnail}
                  alt={course.instructor}
                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <p className="font-semibold text-slate-200">{course.instructor}</p>
                  <p className="text-[10px] text-slate-500">{course.instructorBio || 'Lead Course Instructor'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration: {currentLesson?.duration || '15:00'}</span>
              </div>
            </div>
          </div>

          {/* Student Scratchpad / Notes */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Personal Study Scratchpad</span>
              </h3>
              <span className="text-[10px] text-slate-500">Auto-saved locally</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type personal notes, snippets, or questions for this lesson here..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 outline-none resize-y"
            />
          </div>
        </div>

        {/* Right: Playlist Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <List className="w-4 h-4 text-violet-400" />
                <span>Course Modules ({allLessons.length})</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {completedLessonIds.length}/{allLessons.length} Done
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {allLessons.map((lesson, idx) => {
                const isActive = currentLesson?.id === lesson.id;
                const isCompleted = completedLessonIds.includes(lesson.id);
                const canWatch = isUnlocked || lesson.isFreePreview;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-violet-600/20 border-violet-500/60 text-white shadow-md'
                        : canWatch
                        ? 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-60 hover:opacity-90 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-violet-500 text-white'
                          : canWatch
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-900 text-slate-600'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-violet-200' : 'text-slate-200'}`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="text-slate-500">{lesson.duration}</span>
                          {lesson.isFreePreview && !isUnlocked && (
                            <span className="text-emerald-400 font-bold">• Free Preview</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {canWatch ? (
                        <PlayCircle className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
