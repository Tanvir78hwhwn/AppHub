import React from 'react';
import { CourseItem } from '../types';
import { useApp } from '../context/AppContext';
import { PlayCircle, CheckCircle2, Clock, BookOpen, Tag, Sparkles, User } from 'lucide-react';

interface CourseCardProps {
  course: CourseItem;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { setSelectedCourse, setActivePlayer, setCheckoutItem, hasAccess } = useApp();
  const isUnlocked = hasAccess(course.id, 'course', course.accessType);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnlocked) {
      setActivePlayer({ courseId: course.id });
    } else {
      setCheckoutItem({ item: course, type: 'course' });
    }
  };

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return hours > 0 ? `${hours}h ${m > 0 ? `${m}m` : ''}` : `${mins} mins`;
  };

  return (
    <div
      id={`course-card-${course.id}`}
      onClick={() => setSelectedCourse(course)}
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/40 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-violet-950/30 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Image & Badges */}
      <div>
        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3.5 bg-slate-950 border border-slate-800">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

          {/* Access Badge (FREE or PAID) */}
          <div className="absolute top-2.5 right-2.5">
            {course.accessType === 'FREE' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-md">
                <Sparkles className="w-3 h-3" />
                FREE COURSE
              </span>
            ) : isUnlocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-500/90 text-white backdrop-blur-md shadow-md">
                <CheckCircle2 className="w-3 h-3" />
                ENROLLED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-md font-mono">
                {course.price} {course.currency}
              </span>
            )}
          </div>

          {/* Category Chip & Lesson count overlay */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-md">
              {course.category}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-950/80 text-violet-300 border border-violet-500/30 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.totalLessons || course.lessonsCount || 5} Lessons
            </span>
          </div>
        </div>

        {/* Title and Short Description */}
        <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-violet-300 transition-colors line-clamp-1 mb-1">
          {course.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {course.description}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-300 font-medium">{course.instructor}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-[11px]">{course.level}</span>
        </div>
      </div>

      {/* Footer Meta & Action */}
      <div className="pt-3 border-t border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            {formatDuration(course.durationMinutes || 180)}
          </span>
          <div className="flex items-center gap-1">
            {course.skills?.slice(0, 2).map((skill, idx) => (
              <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <button
          id={`btn-course-action-${course.id}`}
          onClick={handleAction}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isUnlocked
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {isUnlocked ? (
            <>
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Watch Course</span>
            </>
          ) : (
            <>
              <Tag className="w-3.5 h-3.5" />
              <span>Enroll ({course.price} {course.currency})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
