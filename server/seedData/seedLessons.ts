import { Lesson } from '../db';
import { seedCourses } from './seedCourses';

const sampleVideoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
];

export const seedLessons: Lesson[] = [];

seedCourses.forEach((course, courseIndex) => {
  const lessonCount = course.totalLessons || 3;
  for (let i = 1; i <= lessonCount; i++) {
    const videoUrl = sampleVideoUrls[(courseIndex * 3 + i - 1) % sampleVideoUrls.length];
    const durationMinutes = Math.floor(10 + ((courseIndex * 7 + i * 11) % 45));
    const durationSeconds = Math.floor((courseIndex * 13 + i * 17) % 60);
    const durationStr = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;

    seedLessons.push({
      id: `les-${course.id}-${i}`,
      courseId: course.id,
      title: `${i}. ${getLessonTitle(course.title, i)}`,
      description: `Comprehensive hands-on lesson covering essential concepts, practical demonstrations, and real-world examples for ${course.title}.`,
      videoUrl: videoUrl,
      duration: durationStr,
      position: i,
      isFreePreview: i === 1 || (course.accessType === 'FREE' && i === 2)
    });
  }
});

function getLessonTitle(courseTitle: string, lessonNum: number): string {
  const titles = [
    'Introduction, Fundamentals & Environment Setup',
    'Core Architecture, Components & Design Patterns',
    'Hands-on Practical Implementation & Coding',
    'Advanced Features, Optimization & Troubleshooting',
    'Testing, Security Verification & Best Practices',
    'Production Deployment, Release & Final Showcase'
  ];
  return titles[lessonNum - 1] || `Module Part ${lessonNum}: In-Depth Walkthrough`;
}
