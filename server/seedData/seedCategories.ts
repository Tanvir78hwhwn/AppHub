import { Category } from '../db';

export const seedCategories: Category[] = [
  { id: 'cat-games', name: 'Online Gaming & Esports', slug: 'online-gaming', description: 'Battle royale companions, game boosters, FPS trackers & esports tactical utilities', icon: 'Gamepad2', type: 'all' },
  { id: 'cat-gamedev', name: 'Game Development', slug: 'game-development', description: 'Unity 3D, Unreal Engine 5, Godot, C# & Roblox game creation masterclasses', icon: 'Sparkles', type: 'course' },
  { id: 'cat-dev', name: 'Developer Tools', slug: 'dev-tools', description: 'Essential utilities, compilers, terminal emulators, SDK wrappers and debug assistants', icon: 'Code', type: 'all' },
  { id: 'cat-android', name: 'Android Mastery', slug: 'android-mastery', description: 'Complete deep dive into Kotlin, Jetpack Compose, Flutter and mobile architectures', icon: 'Smartphone', type: 'course' },
  { id: 'cat-productivity', name: 'Productivity & Utilities', slug: 'productivity', description: 'Clean document suites, automation engines, planners and custom launchers', icon: 'CheckSquare', type: 'all' },
  { id: 'cat-web', name: 'Web & Full-Stack', slug: 'web-fullstack', description: 'React, Node.js, Express, Python AI, Next.js and cloud deployment courses', icon: 'Globe', type: 'course' },
  { id: 'cat-media', name: 'Media, Video & Audio', slug: 'media-audio', description: 'Pro video editors, audio equalizers, screen recorders and 4K media engines', icon: 'Video', type: 'all' },
  { id: 'cat-security', name: 'Security & Networking', slug: 'security-utilities', description: 'Network packet analyzers, DNS vaults, ethical hacking and system monitors', icon: 'ShieldCheck', type: 'all' }
];
